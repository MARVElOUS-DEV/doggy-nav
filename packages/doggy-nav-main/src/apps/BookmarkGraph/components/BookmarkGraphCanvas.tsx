import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Background,
  Controls,
  Handle,
  MarkerType,
  MiniMap,
  Panel,
  Position,
  ReactFlow,
  ReactFlowProvider,
  SelectionMode,
  useNodesState,
  useNodesInitialized,
  useReactFlow,
  type Connection,
  type Edge,
  type Node,
  type NodeChange,
  type NodeProps,
  type OnNodeDrag,
  type OnMoveEnd,
  type OnReconnect,
} from '@xyflow/react';
import { Bookmark, ChevronDown, Folder } from 'lucide-react';
import type { BookmarkDocument, BookmarkDocumentItem, BookmarkEditorViewState } from '../model';
import { wouldCreateCycle } from '../model';
import {
  BOOKMARK_SIZE,
  COLLAPSED_FOLDER_SIZE,
  EMPTY_FOLDER_SIZE,
  FOLDER_PADDING,
} from '../elkLayout';

type EditorNodeData = {
  item: BookmarkDocumentItem;
  collapsed?: boolean;
  dropTarget?: boolean;
};
type EditorNode = Node<EditorNodeData, 'folder' | 'bookmark'>;

const FolderNode = memo(({ data, selected }: NodeProps<EditorNode>) => (
  <>
    <Handle
      type="target"
      position={Position.Left}
      title="Connect as child folder"
      className="!h-4 !w-4 !cursor-crosshair !border-2 !border-theme-card !bg-theme-primary"
    />
    <div
      className={`h-full w-full rounded-2xl border-2 transition-[border-color,box-shadow,background-color] ${
        data.dropTarget
          ? 'border-theme-primary bg-theme-primary/30 ring-4 ring-theme-primary/30'
          : selected
            ? 'border-theme-primary bg-theme-primary/30 ring-4 ring-theme-primary/30'
            : 'border-theme-border bg-theme-card shadow-sm'
      }`}
    >
      <div className="flex h-11 items-center gap-2 border-b border-theme-border px-3 text-theme-foreground">
        <Folder size={17} className="text-theme-primary" />
        <span className="min-w-0 flex-1 truncate text-sm font-semibold">{data.item.title}</span>
        {data.collapsed ? <ChevronDown size={14} /> : null}
      </div>
    </div>
    <Handle
      type="source"
      position={Position.Right}
      title="Connect as parent folder"
      className="!h-4 !w-4 !cursor-crosshair !border-2 !border-theme-card !bg-theme-primary"
    />
  </>
));
FolderNode.displayName = 'FolderNode';

const BookmarkNode = memo(({ data, selected }: NodeProps<EditorNode>) => (
  <div
    className={`flex h-16 w-[220px] items-center gap-3 rounded-xl border-2 px-3 transition-[border-color,box-shadow,background-color] ${
      selected
        ? 'border-theme-primary bg-theme-primary/30 ring-4 ring-theme-primary/30'
        : 'border-theme-border bg-theme-card shadow-sm hover:shadow-md'
    }`}
  >
    <div className="flex h-9 w-9 flex-none items-center justify-center overflow-hidden rounded-lg bg-theme-muted">
      {data.item.icon ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={data.item.icon} alt="" className="h-6 w-6 object-contain" />
      ) : (
        <Bookmark size={17} className="text-theme-primary" />
      )}
    </div>
    <div className="min-w-0">
      <div className="truncate text-sm font-medium text-theme-foreground">{data.item.title}</div>
      <div className="truncate text-xs text-theme-muted-foreground">
        {safeHostname(data.item.url)}
      </div>
    </div>
  </div>
));
BookmarkNode.displayName = 'BookmarkNode';

