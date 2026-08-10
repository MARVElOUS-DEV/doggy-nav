import type { BookmarkDocument, BookmarkEditorViewState } from './model';

export const BOOKMARK_SIZE = { width: 220, height: 64 };
export const COLLAPSED_FOLDER_SIZE = { width: 260, height: 46 };
export const EMPTY_FOLDER_SIZE = { width: 260, height: 80 };
export const FOLDER_PADDING = 20;
export const LAYOUT_VERSION = 3;

const BOOKMARK_COLUMN_GAP = 20;
const BOOKMARK_ROW_GAP = 16;
const FOLDER_HEADER_HEIGHT = 58;

function folderContentLayout(count: number) {
  if (!count) return { size: EMPTY_FOLDER_SIZE, positions: [] };
  const columns = Math.min(
    6,
    Math.max(1, Math.ceil(Math.sqrt((count * BOOKMARK_SIZE.height * 1.6) / BOOKMARK_SIZE.width)))
  );
  const rows = Math.ceil(count / columns);
  return {
    size: {
      width:
        FOLDER_PADDING * 2 + columns * BOOKMARK_SIZE.width + (columns - 1) * BOOKMARK_COLUMN_GAP,
      height:
        FOLDER_HEADER_HEIGHT +
        rows * BOOKMARK_SIZE.height +
        (rows - 1) * BOOKMARK_ROW_GAP +
        FOLDER_PADDING,
    },
    positions: Array.from({ length: count }, (_, index) => ({
      x: FOLDER_PADDING + (index % columns) * (BOOKMARK_SIZE.width + BOOKMARK_COLUMN_GAP),
      y:
        FOLDER_HEADER_HEIGHT +
        Math.floor(index / columns) * (BOOKMARK_SIZE.height + BOOKMARK_ROW_GAP),
    })),
  };
}

export async function runPackedLayout(
  document: BookmarkDocument,
  current: BookmarkEditorViewState
): Promise<BookmarkEditorViewState> {
  const { default: ELK } = await import('elkjs/lib/elk.bundled.js');
  const elk = new ELK();
  const childrenByParent = new Map<string | null, typeof document.items>();
  document.items.forEach((item) => {
    const list = childrenByParent.get(item.parentId) || [];
    list.push(item);
    childrenByParent.set(item.parentId, list);
  });
  const collapsed = new Set(current.collapsedFolderIds);
  const positions: BookmarkEditorViewState['positions'] = {};
  const folders = document.items.filter((item) => item.type === 'folder');
  const folderSizes = new Map<string, { width: number; height: number }>();
  folders.forEach((folder) => {
    const bookmarks = (childrenByParent.get(folder.id) || [])
      .filter((item) => item.type === 'bookmark')
      .toSorted((a, b) => a.order - b.order);
    const layout = folderContentLayout(bookmarks.length);
    bookmarks.forEach((bookmark, index) => {
      positions[bookmark.id] = layout.positions[index];
    });
    folderSizes.set(folder.id, collapsed.has(folder.id) ? COLLAPSED_FOLDER_SIZE : layout.size);
  });
  const rootBookmarks = (childrenByParent.get(null) || []).filter(
    (item) => item.type === 'bookmark'
  );
  const result: any = await elk.layout({
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': 'RIGHT',
      'elk.edgeRouting': 'ORTHOGONAL',
      'elk.spacing.nodeNode': '64',
      'elk.layered.spacing.nodeNodeBetweenLayers': '96',
      'elk.padding': '[top=36,left=36,bottom=36,right=36]',
    },
    children: [
      ...folders.map((folder) => ({ id: folder.id, ...folderSizes.get(folder.id)! })),
      ...rootBookmarks.map((bookmark) => ({ id: bookmark.id, ...BOOKMARK_SIZE })),
    ],
    edges: folders
      .filter((folder) => folder.parentId && folderSizes.has(folder.parentId))
      .map((folder) => ({
        id: `folder-${folder.parentId}-${folder.id}`,
        sources: [folder.parentId!],
        targets: [folder.id],
      })),
  });
  result.children?.forEach((node: any) => {
    positions[node.id] = { x: Number(node.x) || 0, y: Number(node.y) || 0 };
  });
  return { ...current, positions, layoutVersion: LAYOUT_VERSION };
}
