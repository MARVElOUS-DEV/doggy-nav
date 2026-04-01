export type BookmarkImportFolder = {
  key: string;
  type: 'folder';
  title: string;
  addDate?: number;
  parentKey?: string;
  depth: number;
  pathLabels: string[];
  ancestorFolderKeys: string[];
  children: BookmarkImportNode[];
};

export type BookmarkImportBookmark = {
  key: string;
  type: 'bookmark';
  title: string;
  url: string;
  icon?: string;
  addDate?: number;
  parentKey?: string;
  depth: number;
  pathLabels: string[];
  ancestorFolderKeys: string[];
};

export type BookmarkImportNode = BookmarkImportFolder | BookmarkImportBookmark;

export type BookmarkImportIndex = {
  nodeMap: Map<string, BookmarkImportNode>;
  folders: BookmarkImportFolder[];
  bookmarks: BookmarkImportBookmark[];
  allKeys: string[];
  defaultExpandedKeys: string[];
};

function getAttr(element: Element, name: string) {
  return (
    element.getAttribute(name) ||
    element.getAttribute(name.toUpperCase()) ||
    element.getAttribute(name.toLowerCase()) ||
    undefined
  );
}

function readMaybeNumber(value?: string) {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

type TraverseContext = {
  ancestorFolderKeys: string[];
  pathLabels: string[];
  depth: number;
  parentFolderKey?: string;
};

export function parseBookmarkHtml(html: string): BookmarkImportNode[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const root = doc.querySelector('dl');

  if (!root) {
    throw new Error('未找到书签根节点，请确认这是浏览器导出的 HTML 文件');
  }

  let counter = 0;
  const nextKey = (prefix: 'folder' | 'bookmark') => `${prefix}-${++counter}`;

  const traverse = (
    container: Element,
    context: TraverseContext,
  ): BookmarkImportNode[] => {
    const result: BookmarkImportNode[] = [];

    Array.from(container.children).forEach((child) => {
      const tagName = child.tagName.toUpperCase();

      if (tagName === 'DT') {
        const directChildren = Array.from(child.children);
        const folderHeading = directChildren.find(
          (item) => item.tagName.toUpperCase() === 'H3',
        );
        const bookmarkLink = directChildren.find(
          (item) => item.tagName.toUpperCase() === 'A',
        );
        const nestedList = directChildren.find(
          (item) => item.tagName.toUpperCase() === 'DL',
        );

        if (folderHeading) {
          const folderKey = nextKey('folder');
          const title = folderHeading.textContent?.trim() || 'Untitled Folder';
          const pathLabels = [...context.pathLabels, title];
          const ancestorFolderKeys = [...context.ancestorFolderKeys];
          const nextContext: TraverseContext = {
            ancestorFolderKeys: [...ancestorFolderKeys, folderKey],
            pathLabels,
            depth: context.depth + 1,
            parentFolderKey: folderKey,
          };
          const children = nestedList ? traverse(nestedList, nextContext) : [];

          result.push({
            key: folderKey,
            type: 'folder',
            title,
            addDate: readMaybeNumber(getAttr(folderHeading, 'add_date')),
            parentKey: context.parentFolderKey,
            depth: context.depth,
            pathLabels,
            ancestorFolderKeys,
            children,
          });
          return;
        }

        if (bookmarkLink) {
          const url = getAttr(bookmarkLink, 'href') || '';
          if (!url) return;

          const title = bookmarkLink.textContent?.trim() || url;
          result.push({
            key: nextKey('bookmark'),
            type: 'bookmark',
            title,
            url,
            icon: getAttr(bookmarkLink, 'icon'),
            addDate: readMaybeNumber(getAttr(bookmarkLink, 'add_date')),
            parentKey: context.parentFolderKey,
            depth: context.depth,
            pathLabels: [...context.pathLabels, title],
            ancestorFolderKeys: [...context.ancestorFolderKeys],
          });
        }

        return;
      }

      if (tagName === 'DL' || tagName === 'P') {
        result.push(...traverse(child, context));
      }
    });

    return result;
  };

  const nodes = traverse(root, {
    ancestorFolderKeys: [],
    pathLabels: [],
    depth: 0,
  });

  if (nodes.length === 0) {
    throw new Error('没有解析到任何书签内容');
  }

  return nodes;
}

export function buildBookmarkImportIndex(
  nodes: BookmarkImportNode[],
): BookmarkImportIndex {
  const nodeMap = new Map<string, BookmarkImportNode>();
  const folders: BookmarkImportFolder[] = [];
  const bookmarks: BookmarkImportBookmark[] = [];
  const allKeys: string[] = [];
  const defaultExpandedKeys: string[] = [];

  const visit = (items: BookmarkImportNode[]) => {
    items.forEach((item) => {
      nodeMap.set(item.key, item);
      allKeys.push(item.key);

      if (item.type === 'folder') {
        folders.push(item);
        if (item.depth < 2) {
          defaultExpandedKeys.push(item.key);
        }
        visit(item.children);
        return;
      }

      bookmarks.push(item);
    });
  };

  visit(nodes);

  return {
    nodeMap,
    folders,
    bookmarks,
    allKeys,
    defaultExpandedKeys,
  };
}
