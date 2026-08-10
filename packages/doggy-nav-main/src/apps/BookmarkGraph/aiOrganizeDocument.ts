import type {
  BookmarkOrganizeFolder,
  BookmarkOrganizeRequest,
  BookmarkOrganizeResponse,
  BookmarkOrganizeTree,
} from 'doggy-nav-core';
import type { BookmarkDocument, BookmarkDocumentItem } from './model';

export const AI_ORGANIZE_MAX_ITEMS = 500;

function sortedChildren(document: BookmarkDocument): Map<string | null, BookmarkDocumentItem[]> {
  const itemIds = new Set(document.items.map((item) => item.id));
  const folders = new Set(
    document.items.filter((item) => item.type === 'folder').map((item) => item.id)
  );
  const children = new Map<string | null, BookmarkDocumentItem[]>();
  document.items.forEach((item) => {
    const parentId =
      item.parentId && itemIds.has(item.parentId) && folders.has(item.parentId)
        ? item.parentId
        : null;
    const siblings = children.get(parentId) || [];
    siblings.push(item);
    children.set(parentId, siblings);
  });
  children.forEach((siblings) =>
    siblings.sort(
      (a, b) => a.order - b.order || a.title.localeCompare(b.title) || a.id.localeCompare(b.id)
    )
  );
  return children;
}

export function documentToBookmarkOrganizeRequest(
  document: BookmarkDocument,
  instruction?: string
): BookmarkOrganizeRequest {
  const children = sortedChildren(document);
  const visited = new Set<string>();
  const buildTree = (parentId: string | null): BookmarkOrganizeTree => {
    const tree: BookmarkOrganizeTree = [];
    (children.get(parentId) || []).forEach((item) => {
      if (visited.has(item.id)) return;
      visited.add(item.id);
      tree.push(
        item.type === 'bookmark'
          ? item.id
          : { id: item.id, title: item.title, children: buildTree(item.id) }
      );
    });
    return tree;
  };

  const tree = buildTree(null);
  // Recover disconnected legacy items at the root instead of silently dropping them.
  document.items.forEach((item) => {
    if (visited.has(item.id)) return;
    visited.add(item.id);
    tree.push(
      item.type === 'bookmark'
        ? item.id
        : { id: item.id, title: item.title, children: buildTree(item.id) }
    );
  });

  const cleanInstruction = instruction?.trim().slice(0, 1000);
  return {
    ...(cleanInstruction ? { instruction: cleanInstruction } : {}),
    bookmarks: document.items
      .filter((item) => item.type === 'bookmark')
      .map((item) => ({ id: item.id, title: item.title, url: item.url || '' })),
    tree,
  };
}

export function bookmarkOrganizeResponseToDocument(
  source: BookmarkDocument,
  response: BookmarkOrganizeResponse
): BookmarkDocument {
  const bookmarks = new Map(
    source.items.filter((item) => item.type === 'bookmark').map((item) => [item.id, item] as const)
  );
  const sourceFolderIds = new Set(
    source.items.filter((item) => item.type === 'folder').map((item) => item.id)
  );
  const usedIds = new Set<string>();
  const items: BookmarkDocumentItem[] = [];

  const visit = (tree: BookmarkOrganizeTree, parentId: string | null) => {
    if (!Array.isArray(tree)) throw new Error('AI hierarchy is not an array');
    tree.forEach((entry, order) => {
      if (typeof entry === 'string') {
        const bookmark = bookmarks.get(entry);
        if (!bookmark || usedIds.has(entry))
          throw new Error('AI hierarchy contains invalid bookmarks');
        usedIds.add(entry);
        items.push({ ...bookmark, parentId, order });
        return;
      }
      const folder = entry as BookmarkOrganizeFolder;
      if (
        !folder ||
        typeof folder.id !== 'string' ||
        typeof folder.title !== 'string' ||
        !folder.title.trim() ||
        usedIds.has(folder.id) ||
        bookmarks.has(folder.id) ||
        (!sourceFolderIds.has(folder.id) && !folder.id.startsWith('ai-folder-'))
      ) {
        throw new Error('AI hierarchy contains an invalid folder');
      }
      usedIds.add(folder.id);
      items.push({
        id: folder.id,
        type: 'folder',
        title: folder.title.trim(),
        parentId,
        order,
      });
      visit(folder.children, folder.id);
    });
  };
  visit(response.tree, null);

  if (bookmarks.size !== [...usedIds].filter((id) => bookmarks.has(id)).length) {
    throw new Error('AI hierarchy is missing bookmarks');
  }
  return { version: 2, items };
}
