import React, { useCallback, useEffect, useState } from 'react';
import { openDB } from 'idb';
import { v4 as uuidv4 } from 'uuid';

import Toolbar from './Toolbar';
import FilterBar, { FolderTreeNode } from './FilterBar';
import BookmarkGraphCanvas from './BookmarkGraphCanvas';
import type { Position } from './BookmarkGraphCanvasConfig';
import { applyDefaultLayout } from './layout';
import { parseBookmarks, generateBookmarksHtml, BookmarkGraphNode } from './utils/bookmarkParser';

const DB_NAME = 'bookmark-graph-db';
const STORE_NAME = 'graph-state';

const EditorContent = () => {
  const [nodes, setNodes] = useState<BookmarkGraphNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFolderIds, setActiveFolderIds] = useState<Set<string>>(new Set());
  const [layoutVersion, setLayoutVersion] = useState(0);
  const [viewState, setViewState] = useState<{ scale: number; position: Position } | null>(null);

  // Load from IDB on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const db = await openDB(DB_NAME, 1, {
          upgrade(db) {
            db.createObjectStore(STORE_NAME);
          },
        });
        const savedNodes = (await db.get(STORE_NAME, 'nodes')) as BookmarkGraphNode[] | undefined;
        const savedView = (await db.get(STORE_NAME, 'view')) as
          | { scale: number; position: Position }
          | undefined;

        if (savedNodes) {
          setNodes(savedNodes);

          const folderNodes = savedNodes.filter((n) => n.type === 'folder');
          if (folderNodes.length > 0) {
            setActiveFolderIds(new Set(folderNodes.map((n) => n.id)));
          }
        }

        if (savedView) {
          setViewState(savedView);
        }
        setLoading(false);
      } catch (error) {
        console.error('Failed to load graph data', error);
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Filter Logic
  useEffect(() => {
    setNodes((nds) => {
      if (nds.length === 0) return nds;

      const nodeMap = new Map(nds.map((n) => [n.id, n]));
      const isVisible = (node: BookmarkGraphNode): boolean => {
        // Root bookmark: always visible
        if (node.type === 'bookmark' && !node.parentNode) return true;

        // Folder (Root or Nested): Must be active in the filter
        if (node.type === 'folder') {
          // First check if the folder itself is active
          if (!activeFolderIds.has(node.id)) return false;

          // Then check if its parent is visible (if it has one)
          if (node.parentNode) {
            const parent = nodeMap.get(node.parentNode);
            if (parent && !isVisible(parent)) return false;
          }
          return true;
        }

        // Nested Bookmark: Visible if parent is visible
        if (node.parentNode) {
          const parent = nodeMap.get(node.parentNode);
          if (parent) return isVisible(parent);
        }
        return true;
      };

      const visibleIds = new Set<string>();
      nds.forEach((n) => {
        if (isVisible(n)) {
          visibleIds.add(n.id);
        }
      });

      let laidOutPositions: Map<string, { x: number; y: number }> | null = null;
      if (visibleIds.size > 0) {
        const visibleNodes = nds.filter((n) => visibleIds.has(n.id));
        const laidOut = applyDefaultLayout(visibleNodes);
        laidOutPositions = new Map(laidOut.map((n) => [n.id, n.position]));
      }

      let hasChanges = false;
      const newNodes = nds.map((n) => {
        const shouldBeHidden = !visibleIds.has(n.id);
        const laidPos = laidOutPositions?.get(n.id);

        if (laidPos || n.hidden !== shouldBeHidden) {
          hasChanges = true;
          return {
            ...n,
            ...(laidPos ? { position: laidPos } : {}),
            hidden: shouldBeHidden,
          };
        }
        return n;
      });

      return hasChanges ? newNodes : nds;
    });
  }, [activeFolderIds]);

  // Save to IDB
  const handleSave = useCallback(async () => {
    try {
      const db = await openDB(DB_NAME, 1);
      await db.put(STORE_NAME, nodes, 'nodes');
      if (viewState) {
        await db.put(STORE_NAME, viewState, 'view');
      }
      alert('Saved successfully!');
    } catch (error) {
      console.error('Failed to save', error);
      alert('Failed to save');
    }
  }, [nodes, viewState]);

  // Import
  const handleImport = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        if (content) {
          const parsedNodes = parseBookmarks(content);

          if (nodes.length > 0) {
            if (!confirm('This will merge with existing bookmarks. Continue?')) return;
            // Shift new nodes to avoid exact overlap
            const shiftedNodes = parsedNodes.map((n) => ({
              ...n,
              position: { x: n.position.x + 50, y: n.position.y + 50 },
            }));
            setNodes((prev) => [...prev, ...shiftedNodes]);

            // Ensure newly imported folders are visible in the filter
            const newFolderIds = shiftedNodes.filter((n) => n.type === 'folder').map((n) => n.id);
            if (newFolderIds.length > 0) {
              setActiveFolderIds((prev) => {
                const next = new Set(prev);
                newFolderIds.forEach((id) => next.add(id));
                return next;
              });
            }
          } else {
            const laidOut = applyDefaultLayout(parsedNodes);
            setNodes(laidOut);

            // Default: show all folders for a fresh import
            const folderNodes = laidOut.filter((n) => n.type === 'folder');
            if (folderNodes.length > 0) {
              setActiveFolderIds(new Set(folderNodes.map((n) => n.id)));
            }
          }
        }
      };
      reader.readAsText(file);
    },
    [nodes, setNodes]
  );

  // Export
  const handleExport = useCallback(() => {
    const html = generateBookmarksHtml(nodes);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bookmarks.html';
    a.click();
    URL.revokeObjectURL(url);
  }, [nodes]);

  // Add Folder needs to be visible
  const handleAddFolder = useCallback(() => {
    const id = uuidv4();
    const newFolder: BookmarkGraphNode = {
      id,
      type: 'folder',
      position: { x: 100, y: 100 },
      data: { label: 'New Folder', isFolder: true },
      style: { width: 900, height: 500 },
      draggable: true,
    };
    setNodes((nds) => nds.concat(newFolder));
    // Auto-select new folder so it appears
    setActiveFolderIds((prev) => new Set(prev).add(id));
  }, [setNodes]);

  // Auto Layout
  const handleAutoLayout = useCallback(() => {
    setNodes((nds) => applyDefaultLayout(nds));
    setLayoutVersion((v) => v + 1);
  }, [setNodes]);

  // Clear
  const handleClear = useCallback(() => {
    if (confirm('Are you sure you want to clear all bookmarks?')) {
      setNodes([]);
    }
  }, [setNodes]);

  const handleClearStorage = useCallback(async () => {
    if (!confirm('This will delete the saved bookmark graph data from this browser. Continue?')) {
      return;
    }

    try {
      const db = await openDB(DB_NAME, 1, {
        upgrade(db) {
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME);
          }
        },
      });

      await db.clear(STORE_NAME);

      setNodes([]);
      setActiveFolderIds(new Set());
      setViewState(null);
      setLayoutVersion((v) => v + 1);

      alert('Saved data cleared from this browser.');
    } catch (error) {
      console.error('Failed to clear storage', error);
      alert('Failed to clear saved data');
    }
  }, []);

  // Extract All Folders for Filter Bar (flattened list)
  const allFolderIds = React.useMemo(() => {
    return nodes.filter((n) => n.type === 'folder').map((n) => n.id);
  }, [nodes]);

  const folderTree = React.useMemo<FolderTreeNode[]>(() => {
    const folders = nodes.filter((n) => n.type === 'folder');
    if (folders.length === 0) return [];

    const map = new Map<string, FolderTreeNode>();
    folders.forEach((folder) => {
      map.set(folder.id, {
        id: folder.id,
        label: folder.data.label,
        children: [],
      });
    });

    const roots: FolderTreeNode[] = [];

    folders.forEach((folder) => {
      const node = map.get(folder.id)!;
      const parentId = folder.parentNode;
      if (parentId && map.has(parentId)) {
        const parentNode = map.get(parentId)!;
        parentNode.children?.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }, [nodes]);

  const toggleFolder = useCallback(
    (id: string) => {
      setActiveFolderIds((prev) => {
        const next = new Set(prev);
        const isActive = next.has(id);

        const collectDescendantFolderIds = (folderId: string, acc: Set<string>) => {
          nodes.forEach((node) => {
            if (node.type === 'folder' && node.parentNode === folderId) {
              acc.add(node.id);
              collectDescendantFolderIds(node.id, acc);
            }
          });
        };

        const allDescendants = new Set<string>();
        collectDescendantFolderIds(id, allDescendants);

        if (isActive) {
          next.delete(id);
          allDescendants.forEach((folderId) => next.delete(folderId));
        } else {
          next.add(id);
          allDescendants.forEach((folderId) => next.add(folderId));

          const findAncestors = (nodeId: string, acc: Set<string>) => {
            const node = nodes.find((n) => n.id === nodeId);
            if (node && node.parentNode) {
              acc.add(node.parentNode);
              findAncestors(node.parentNode, acc);
            }
          };

          const ancestorIds = new Set<string>();
          findAncestors(id, ancestorIds);
          ancestorIds.forEach((folderId) => next.add(folderId));
        }

        return next;
      });
    },
    [nodes]
  );

  const toggleAllFolders = useCallback(
    (show: boolean) => {
      if (show) {
        setActiveFolderIds(new Set(allFolderIds));
      } else {
        setActiveFolderIds(new Set());
      }
    },
    [allFolderIds]
  );

  const handleViewChange = useCallback((view: { scale: number; position: Position }) => {
    setViewState(view);
  }, []);
  if (loading) {
    return <div className="flex items-center justify-center h-full">Loading...</div>;
  }

  return (
    <div className="w-full h-full relative bg-gray-50 dark:bg-gray-900">
      <Toolbar
        onImport={handleImport}
        onExport={handleExport}
        onAddFolder={handleAddFolder}
        onClear={handleClear}
        onSave={handleSave}
        onAutoLayout={handleAutoLayout}
        onClearStorage={handleClearStorage}
      />

      <FilterBar
        folderTree={folderTree}
        activeFolderIds={activeFolderIds}
        onToggleFolder={toggleFolder}
        onToggleAll={toggleAllFolders}
      />
      <BookmarkGraphCanvas
        nodes={nodes}
        setNodes={setNodes}
        layoutVersion={layoutVersion}
        initialView={viewState ?? undefined}
        onViewChange={handleViewChange}
      />
    </div>
  );
};

const BookmarkGraphEditor = () => {
  return <EditorContent />;
};

export default BookmarkGraphEditor;
