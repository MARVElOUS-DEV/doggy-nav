import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Stage, Layer, Line, Group } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';

import type { BookmarkGraphNode } from './utils/bookmarkParser';
import FolderNodeCanvas from './CanvasNodes/FolderNodeCanvas';
import BookmarkNodeCanvas from './CanvasNodes/BookmarkNodeCanvas';
import type { Position } from './BookmarkGraphCanvasConfig';
import { BOOKMARK_SIZE, FOLDER_DEFAULT_SIZE } from './BookmarkGraphCanvasConfig';

const getNodeAbsolutePosition = (
  node: BookmarkGraphNode,
  nodesById: Map<string, BookmarkGraphNode>,
  cache: Map<string, Position>
): Position => {
  const cached = cache.get(node.id);
  if (cached) return cached;

  if (!node.parentNode) {
    const pos = { x: node.position.x, y: node.position.y };
    cache.set(node.id, pos);
    return pos;
  }

  const parent = nodesById.get(node.parentNode);
  if (!parent) {
    const pos = { x: node.position.x, y: node.position.y };
    cache.set(node.id, pos);
    return pos;
  }

  const parentAbs = getNodeAbsolutePosition(parent, nodesById, cache);
  const pos = { x: parentAbs.x + node.position.x, y: parentAbs.y + node.position.y };
  cache.set(node.id, pos);
  return pos;
};

const getNodeSize = (node: BookmarkGraphNode) => {
  if (node.type === 'folder') {
    const width =
      node.style && typeof node.style.width === 'number'
        ? (node.style.width as number)
        : FOLDER_DEFAULT_SIZE.width;
    const height =
      node.style && typeof node.style.height === 'number'
        ? (node.style.height as number)
        : FOLDER_DEFAULT_SIZE.height;
    return { width, height };
  }
  return { width: BOOKMARK_SIZE.width, height: BOOKMARK_SIZE.height };
};

// Bookmark grid & pagination constants (must stay in sync with layout.ts)
const BOOKMARK_GRID_COLS = 3;
const BOOKMARK_GRID_COL_GAP = 16;
const BOOKMARK_GRID_ROW_GAP = 12;
const BOOKMARK_GRID_TOP = 80;
const PADDING = 20;

const MAX_BOOKMARK_ROWS = Math.max(
  1,
  Math.floor(
    (FOLDER_DEFAULT_SIZE.height - BOOKMARK_GRID_TOP - PADDING) /
      (BOOKMARK_SIZE.height + BOOKMARK_GRID_ROW_GAP)
  )
);
const BOOKMARKS_PER_PAGE = BOOKMARK_GRID_COLS * MAX_BOOKMARK_ROWS;

interface ViewState {
  scale: number;
  position: Position;
}

interface BookmarkGraphCanvasProps {
  nodes: BookmarkGraphNode[];
  setNodes: React.Dispatch<React.SetStateAction<BookmarkGraphNode[]>>;
  layoutVersion: number;
  initialView?: ViewState;
  onViewChange?: (view: ViewState) => void;
  searchTerm?: string;
  onDeleteNode?: (nodeId: string) => void;
  onRenameNode?: (nodeId: string) => void;
}

