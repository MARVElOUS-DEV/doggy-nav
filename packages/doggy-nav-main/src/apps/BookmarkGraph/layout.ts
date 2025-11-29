import { hierarchy, tree } from 'd3-hierarchy';
import type { BookmarkGraphNode } from './utils/bookmarkParser';
import { BOOKMARK_SIZE } from './BookmarkGraphCanvasConfig';

const PADDING = 20;
const FOLDER_WIDTH = 900;
const FOLDER_HEIGHT = 500;
const GAP = 1050;
const ROOT_GRID_COLS = 4;
const INNER_TOP_OFFSET = 60;
const BOOKMARK_GRID_COL_GAP = 16;
const BOOKMARK_GRID_ROW_GAP = 12;
const BOOKMARK_GRID_TOP = 80;
const BOOKMARK_GRID_COLS = 3;

const MAX_BOOKMARK_ROWS = Math.max(
  1,
  Math.floor(
    (FOLDER_HEIGHT - BOOKMARK_GRID_TOP - PADDING) / (BOOKMARK_SIZE.height + BOOKMARK_GRID_ROW_GAP)
  )
);
const BOOKMARKS_PER_PAGE = BOOKMARK_GRID_COLS * MAX_BOOKMARK_ROWS;

const FOLDER_Y_GAP_BOOST = 200; // Additional vertical gap between parent and child folders

interface TreeNodeData {
  id: string;
  children?: TreeNodeData[];
}

export const applyDefaultLayout = (nodes: BookmarkGraphNode[]): BookmarkGraphNode[] => {
  if (nodes.length === 0) return nodes;

  const nodesById = new Map<string, BookmarkGraphNode>();
  nodes.forEach((n) => {
    nodesById.set(n.id, n);
  });

  const folderChildrenMap = new Map<string, BookmarkGraphNode[]>();
  const bookmarkChildrenMap = new Map<string, BookmarkGraphNode[]>();
  nodes.forEach((n) => {
    if (!n.parentNode) return;
    if (n.type === 'folder') {
      if (!folderChildrenMap.has(n.parentNode)) {
        folderChildrenMap.set(n.parentNode, []);
      }
      folderChildrenMap.get(n.parentNode)!.push(n);
    } else if (n.type === 'bookmark') {
      if (!bookmarkChildrenMap.has(n.parentNode)) {
        bookmarkChildrenMap.set(n.parentNode, []);
      }
      bookmarkChildrenMap.get(n.parentNode)!.push(n);
    }
  });

  const newNodesMap = new Map<string, BookmarkGraphNode>();

  const rootFolders = nodes.filter((n) => n.type === 'folder' && !n.parentNode);
  const rootBookmarks = nodes.filter((n) => n.type === 'bookmark' && !n.parentNode);

  [...rootFolders, ...rootBookmarks].forEach((node, index) => {
    const col = index % ROOT_GRID_COLS;
    const row = Math.floor(index / ROOT_GRID_COLS);

    const x = col * (FOLDER_WIDTH + GAP);
    const y = row * (FOLDER_HEIGHT + GAP);

    newNodesMap.set(node.id, {
      ...node,
      position: { x, y },
    });
  });

  const buildTreeData = (id: string): TreeNodeData => {
    const children = folderChildrenMap.get(id) || [];
    return {
      id,
      children: children.map((child) => buildTreeData(child.id)),
    };
  };

  const layoutSubtree = (folderId: string) => {
    const folder = nodesById.get(folderId);
    if (!folder) return;

    const hasFolderChildren = (folderChildrenMap.get(folderId) || []).length > 0;
    const hasBookmarkChildren = (bookmarkChildrenMap.get(folderId) || []).length > 0;
    if (!hasFolderChildren && !hasBookmarkChildren) return;

    const layoutBookmarksGrid = (folderNodeId: string) => {
      const bookmarks = bookmarkChildrenMap.get(folderNodeId) || [];
      if (bookmarks.length === 0) return;

      bookmarks.forEach((bookmark, index) => {
        const pageIndex = Math.floor(index / BOOKMARKS_PER_PAGE);
        const indexInPage = index % BOOKMARKS_PER_PAGE;

        const col = indexInPage % BOOKMARK_GRID_COLS;
        const row = Math.floor(indexInPage / BOOKMARK_GRID_COLS);

        const xLocal = PADDING + col * (BOOKMARK_SIZE.width + BOOKMARK_GRID_COL_GAP);
        const yLocal = BOOKMARK_GRID_TOP + row * (BOOKMARK_SIZE.height + BOOKMARK_GRID_ROW_GAP);

        const base = newNodesMap.get(bookmark.id) ?? bookmark;

        newNodesMap.set(bookmark.id, {
          ...base,
          data: { ...base.data, pageIndex },
          position: { x: xLocal, y: yLocal },
        });
      });
    };

    // Fast path: folder has only bookmarks, no folder subtree
    if (!hasFolderChildren && hasBookmarkChildren) {
      layoutBookmarksGrid(folderId);
      return;
    }

    const innerWidth = FOLDER_WIDTH - 2 * PADDING;
    const innerHeight = FOLDER_HEIGHT - INNER_TOP_OFFSET - PADDING;
    if (innerWidth <= 0 || innerHeight <= 0) return;

    const treeData = buildTreeData(folderId);
    const root = hierarchy<TreeNodeData>(treeData, (d) => d.children);

    // Use explicit node size so large folder rectangles do not overlap
    const treeLayout = tree<TreeNodeData>().nodeSize([
      FOLDER_WIDTH + PADDING,
      FOLDER_HEIGHT + PADDING + FOLDER_Y_GAP_BOOST,
    ]);
    treeLayout(root);

    const absLocalById = new Map<string, { x: number; y: number }>();

    root.each((d) => {
      const nodeId = d.data.id;
      if (!nodesById.has(nodeId)) return;

      if (nodeId === folderId) {
        absLocalById.set(nodeId, { x: 0, y: 0 });
        return;
      }

      const x = PADDING + d.x;
      const y = INNER_TOP_OFFSET + d.y;
      absLocalById.set(nodeId, { x, y });
    });

    // Position folders in the subtree according to tree layout
    absLocalById.forEach((absPos, nodeId) => {
      // Fixed: changed folderNodeId to nodeId
      const original = nodesById.get(nodeId);
      if (!original || original.type !== 'folder') return;

      const parentId = original.parentNode;
      const parentAbs = (parentId && absLocalById.get(parentId)) || { x: 0, y: 0 };

      const rel = {
        x: absPos.x - parentAbs.x,
        y: absPos.y - parentAbs.y,
      };

      const base = newNodesMap.get(nodeId) ?? original;

      newNodesMap.set(nodeId, {
        ...base,
        position: rel,
      });
    });

    // Grid layout for bookmarks inside each folder of this subtree
    absLocalById.forEach((_, folderNodeId) => {
      const folderNode = nodesById.get(folderNodeId);
      if (!folderNode || folderNode.type !== 'folder') return;

      layoutBookmarksGrid(folderNodeId);
    });
  };

  rootFolders.forEach((folder) => {
    layoutSubtree(folder.id);
  });

  return nodes.map((n) => newNodesMap.get(n.id) ?? n);
};
