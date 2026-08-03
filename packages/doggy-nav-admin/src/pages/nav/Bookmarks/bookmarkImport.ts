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
  isBrowserRoot?: boolean;
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

const GENERIC_BOOKMARK_ROOT_NAMES = new Set([
  'bookmark',
  'bookmarks',
  'favorite',
  'favorites',
  'favourite',
  'favourites',
  '书签',
  '收藏',
  '收藏夹',
]);

function isGenericBookmarkRoot(title: string) {
  return GENERIC_BOOKMARK_ROOT_NAMES.has(title.trim().toLocaleLowerCase());
}

function rebaseNodes(
  nodes: BookmarkImportNode[],
  context: TraverseContext,
): BookmarkImportNode[] {
  return nodes.map((node) => {
    const pathLabels = [...context.pathLabels, node.title];

    if (node.type === 'bookmark') {
      return {
        ...node,
        parentKey: context.parentFolderKey,
        depth: context.depth,
        pathLabels,
        ancestorFolderKeys: [...context.ancestorFolderKeys],
      };
    }

    return {
      ...node,
      parentKey: context.parentFolderKey,
      depth: context.depth,
      pathLabels,
      ancestorFolderKeys: [...context.ancestorFolderKeys],
      children: rebaseNodes(node.children, {
        ancestorFolderKeys: [...context.ancestorFolderKeys, node.key],
        pathLabels,
        depth: context.depth + 1,
        parentFolderKey: node.key,
      }),
    };
  });
}

function removeBrowserBookmarkRoot(nodes: BookmarkImportNode[]) {
  const rootFolders = nodes.filter(
    (node): node is BookmarkImportFolder => node.type === 'folder',
  );
  const browserRoot =
    rootFolders.length === 1 &&
    (rootFolders[0].isBrowserRoot ||
      isGenericBookmarkRoot(rootFolders[0].title))
      ? rootFolders[0]
      : undefined;

  if (browserRoot) {
    const mergedNodes = nodes.flatMap((node) =>
      node.key === browserRoot.key ? browserRoot.children : [node],
    );

    return rebaseNodes(mergedNodes, {
      ancestorFolderKeys: [],
      pathLabels: [],
      depth: 0,
    });
  }

  return nodes;
}

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

    const containerChildren = Array.from(container.children);

    for (
      let childIndex = 0;
      childIndex < containerChildren.length;
      childIndex += 1
    ) {
      const child = containerChildren[childIndex];
      const tagName = child.tagName.toUpperCase();

      if (tagName === 'DT') {
        const directChildren = Array.from(child.children);
        const folderHeading = directChildren.find(
          (item) => item.tagName.toUpperCase() === 'H3',
        );
        const bookmarkLink = directChildren.find(
          (item) => item.tagName.toUpperCase() === 'A',
        );
        let nestedList = directChildren.find(
          (item) => item.tagName.toUpperCase() === 'DL',
        );

        // Netscape bookmark HTML is intentionally loose markup. Depending on
        // the browser, the folder's DL can be parsed as the DT's next sibling.
        if (folderHeading && !nestedList) {
          let siblingIndex = childIndex + 1;
          while (
            siblingIndex < containerChildren.length &&
            containerChildren[siblingIndex].tagName.toUpperCase() === 'P' &&
            !containerChildren[siblingIndex].children.length
          ) {
            siblingIndex += 1;
          }

          if (containerChildren[siblingIndex]?.tagName.toUpperCase() === 'DL') {
            nestedList = containerChildren[siblingIndex];
            childIndex = siblingIndex;
          }
        }

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
            isBrowserRoot:
              getAttr(folderHeading, 'personal_toolbar_folder') === 'true',
          });
          continue;
        }

        if (bookmarkLink) {
          const url = getAttr(bookmarkLink, 'href') || '';
          if (!url) continue;

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

        continue;
      }

      if (tagName === 'DL' || tagName === 'P') {
        result.push(...traverse(child, context));
      }
    }

    return result;
  };

  const nodes = removeBrowserBookmarkRoot(
    traverse(root, {
      ancestorFolderKeys: [],
      pathLabels: [],
      depth: 0,
    }),
  );

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
