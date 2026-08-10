export interface LegacyBookmarkGraphNode {
  id: string;
  type?: string;
  position: { x: number; y: number };
  parentNode?: string;
  parentId?: string;
  data?: {
    label?: string;
    url?: string;
    icon?: string;
  };
}

export interface BookmarkDocumentItem {
  id: string;
  type: 'folder' | 'bookmark';
  title: string;
  url?: string;
  icon?: string;
  parentId: string | null;
  order: number;
}

export interface BookmarkDocument {
  version: 2;
  items: BookmarkDocumentItem[];
}

export interface BookmarkEditorViewState {
  layoutVersion?: number;
  positions: Record<string, { x: number; y: number }>;
  collapsedFolderIds: string[];
  viewport: { x: number; y: number; zoom: number };
  filters: { query: string; visibleFolderIds: string[] };
}

export const EMPTY_DOCUMENT: BookmarkDocument = { version: 2, items: [] };
export const EMPTY_VIEW_STATE: BookmarkEditorViewState = {
  positions: {},
  collapsedFolderIds: [],
  viewport: { x: 0, y: 0, zoom: 1 },
  filters: { query: '', visibleFolderIds: [] },
};

export function normalizeOrders(items: BookmarkDocumentItem[]): BookmarkDocumentItem[] {
  const children = new Map<string | null, BookmarkDocumentItem[]>();
  items.forEach((item) => {
    const list = children.get(item.parentId) || [];
    list.push(item);
    children.set(item.parentId, list);
  });
  const orders = new Map<string, number>();
  children.forEach((list) =>
    list
      .toSorted((a, b) => a.order - b.order || a.title.localeCompare(b.title))
      .forEach((item, index) => orders.set(item.id, index))
  );
  return items.map((item) => ({ ...item, order: orders.get(item.id) ?? item.order }));
}

export function migrateLegacyNodes(nodes: LegacyBookmarkGraphNode[]): BookmarkDocument {
  const siblingOrder = new Map<string | null, number>();
  const items = nodes.map((node) => {
    const parentId = node.parentId || node.parentNode || null;
    const order = siblingOrder.get(parentId) || 0;
    siblingOrder.set(parentId, order + 1);
    return {
      id: node.id,
      type: node.type === 'folder' ? ('folder' as const) : ('bookmark' as const),
      title: String(node.data?.label || 'Untitled'),
      ...(node.data?.url ? { url: node.data.url } : {}),
      ...(node.data?.icon ? { icon: node.data.icon } : {}),
      parentId,
      order,
    };
  });
  return { version: 2, items: normalizeOrders(items) };
}

export function getDescendantIds(items: BookmarkDocumentItem[], rootId: string): Set<string> {
  const result = new Set<string>();
  const visit = (parentId: string) => {
    items.forEach((item) => {
      if (item.parentId === parentId && !result.has(item.id)) {
        result.add(item.id);
        visit(item.id);
      }
    });
  };
  visit(rootId);
  return result;
}

export function wouldCreateCycle(
  items: BookmarkDocumentItem[],
  itemId: string,
  parentId: string | null
): boolean {
  if (!parentId) return false;
  return parentId === itemId || getDescendantIds(items, itemId).has(parentId);
}