const BookmarkGraphCanvas: React.FC<BookmarkGraphCanvasProps> = ({
  nodes,
  setNodes,
  layoutVersion,
  initialView,
  onViewChange,
  searchTerm = '',
  onDeleteNode,
  onRenameNode,
}) => {
  const [stageScale, setStageScale] = useState(() => initialView?.scale ?? 1);
  const [stagePosition, setStagePosition] = useState<Position>(
    () => initialView?.position ?? { x: 0, y: 0 }
  );
  const [stageSize, setStageSize] = useState<{ width: number; height: number }>(() => ({
    width: typeof window === 'undefined' ? 800 : window.innerWidth,
    height: typeof window === 'undefined' ? 600 : window.innerHeight,
  }));
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState<Position | null>(null);
  const [folderPages, setFolderPages] = useState<Record<string, number>>({});
  const [reparentSourceFolderId, setReparentSourceFolderId] = useState<string | null>(null);

  // ... (resize effect) ...
  useEffect(() => {
    const handleResize = () => {
      setStageSize({ width: window.innerWidth, height: window.innerHeight });
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setStageScale(1);
    setStagePosition({ x: 0, y: 0 });
  }, [layoutVersion]);

  useEffect(() => {
    if (!onViewChange) return;
    onViewChange({ scale: stageScale, position: stagePosition });
  }, [stageScale, stagePosition, onViewChange]);

  const nodesById = useMemo(() => new Map(nodes.map((n) => [n.id, n] as const)), [nodes]);

  const absolutePositions = useMemo(() => {
    const cache = new Map<string, Position>();
    const result = new Map<string, Position>();
    nodes.forEach((n) => {
      result.set(n.id, getNodeAbsolutePosition(n, nodesById, cache));
    });
    return result;
  }, [nodes, nodesById]);

  // ... (reparentFolder, handleNodeDragEnd, etc.) ...
  const reparentFolder = useCallback(
    (sourceId: string, targetId: string) => {
      if (sourceId === targetId) return;

      setNodes((prev) => {
        const localNodesById = new Map(prev.map((n) => [n.id, n] as const));
        const source = localNodesById.get(sourceId);
        const target = localNodesById.get(targetId);

        if (!source || !target) return prev;
        if (source.type !== 'folder' || target.type !== 'folder') return prev;

        const isDescendant = (id: string, possibleAncestor: string): boolean => {
          const node = localNodesById.get(id);
          if (!node || !node.parentNode) return false;
          if (node.parentNode === possibleAncestor) return true;
          return isDescendant(node.parentNode, possibleAncestor);
        };

        // Prevent creating cycles
        if (isDescendant(targetId, sourceId)) {
          return prev;
        }

        const cache = new Map<string, Position>();
        const getAbs = (node: BookmarkGraphNode): Position =>
          getNodeAbsolutePosition(node, localNodesById, cache);

        const sourceAbs = getAbs(source);
        const targetAbs = getAbs(target);

        const rel = {
          x: sourceAbs.x - targetAbs.x,
          y: sourceAbs.y - targetAbs.y,
        };

        return prev.map((n) => {
          if (n.id !== sourceId) return n;
          return {
            ...n,
            parentNode: targetId,
            extent: 'parent',
            position: rel,
          };
        });
      });
    },
    [setNodes]
  );

  const handleNodeDragEnd = useCallback(
    (nodeId: string, evt: KonvaEventObject<DragEvent>) => {
      const absX = evt.target.x();
      const absY = evt.target.y();

      setNodes((prev) => {
        const localNodesById = new Map(prev.map((n) => [n.id, n] as const));
        const cache = new Map<string, Position>();
        const getAbs = (node: BookmarkGraphNode): Position =>
          getNodeAbsolutePosition(node, localNodesById, cache);

        const dragged = localNodesById.get(nodeId);
        if (!dragged) return prev;
        // For folders: dragging only changes position, not hierarchy
        if (dragged.type === 'folder') {
          return prev.map((node) => {
            if (node.id !== nodeId) return node;
            const updated: BookmarkGraphNode = { ...node };

            if (dragged.parentNode) {
              const parent = localNodesById.get(dragged.parentNode);
              if (parent) {
                const parentAbs = getAbs(parent);
                updated.position = {
                  x: absX - parentAbs.x,
                  y: absY - parentAbs.y,
                };
              } else {
                updated.position = { x: absX, y: absY };
              }
            } else {
              updated.position = { x: absX, y: absY };
            }

            // Do not touch parentNode/extent for folders; hierarchy is controlled via junctions
            return updated;
          });
        }

        // For bookmarks: dragging can still change parent folder
        const folders = prev.filter((n) => n.type === 'folder' && n.id !== nodeId);

        let targetFolder: BookmarkGraphNode | undefined;
        for (const folder of folders) {
          const folderPos = getAbs(folder);
          const width =
            folder.style && typeof folder.style.width === 'number'
              ? (folder.style.width as number)
              : FOLDER_DEFAULT_SIZE.width;
          const height =
            folder.style && typeof folder.style.height === 'number'
              ? (folder.style.height as number)
              : FOLDER_DEFAULT_SIZE.height;

          if (
            absX >= folderPos.x &&
            absX <= folderPos.x + width &&
            absY >= folderPos.y &&
            absY <= folderPos.y + height
          ) {
            targetFolder = folder;
            break;
          }
        }

        return prev.map((node) => {
          if (node.id !== nodeId) return node;
          const updated: BookmarkGraphNode = { ...node };

          if (targetFolder) {
            const folderAbs = getAbs(targetFolder);
            updated.parentNode = targetFolder.id;
            updated.extent = 'parent';
            updated.position = { x: absX - folderAbs.x, y: absY - folderAbs.y };
          } else {
            updated.parentNode = undefined;
            updated.extent = undefined;
            updated.position = { x: absX, y: absY };
          }

          return updated;
        });
      });
    },
    [setNodes]
  );

  const handleNodeClick = useCallback((id: string) => {
    setSelectedNodeId(id);
  }, []);

  const handleFolderJunctionClick = useCallback(
    (folderId: string) => {
      setReparentSourceFolderId((current) => {
        if (current && current !== folderId) {
          reparentFolder(current, folderId);
          return null;
        }
        return current === folderId ? null : folderId;
      });
    },
    [reparentFolder]
  );

  const handleFolderDoubleClick = useCallback(
    (folderId: string) => {
      const node = nodesById.get(folderId);
      if (!node) return;

      const absPos = absolutePositions.get(folderId);
      if (!absPos) return;

      const folderSize = getNodeSize(node);
      const stageW = stageSize.width;
      const stageH = stageSize.height;

      // Calculate desired scale to fit folder with some padding
      const padding = 40;
      const scaleX = stageW / (folderSize.width + padding * 5);
      const scaleY = stageH / (folderSize.height + padding * 2);
      const newScale = Math.min(scaleX, scaleY, 1.3); // Don't zoom in too much (max 1.3)

      // Calculate position to center the folder
      // Center of folder in stage coordinates:
      // folderCenterX * scale + stageX = stageW / 2
      // stageX = stageW / 2 - folderCenterX * scale

      const folderCenterX = absPos.x + folderSize.width / 2 + padding * 2;
      const folderCenterY = absPos.y + folderSize.height / 2 + padding;

      const newX = stageW / 2 - folderCenterX * newScale;
      const newY = stageH / 2 - folderCenterY * newScale;

      setStageScale(newScale);
      setStagePosition({ x: newX, y: newY });
    },
    [nodesById, absolutePositions, stageSize]
  );

  const handleStageMouseDown = useCallback((evt: KonvaEventObject<MouseEvent>) => {
    const stage = evt.target.getStage();
    if (!stage) return;
    if (evt.target === stage) {
      setSelectedNodeId(null);
      const pointer = stage.getPointerPosition();
      if (!pointer) return;
      setIsPanning(true);
      setLastPanPoint({ x: pointer.x, y: pointer.y });
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedNodeId) return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        const idToDelete = selectedNodeId;
        setNodes((nds) => {
          const idsToDelete = new Set<string>([idToDelete]);
          const findChildren = (parentNode: string) => {
            nds.forEach((n) => {
              if (n.parentNode === parentNode) {
                idsToDelete.add(n.id);
                findChildren(n.id);
              }
            });
          };
          findChildren(idToDelete);
          return nds.filter((n) => !idsToDelete.has(n.id));
        });
        setSelectedNodeId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeId, setNodes]);

  const handleStageWheel = useCallback(
    (evt: KonvaEventObject<WheelEvent>) => {
      evt.evt.preventDefault();
      const stage = evt.target.getStage();
      if (!stage) return;

      const scaleBy = 1.05;
      const oldScale = stageScale;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const mousePointTo = {
        x: (pointer.x - stagePosition.x) / oldScale,
        y: (pointer.y - stagePosition.y) / oldScale,
      };

      const direction = evt.evt.deltaY > 0 ? 1 : -1;
      const newScale = direction > 0 ? oldScale / scaleBy : oldScale * scaleBy;

      setStageScale(newScale);
      setStagePosition({
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      });
    },
    [stageScale, stagePosition]
  );

  const handleStageMouseMove = useCallback(
    (evt: KonvaEventObject<MouseEvent>) => {
      if (!isPanning || !lastPanPoint) return;
      const stage = evt.target.getStage();
      if (!stage) return;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const dx = pointer.x - lastPanPoint.x;
      const dy = pointer.y - lastPanPoint.y;

      setStagePosition((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
      setLastPanPoint({ x: pointer.x, y: pointer.y });
    },
    [isPanning, lastPanPoint]
  );

  useEffect(() => {
    const handleWindowMouseUp = () => {
      setIsPanning(false);
      setLastPanPoint(null);
    };

    window.addEventListener('mouseup', handleWindowMouseUp);
    return () => window.removeEventListener('mouseup', handleWindowMouseUp);
  }, []);

  // Search matching logic
  const matchingNodeIds = useMemo(() => {
    if (!searchTerm) return null; // null means no search active (all visible)
    const lower = searchTerm.toLowerCase();
    const matches = new Set<string>();

    nodes.forEach((node) => {
      const labelMatch = node.data.label.toLowerCase().includes(lower);
      const urlMatch = node.data.url?.toLowerCase().includes(lower);
      if (labelMatch || urlMatch) {
        matches.add(node.id);
        // Also match all ancestors
        let parent = node.parentNode;
        while (parent) {
          matches.add(parent);
          const pNode = nodesById.get(parent);
          parent = pNode?.parentNode;
        }
      }
    });
    return matches;
  }, [nodes, searchTerm, nodesById]);

  const visibleNodes = useMemo(() => nodes.filter((n) => !n.hidden), [nodes]);
  const folderNodes = useMemo(
    () => visibleNodes.filter((n) => n.type === 'folder'),
    [visibleNodes]
  );

  const pagination = useMemo(() => {
    const perFolder = new Map<string, BookmarkGraphNode[]>();

    visibleNodes.forEach((node) => {
      if (node.type === 'bookmark' && node.parentNode) {
        if (!perFolder.has(node.parentNode)) {
          perFolder.set(node.parentNode, []);
        }
        perFolder.get(node.parentNode)!.push(node);
      }
    });

    const folderMeta = new Map<string, { totalPages: number }>();
    const bookmarkPageIndex = new Map<string, number>();

    perFolder.forEach((list, folderId) => {
      const sorted = [...list].sort(
        (a, b) =>
          a.position.y - b.position.y ||
          a.position.x - b.position.x ||
          a.data.label.localeCompare(b.data.label)
      );

      const totalPages = Math.max(1, Math.ceil(sorted.length / BOOKMARKS_PER_PAGE));
      folderMeta.set(folderId, { totalPages });

      sorted.forEach((bookmark, idx) => {
        const pageIndex = Math.floor(idx / BOOKMARKS_PER_PAGE);
        bookmarkPageIndex.set(bookmark.id, pageIndex);
      });
    });

    return { folderMeta, bookmarkPageIndex };
  }, [visibleNodes]);

  const folderPageMeta = pagination.folderMeta;
  const bookmarkPageIndex = pagination.bookmarkPageIndex;

  const folderCurrentPages = useMemo(() => {
    const map = new Map<string, number>();
    folderPageMeta.forEach((meta, folderId) => {
      const total = meta.totalPages || 1;
      const stored = folderPages[folderId] ?? 0;
      const clamped = Math.min(Math.max(stored, 0), total - 1);
      map.set(folderId, clamped);
    });
    return map;
  }, [folderPageMeta, folderPages]);

  const bookmarkNodes = useMemo(
    () =>
      visibleNodes.filter((n) => {
        if (n.type !== 'bookmark') return false;
        // Root bookmarks are always visible, not paginated
        if (!n.parentNode) return true;
        const currentPage = folderCurrentPages.get(n.parentNode) ?? 0;
        const nodePage = bookmarkPageIndex.get(n.id) ?? 0;
        return nodePage === currentPage;
      }),
    [visibleNodes, folderCurrentPages, bookmarkPageIndex]
  );

  const connectorLines = useMemo(() => {
    const lines: { id: string; points: number[]; isDimmed: boolean }[] = [];
    // We only want to draw lines between folders, NOT between folders and bookmarks

    visibleNodes.forEach((child) => {
      if (!child.parentNode) return;

      // SKIP bookmarks - no lines for them
      if (child.type === 'bookmark') return;

      const parent = nodesById.get(child.parentNode);
      if (!parent || parent.hidden) return;

      const parentPos = absolutePositions.get(parent.id);
      const childPos = absolutePositions.get(child.id);
      if (!parentPos || !childPos) return;

      const parentSize = getNodeSize(parent);
      const childSize = getNodeSize(child);

      const fromX = parentPos.x + parentSize.width / 2;
      const fromY = parentPos.y + parentSize.height;
      const toX = childPos.x + childSize.width / 2;
      const toY = childPos.y;

      const isDimmed = matchingNodeIds ? !matchingNodeIds.has(child.id) : false;

      lines.push({
        id: `${parent.id}-${child.id}`,
        points: [fromX, fromY, toX, toY],
        isDimmed,
      });
    });

    return lines;
  }, [visibleNodes, nodesById, absolutePositions, matchingNodeIds]);

  return (
    <Stage
      width={stageSize.width}
      height={stageSize.height}
      scaleX={stageScale}
      scaleY={stageScale}
      x={stagePosition.x}
      y={stagePosition.y}
      onWheel={handleStageWheel}
      onMouseDown={handleStageMouseDown}
      onMouseMove={handleStageMouseMove}
    >
      <Layer>
        {connectorLines.map((line) => (
          <Line
            key={line.id}
            points={line.points}
            stroke={line.isDimmed ? '#E2E8F0' : '#94A3B8'}
            strokeWidth={3}
            lineCap="round"
            lineJoin="round"
            opacity={line.isDimmed ? 0.3 : 1}
          />
        ))}

        {folderNodes.map((node) => {
          const pos = absolutePositions.get(node.id) ?? node.position;
          const isSelected = selectedNodeId === node.id;
          const meta = folderPageMeta.get(node.id);
          const totalPages = meta?.totalPages ?? 1;
          const currentPage = folderCurrentPages.get(node.id) ?? 0;
          const isDimmed = matchingNodeIds ? !matchingNodeIds.has(node.id) : false;

          return (
            <Group key={node.id} opacity={isDimmed ? 0.3 : 1}>
              <FolderNodeCanvas
                node={node}
                x={pos.x}
                y={pos.y}
                isSelected={isSelected}
                onDragEnd={handleNodeDragEnd}
                onClick={handleNodeClick}
                page={currentPage}
                totalPages={totalPages}
                onPageChange={(newPage) => {
                  setFolderPages((prev) => ({
                    ...prev,
                    [node.id]: Math.max(0, Math.min(newPage, totalPages - 1)),
                  }));
                }}
                isReparentSource={reparentSourceFolderId === node.id}
                onJunctionClick={() => handleFolderJunctionClick(node.id)}
                onDelete={() => onDeleteNode?.(node.id)}
                onRename={() => onRenameNode?.(node.id)}
                onDoubleClick={() => handleFolderDoubleClick(node.id)}
              />
            </Group>
          );
        })}

        {bookmarkNodes.map((node) => {
          const pos = absolutePositions.get(node.id) ?? node.position;
          const isSelected = selectedNodeId === node.id;
          const isDimmed = matchingNodeIds ? !matchingNodeIds.has(node.id) : false;

          return (
            <Group key={node.id} opacity={isDimmed ? 0.3 : 1}>
              <BookmarkNodeCanvas
                node={node}
                x={pos.x}
                y={pos.y}
                isSelected={isSelected}
                onDragEnd={handleNodeDragEnd}
                onClick={handleNodeClick}
                onDelete={() => onDeleteNode?.(node.id)}
                onRename={() => onRenameNode?.(node.id)}
              />
            </Group>
          );
        })}
      </Layer>
    </Stage>
  );
};

export default BookmarkGraphCanvas;