function safeHostname(url?: string) {
  if (!url) return 'No URL';
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

const nodeTypes = { folder: FolderNode, bookmark: BookmarkNode };

function fallbackPosition(item: BookmarkDocumentItem) {
  return {
    x: item.parentId ? 28 + (item.order % 2) * 238 : 60 + (item.order % 4) * 280,
    y: item.parentId ? 62 + Math.floor(item.order / 2) * 82 : 60 + Math.floor(item.order / 4) * 180,
  };
}

function clientPoint(event: MouseEvent | TouchEvent) {
  const pointer = 'touches' in event ? event.touches[0] || event.changedTouches[0] : event;
  return { x: pointer?.clientX || 0, y: pointer?.clientY || 0 };
}

interface CanvasProps {
  document: BookmarkDocument;
  view: BookmarkEditorViewState;
  selectedIds: string[];
  onViewChange: (updater: (view: BookmarkEditorViewState) => BookmarkEditorViewState) => void;
  onSelectionChange: (ids: string[]) => void;
  onMoveItem: (itemId: string, parentId: string | null) => void;
  onDeleteItems: (ids: string[]) => void;
  onInspect: (id: string) => void;
  layoutRevision: number;
}

function FlowContent({
  document,
  view,
  selectedIds,
  onViewChange,
  onSelectionChange,
  onMoveItem,
  onDeleteItems,
  onInspect,
  layoutRevision,
}: CanvasProps) {
  const flow = useReactFlow<EditorNode>();
  const nodesInitialized = useNodesInitialized();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const itemById = useMemo(
    () => new Map(document.items.map((item) => [item.id, item])),
    [document]
  );
  const collapsed = useMemo(() => new Set(view.collapsedFolderIds), [view.collapsedFolderIds]);

  const visibleIds = useMemo(() => {
    const query = view.filters.query.trim().toLowerCase();
    const folderFilter = new Set(view.filters.visibleFolderIds);
    const matches = new Set<string>();
    const addAncestors = (item: BookmarkDocumentItem) => {
      let parentId = item.parentId;
      while (parentId) {
        matches.add(parentId);
        parentId = itemById.get(parentId)?.parentId || null;
      }
    };
    document.items.forEach((item) => {
      const queryMatch =
        !query ||
        item.title.toLowerCase().includes(query) ||
        item.url?.toLowerCase().includes(query);
      let folderMatch = folderFilter.size === 0;
      let parentId = item.type === 'folder' ? item.id : item.parentId;
      while (!folderMatch && parentId) {
        folderMatch = folderFilter.has(parentId);
        parentId = itemById.get(parentId)?.parentId || null;
      }
      if (queryMatch && folderMatch) {
        matches.add(item.id);
        addAncestors(item);
      }
    });
    if (!query && folderFilter.size === 0) document.items.forEach((item) => matches.add(item.id));
    document.items.forEach((item) => {
      let parentId = item.parentId;
      while (parentId) {
        if (collapsed.has(parentId)) matches.delete(item.id);
        parentId = itemById.get(parentId)?.parentId || null;
      }
    });
    return matches;
  }, [collapsed, document.items, itemById, view.filters]);
  const invalidDropTarget = useMemo(
    () =>
      Boolean(
        draggingId && dropTargetId && wouldCreateCycle(document.items, draggingId, dropTargetId)
      ),
    [document.items, draggingId, dropTargetId]
  );

  const depth = useCallback(
    (item: BookmarkDocumentItem) => {
      let value = 0;
      let parentId = item.parentId;
      while (parentId && value < 20) {
        value += 1;
        parentId = itemById.get(parentId)?.parentId || null;
      }
      return value;
    },
    [itemById]
  );

  const documentNodes = useMemo<EditorNode[]>(() => {
    const selected = new Set(selectedIds);
    const bookmarksByParent = new Map<string, BookmarkDocumentItem[]>();
    document.items.forEach((item) => {
      if (item.type !== 'bookmark' || !item.parentId || !visibleIds.has(item.id)) return;
      const bookmarks = bookmarksByParent.get(item.parentId) || [];
      bookmarks.push(item);
      bookmarksByParent.set(item.parentId, bookmarks);
    });
    const folderSizes = new Map<string, { width: number; height: number }>();
    const sizeOf = (item: BookmarkDocumentItem): { width: number; height: number } => {
      if (item.type === 'bookmark') return BOOKMARK_SIZE;
      const cached = folderSizes.get(item.id);
      if (cached) return cached;
      if (collapsed.has(item.id)) return COLLAPSED_FOLDER_SIZE;
      const bookmarks = bookmarksByParent.get(item.id) || [];
      const size = bookmarks.length
        ? bookmarks.reduce((bounds, child) => {
            const position = view.positions[child.id] || fallbackPosition(child);
            const childSize = sizeOf(child);
            return {
              width: Math.max(bounds.width, position.x + childSize.width + FOLDER_PADDING),
              height: Math.max(bounds.height, position.y + childSize.height + FOLDER_PADDING),
            };
          }, EMPTY_FOLDER_SIZE)
        : EMPTY_FOLDER_SIZE;
      folderSizes.set(item.id, size);
      return size;
    };
    return document.items
      .filter((item) => visibleIds.has(item.id))
      .toSorted((a, b) => depth(a) - depth(b) || a.order - b.order)
      .map((item) => {
        const position = view.positions[item.id] || fallbackPosition(item);
        const parentVisible =
          item.type === 'bookmark' && item.parentId ? visibleIds.has(item.parentId) : false;
        return {
          id: item.id,
          type: item.type,
          position,
          parentId: parentVisible ? item.parentId || undefined : undefined,
          selected: selected.has(item.id),
          data: {
            item,
            collapsed: collapsed.has(item.id),
            dropTarget: false,
          },
          ...(item.type === 'folder' ? { style: sizeOf(item) } : {}),
        };
      });
  }, [collapsed, depth, document.items, selectedIds, view.positions, visibleIds]);
  const [nodes, setNodes, applyNodesChange] = useNodesState<EditorNode>(documentNodes);

  useEffect(() => {
    if (draggingId) return;
    setNodes((current) => {
      const measured = new Map(current.map((node) => [node.id, node.measured]));
      return documentNodes.map((node) => ({ ...node, measured: measured.get(node.id) }));
    });
  }, [documentNodes, draggingId, setNodes]);

  const edges = useMemo<Edge[]>(
    () =>
      document.items
        .filter(
          (item) =>
            item.type === 'folder' &&
            item.parentId &&
            visibleIds.has(item.id) &&
            visibleIds.has(item.parentId)
        )
        .map((item) => ({
          id: `folder-${item.parentId}-${item.id}`,
          source: item.parentId!,
          target: item.id,
          type: 'smoothstep',
          selectable: true,
          focusable: true,
          reconnectable: 'source',
          interactionWidth: 24,
          ariaLabel: `${itemById.get(item.parentId!)?.title || 'Folder'} contains ${item.title}`,
          style: { stroke: 'var(--color-primary)', strokeWidth: 2, opacity: 0.45 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: 'var(--color-primary)',
            width: 14,
            height: 14,
          },
        })),
    [document.items, itemById, visibleIds]
  );

  const handleNodesChange = useCallback(
    (changes: NodeChange<EditorNode>[]) => {
      applyNodesChange(changes.filter((change) => change.type !== 'remove'));
      const removals = changes
        .filter((change) => change.type === 'remove')
        .map((change) => change.id);
      if (removals.length) onDeleteItems(removals);
      const selection = changes.filter(
        (change): change is Extract<NodeChange<EditorNode>, { type: 'select' }> =>
          change.type === 'select'
      );
      if (selection.length) {
        const next = new Set(selectedIds);
        selection.forEach((change) =>
          change.selected ? next.add(change.id) : next.delete(change.id)
        );
        onSelectionChange([...next]);
      }
    },
    [applyNodesChange, onDeleteItems, onSelectionChange, selectedIds]
  );

  const handleMoveEnd: OnMoveEnd = useCallback(
    (_event, viewport) => onViewChange((current) => ({ ...current, viewport })),
    [onViewChange]
  );

  const findDropTarget = useCallback(
    (node: EditorNode, clientX: number, clientY: number) => {
      const point = flow.screenToFlowPosition({ x: clientX, y: clientY });
      return (
        flow
          .getNodes()
          .filter((candidate) => candidate.type === 'folder' && candidate.id !== node.id)
          .filter((candidate) => {
            const internal = flow.getInternalNode(candidate.id);
            if (!internal) return false;
            const { x, y } = internal.internals.positionAbsolute;
            const width = internal.measured.width || 0;
            const height = internal.measured.height || 0;
            return point.x >= x && point.x <= x + width && point.y >= y && point.y <= y + height;
          })
          .toSorted((a, b) => {
            const depthDifference = depth(itemById.get(b.id)!) - depth(itemById.get(a.id)!);
            if (depthDifference) return depthDifference;
            const aInternal = flow.getInternalNode(a.id);
            const bInternal = flow.getInternalNode(b.id);
            return (
              (aInternal?.measured.width || 0) * (aInternal?.measured.height || 0) -
              (bInternal?.measured.width || 0) * (bInternal?.measured.height || 0)
            );
          })[0]?.id || null
      );
    },
    [depth, flow, itemById]
  );

  const handleNodeDrag: OnNodeDrag<EditorNode> = useCallback(
    (event, node) => {
      if (node.type !== 'bookmark') return;
      const point = clientPoint(event);
      const nextTargetId = findDropTarget(node, point.x, point.y);
      setDropTargetId((currentTargetId) => {
        if (currentTargetId === nextTargetId) return currentTargetId;
        setNodes((current) =>
          current.map((candidate) =>
            candidate.id === currentTargetId || candidate.id === nextTargetId
              ? {
                  ...candidate,
                  data: {
                    ...candidate.data,
                    dropTarget:
                      candidate.id === nextTargetId &&
                      !wouldCreateCycle(document.items, node.id, nextTargetId),
                  },
                }
              : candidate
          )
        );
        return nextTargetId;
      });
    },
    [document.items, findDropTarget, setNodes]
  );

  const handleNodeDragStop: OnNodeDrag<EditorNode> = useCallback(
    (event, node: EditorNode) => {
      setDraggingId(null);
      setDropTargetId(null);
      onViewChange((current) => ({
        ...current,
        positions: { ...current.positions, [node.id]: node.position },
      }));
      if (node.type === 'folder') return;
      const point = clientPoint(event);
      const nextParentId = findDropTarget(node, point.x, point.y);
      const source = itemById.get(node.id);
      if (
        !source ||
        source.parentId === nextParentId ||
        wouldCreateCycle(document.items, node.id, nextParentId)
      ) {
        return;
      }
      onMoveItem(node.id, nextParentId);
    },
    [document.items, findDropTarget, itemById, onMoveItem, onViewChange]
  );

  const canConnectFolders = useCallback(
    ({ source, target }: Connection | Edge) =>
      Boolean(
        source &&
        target &&
        itemById.get(source)?.type === 'folder' &&
        itemById.get(target)?.type === 'folder' &&
        !wouldCreateCycle(document.items, target, source)
      ),
    [document.items, itemById]
  );
  const connectFolders = useCallback(
    (connection: Connection) => {
      if (connection.source && connection.target && canConnectFolders(connection)) {
        onMoveItem(connection.target, connection.source);
      }
    },
    [canConnectFolders, onMoveItem]
  );
  const reconnectFolder: OnReconnect<Edge> = useCallback(
    (_edge, connection) => connectFolders(connection),
    [connectFolders]
  );
  const deleteFolderEdges = useCallback(
    (deletedEdges: Edge[]) => deletedEdges.forEach((edge) => onMoveItem(edge.target, null)),
    [onMoveItem]
  );

  useEffect(() => {
    if (!layoutRevision || !nodesInitialized) return;
    const frame = window.requestAnimationFrame(() =>
      flow.fitView({ padding: 0.12, duration: 300 })
    );
    return () => window.cancelAnimationFrame(frame);
  }, [flow, layoutRevision, nodesInitialized]);

  return (
    <ReactFlow<EditorNode>
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodesChange={handleNodesChange}
      onNodeDragStart={(_event, node) => {
        if (node.type === 'bookmark') setDraggingId(node.id);
      }}
      onNodeDrag={handleNodeDrag}
      onNodeDragStop={handleNodeDragStop}
      onConnect={connectFolders}
      onReconnect={reconnectFolder}
      onEdgesDelete={deleteFolderEdges}
      isValidConnection={canConnectFolders}
      connectOnClick
      edgesReconnectable
      connectionRadius={24}
      reconnectRadius={24}
      onNodeDoubleClick={(_event, node) => onInspect(node.id)}
      onMoveEnd={handleMoveEnd}
      defaultViewport={view.viewport}
      fitView={document.items.length > 0 && Object.keys(view.positions).length === 0}
      minZoom={0.08}
      maxZoom={2.5}
      panOnScroll
      selectionOnDrag
      selectionMode={SelectionMode.Partial}
      multiSelectionKeyCode={['Meta', 'Control']}
      deleteKeyCode={['Backspace', 'Delete']}
      proOptions={{ hideAttribution: true }}
    >
      <Background color="var(--color-border)" gap={22} size={1} />
      {draggingId ? (
        <Panel
          position="top-center"
          className="rounded-lg bg-theme-card px-3 py-2 text-xs text-theme-foreground shadow-lg"
        >
          {invalidDropTarget
            ? 'A folder cannot be moved into its nested child'
            : dropTargetId
              ? `Move to ${itemById.get(dropTargetId)?.title || 'folder'}`
              : 'Drop on empty canvas to move to root'}
        </Panel>
      ) : null}
      <Controls position="bottom-left" />
      <MiniMap
        position="bottom-right"
        pannable
        zoomable
        nodeColor={(node) =>
          node.type === 'folder' ? 'var(--color-primary)' : 'var(--color-muted-foreground)'
        }
        maskColor="color-mix(in srgb, var(--color-background) 70%, transparent)"
      />
    </ReactFlow>
  );
}

export default function BookmarkGraphCanvas(props: CanvasProps) {
  return (
    <ReactFlowProvider>
      <FlowContent {...props} />
    </ReactFlowProvider>
  );
}
