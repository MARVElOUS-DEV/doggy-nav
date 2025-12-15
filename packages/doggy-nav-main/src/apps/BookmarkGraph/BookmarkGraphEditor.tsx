import React, { useCallback, useEffect, useState, useRef } from 'react';
import { openDB } from 'idb';
import { v4 as uuidv4 } from 'uuid';
import { Message, Modal, Spin } from '@arco-design/web-react';

import Toolbar, { FolderTreeNode } from './Toolbar';
import BookmarkGraphCanvas from './BookmarkGraphCanvas';
import type { Position } from './BookmarkGraphCanvasConfig';
import { applyDefaultLayout } from './layout';
import { parseBookmarks, generateBookmarksHtml, BookmarkGraphNode } from './utils/bookmarkParser';
import useHistory from './hooks/useHistory';
import WelcomeGuideModal from './WelcomeGuideModal';
import EmptyStateGuide from './EmptyStateGuide';

const DB_NAME = 'bookmark-graph-db';
const STORE_NAME = 'graph-state';
const GUIDE_SEEN_KEY = 'bookmark-graph-guide-seen';

const EditorContent = () => {
  const {
    state: nodes,
    setState: setNodes,
    undo,
    redo,
    canUndo,
    canRedo,
    reset: resetNodes,
  } = useHistory<BookmarkGraphNode[]>([]);

  const [loading, setLoading] = useState(true);
  const [activeFolderIds, setActiveFolderIds] = useState<Set<string>>(new Set());
  const [layoutVersion, setLayoutVersion] = useState(0);
  const [viewState, setViewState] = useState<{ scale: number; position: Position } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    const hasSeenGuide = localStorage.getItem(GUIDE_SEEN_KEY);
    if (!hasSeenGuide) {
      setShowGuideModal(true);
    }
  }, []);

  const handleToggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement && containerRef.current) {
      containerRef.current.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else if (document.fullscreenElement) {
      document.exitFullscreen().catch((err) => {
        console.error(`Error attempting to exit fullscreen: ${err.message}`);
      });
    }
  }, []);

  const handleCloseGuide = useCallback(() => {
    setShowGuideModal(false);
    localStorage.setItem(GUIDE_SEEN_KEY, 'true');
  }, []);

  const handleShowGuide = useCallback(() => {
    setShowGuideModal(true);
  }, []);

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

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
          resetNodes(savedNodes);

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

      // Calculate effective visibility (Active + Ancestors)
      const visibleFolderIds = new Set(activeFolderIds);
      const addAncestors = (nodeId: string) => {
        const node = nodeMap.get(nodeId);
        if (node && node.parentNode) {
          visibleFolderIds.add(node.parentNode);
          addAncestors(node.parentNode);
        }
      };
      // We only need to add ancestors for the currently active folders
      activeFolderIds.forEach((id) => addAncestors(id));

      const isVisible = (node: BookmarkGraphNode): boolean => {
        // Root bookmark: always visible
        if (node.type === 'bookmark' && !node.parentNode) return true;

        // Folder (Root or Nested)
        if (node.type === 'folder') {
          // Must be in our computed visible set
          if (!visibleFolderIds.has(node.id)) return false;

          // Also ensure parent is visible (redundant if visibleFolderIds is correct, but safe)
          if (node.parentNode) {
            // If parent isn't in visibleFolderIds, this node shouldn't be either
            // (guaranteed by our ancestor logic, but logic consistency check)
          }
          return true;
        }

        // Nested Bookmark: Visible if parent is visible
        if (node.parentNode) {
          // We use visibleFolderIds to check parent visibility
          return visibleFolderIds.has(node.parentNode);
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
      Message.success('Saved successfully!');
    } catch (error) {
      console.error('Failed to save', error);
      Message.error('Failed to save');
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

          const processImport = () => {
            if (nodes.length > 0) {
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
            Message.success(`Imported ${parsedNodes.length} bookmarks`);
          };

          if (nodes.length > 0) {
            Modal.confirm({
              title: 'Merge Bookmarks',
              content: 'This will merge the imported bookmarks with existing ones. Continue?',
              onOk: processImport,
            });
          } else {
            processImport();
          }
        }
      };
      reader.readAsText(file);
    },
    [nodes]
  );

  // Export
  const handleExport = useCallback(() => {
    // Filter nodes to export only currently visible nodes (based on active filter)
    // We can reuse the same logic as in the visibility effect or just check 'hidden' property if it's reliably updated
    // The 'hidden' property is updated in the render pass (useEffect), so 'nodes' state might not always have the very latest hidden status
    // if we just changed filter. But usually it should be synced.
    // However, the most robust way is to filter by the activeFolderIds set again.

    const visibleFolderIds = new Set(activeFolderIds);
    const addAncestors = (nodeId: string) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (node && node.parentNode) {
        visibleFolderIds.add(node.parentNode);
        addAncestors(node.parentNode);
      }
    };
    activeFolderIds.forEach((id) => addAncestors(id));

    const nodesToExport = nodes.filter((node) => {
      // Root bookmarks always visible
      if (node.type === 'bookmark' && !node.parentNode) return true;

      // Folders
      if (node.type === 'folder') {
        if (!visibleFolderIds.has(node.id)) return false;
        // Check parent visibility for consistency
        if (node.parentNode && !visibleFolderIds.has(node.parentNode)) return false;
        return true;
      }

      // Nested Bookmarks
      if (node.parentNode) {
        return visibleFolderIds.has(node.parentNode);
      }

      return true;
    });

    const html = generateBookmarksHtml(nodesToExport);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bookmarks.html';
    a.click();
    URL.revokeObjectURL(url);
    Message.success(`Exported ${nodesToExport.length} items`);
  }, [nodes, activeFolderIds]);

  // Add Folder needs to be visible
  const handleAddFolder = useCallback(() => {
    const inputRef = React.createRef<HTMLInputElement>();

    Modal.confirm({
      title: 'Create New Folder',
      content: (
        <div style={{ marginTop: 10 }}>
          <p style={{ marginBottom: 8 }}>Folder Name:</p>
          <input
            ref={inputRef}
            defaultValue="New Folder"
            className="arco-input arco-input-size-default"
            style={{ width: '100%' }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                // We can't easily trigger Ok from here without more complex state,
                // but the user can press Enter to submit if the modal supports it.
                // For now just standard input.
              }
            }}
          />
        </div>
      ),
      onOk: () => {
        const name = inputRef.current?.value || 'New Folder';
        const id = uuidv4();
        const newFolder: BookmarkGraphNode = {
          id,
          type: 'folder',
          position: { x: 100, y: 100 },
          data: { label: name, isFolder: true },
          style: { width: 900, height: 500 },
          draggable: true,
        };
        setNodes((nds) => nds.concat(newFolder));
        // Auto-select new folder so it appears
        setActiveFolderIds((prev) => new Set(prev).add(id));
        Message.success(`Folder "${name}" added`);
      },
    });
  }, []);

  const handleDeleteNode = useCallback((nodeId: string) => {
    Modal.confirm({
      title: 'Delete Item',
      content: 'Are you sure you want to delete this item? All children will be deleted as well.',
      okButtonProps: { status: 'danger' },
      onOk: () => {
        setNodes((nds) => {
          const idsToDelete = new Set<string>([nodeId]);
          const findChildren = (parentNode: string) => {
            nds.forEach((n) => {
              if (n.parentNode === parentNode) {
                idsToDelete.add(n.id);
                findChildren(n.id);
              }
            });
          };
          findChildren(nodeId);
          return nds.filter((n) => !idsToDelete.has(n.id));
        });
        Message.success('Item deleted');
      },
    });
  }, []);

  const handleRenameNode = useCallback(
    (nodeId: string) => {
      // Find current name
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return;

      const inputRef = React.createRef<HTMLInputElement>();

      Modal.confirm({
        title: 'Rename Item',
        content: (
          <div style={{ marginTop: 10 }}>
            <p style={{ marginBottom: 8 }}>New Name:</p>
            <input
              ref={inputRef}
              defaultValue={node.data.label}
              className="arco-input arco-input-size-default"
              style={{ width: '100%' }}
            />
          </div>
        ),
        onOk: () => {
          const newName = inputRef.current?.value;
          if (newName && newName.trim()) {
            setNodes((nds) =>
              nds.map((n) => {
                if (n.id === nodeId) {
                  return { ...n, data: { ...n.data, label: newName } };
                }
                return n;
              })
            );
            Message.success('Renamed successfully');
          }
        },
      });
    },
    [nodes]
  );

  // Auto Layout
  const handleAutoLayout = useCallback(() => {
    setNodes((nds) => applyDefaultLayout(nds));
    setLayoutVersion((v) => v + 1);
  }, []);

  // Clear
  const handleClear = useCallback(() => {
    Modal.confirm({
      title: 'Clear All',
      content: 'Are you sure you want to clear all bookmarks?',
      okButtonProps: { status: 'danger' },
      onOk: () => {
        setNodes([]);
        Message.success('Cleared all bookmarks');
      },
    });
  }, []);

  const handleClearStorage = useCallback(async () => {
    Modal.confirm({
      title: 'Clear Storage',
      content: 'This will delete the saved bookmark graph data from this browser. Continue?',
      okButtonProps: { status: 'danger' },
      onOk: async () => {
        try {
          const db = await openDB(DB_NAME, 1, {
            upgrade(db) {
              if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
              }
            },
          });

          await db.clear(STORE_NAME);

          resetNodes([]);
          setActiveFolderIds(new Set());
          setViewState(null);
          setLayoutVersion((v) => v + 1);

          Message.success('Saved data cleared from this browser.');
        } catch (error) {
          console.error('Failed to clear storage', error);
          Message.error('Failed to clear saved data');
        }
      },
    });
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

  const handleFilterChange = useCallback((selectedIds: string[]) => {
    setActiveFolderIds(new Set(selectedIds));
  }, []);

  const handleViewChange = useCallback((view: { scale: number; position: Position }) => {
    setViewState(view);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spin dot tip="Loading..." />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full relative bg-gray-50 dark:bg-gray-900">
      <input
        type="file"
        accept=".html"
        className="hidden"
        ref={fileInputRef}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleImport(file);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }}
      />

      <Toolbar
        onImport={handleImport}
        onExport={handleExport}
        onAddFolder={handleAddFolder}
        onClear={handleClear}
        onSave={handleSave}
        onAutoLayout={handleAutoLayout}
        onToggleFullscreen={handleToggleFullscreen}
        isFullscreen={isFullscreen}
        onClearStorage={handleClearStorage}
        searchTerm={searchTerm}
        onSearch={setSearchTerm}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        onShowGuide={handleShowGuide}
        folderTree={folderTree}
        activeFolderIds={activeFolderIds}
        onFilterChange={handleFilterChange}
      />

      {nodes.length === 0 ? (
        <EmptyStateGuide
          onImportClick={handleImportClick}
          onAddFolderClick={handleAddFolder}
          onShowGuide={handleShowGuide}
        />
      ) : (
        <BookmarkGraphCanvas
          nodes={nodes}
          setNodes={setNodes}
          layoutVersion={layoutVersion}
          initialView={viewState ?? undefined}
          onViewChange={handleViewChange}
          searchTerm={searchTerm}
          onDeleteNode={handleDeleteNode}
          onRenameNode={handleRenameNode}
        />
      )}

      <WelcomeGuideModal
        visible={showGuideModal}
        onClose={handleCloseGuide}
        onImportClick={handleImportClick}
        getPopupContainer={() => containerRef.current || document.body}
      />
    </div>
  );
};

const BookmarkGraphEditor = () => {
  return <EditorContent />;
};

export default BookmarkGraphEditor;
