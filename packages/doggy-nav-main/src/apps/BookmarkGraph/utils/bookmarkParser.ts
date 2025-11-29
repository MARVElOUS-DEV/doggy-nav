import { CSSProperties } from 'react';
import { v4 as uuidv4 } from 'uuid';
export type Node<T = any, U extends string | undefined = string | undefined> = {
  id: string;
  position: { x: number; y: number };
  data: T;
  type?: U;
  style?: CSSProperties;
  className?: string;
  hidden?: boolean;
  selected?: boolean;
  dragging?: boolean;
  draggable?: boolean;
  selectable?: boolean;
  connectable?: boolean;
  deletable?: boolean;
  dragHandle?: string;
  width?: number | null;
  height?: number | null;
  /** @deprecated use `parentId` instead */
  parentNode?: string;
  parentId?: string;
  zIndex?: number;
  extent?: 'parent';
  expandParent?: boolean;

  ariaLabel?: string;
  focusable?: boolean;
  resizing?: boolean;
};

export interface BookmarkNodeData {
  label: string;
  url?: string;
  icon?: string;
  isFolder: boolean;
  // Optional page index for pagination of bookmarks inside folders
  pageIndex?: number;
}

export type BookmarkGraphNode = Node<BookmarkNodeData>;

export const parseBookmarks = (htmlContent: string): BookmarkGraphNode[] => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  const nodes: BookmarkGraphNode[] = [];

  // Position calculation helpers
  const PADDING = 20;
  const NODE_WIDTH = 200; // approximate width
  const NODE_HEIGHT = 40; // approximate height

  // We'll place nodes in a grid or list initially
  const currentX = 0;
  let currentY = 0;

  const traverse = (element: HTMLElement, parentNode: string | undefined) => {
    const children = Array.from(element.children);

    for (const child of children) {
      if (child.tagName === 'DT') {
        const h3 = child.querySelector('h3');
        const a = child.querySelector('a');
        const dl = child.querySelector('dl');

        if (h3) {
          // It's a folder
          const id = uuidv4();
          const folderNode: BookmarkGraphNode = {
            id,
            type: 'folder',
            position: { x: currentX, y: currentY },
            data: {
              label: h3.textContent || 'Untitled Folder',
              isFolder: true,
            },
            parentNode: parentNode,
            extent: parentNode ? 'parent' : undefined,
            // Make folder containers significantly larger than a single bookmark card
            style: { width: 900, height: 500 },
            draggable: true,
          };
          nodes.push(folderNode);

          // Reset positions for children relative to this folder
          // Actually, if we rely on auto-layout or drag-drop, initial positions matter less
          // But let's just increment Y for now to avoid complete overlap
          currentY += 250;

          if (dl) {
            // Process children of this folder
            // We need to handle positioning inside the folder
            // For simplicity, let's just traverse. Real positioning might need a layout algo.
            traverse(dl, id);
          }
        } else if (a) {
          // It's a bookmark
          const id = uuidv4();
          const bookmarkNode: BookmarkGraphNode = {
            id,
            type: 'bookmark',
            position: { x: Math.random() * 100, y: Math.random() * 100 }, // Random pos inside parent for now
            data: {
              label: a.textContent || 'Untitled',
              url: a.getAttribute('href') || '',
              icon: a.getAttribute('icon') || '',
              isFolder: false,
            },
            parentNode: parentNode,
            extent: parentNode ? 'parent' : undefined,
          };
          nodes.push(bookmarkNode);
        }
      } else if (child.tagName === 'DL') {
        traverse(child as HTMLElement, parentNode);
      }
    }
  };

  // Start traversal from the body or main DL
  const mainDL = doc.querySelector('dl');
  if (mainDL) {
    traverse(mainDL, undefined);
  } else {
    // Try body if no main DL found
    traverse(doc.body, undefined);
  }

  return nodes;
};

export const generateBookmarksHtml = (nodes: BookmarkGraphNode[]): string => {
  // Reconstruct the tree structure from flat nodes array
  const nodeMap = new Map<string, BookmarkGraphNode>();
  const childrenMap = new Map<string, BookmarkGraphNode[]>();
  const rootNodes: BookmarkGraphNode[] = [];

  nodes.forEach((node) => {
    nodeMap.set(node.id, node);
    if (node.parentNode) {
      if (!childrenMap.has(node.parentNode)) {
        childrenMap.set(node.parentNode, []);
      }
      childrenMap.get(node.parentNode)?.push(node);
    } else {
      rootNodes.push(node);
    }
  });

  // Recursive function to build HTML
  const buildHtml = (nodeList: BookmarkGraphNode[]): string => {
    let html = '<DL><p>\n';
    nodeList.forEach((node) => {
      html += '    <DT>';
      if (node.data.isFolder) {
        html += `<H3>${escapeHtml(node.data.label)}</H3>\n`;
        const children = childrenMap.get(node.id) || [];
        if (children.length > 0) {
          html += buildHtml(children);
        }
      } else {
        html += `<A HREF="${escapeHtml(node.data.url || '')}" ICON="${escapeHtml(node.data.icon || '')}">${escapeHtml(node.data.label)}</A>\n`;
      }
      html += '</DT>\n'; // In some formats DT is not closed, but standard HTML requires it. Netscape format is quirky.
      // Netscape format often looks like: <DT><A ...>Title</A> \n <DT><H3>Folder</H3> \n <DL> ... </DL>
      // Let's try to match standard export format loosely.
    });
    html += '</DL><p>\n';
    return html;
  };

  // Sort root nodes by y position to maintain some visual order if desired
  rootNodes.sort((a, b) => a.position.y - b.position.y);

  return `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file.
    It will be read and overwritten.
    DO NOT EDIT! -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
${buildHtml(rootNodes)}`;
};

const escapeHtml = (unsafe: string) => {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};
