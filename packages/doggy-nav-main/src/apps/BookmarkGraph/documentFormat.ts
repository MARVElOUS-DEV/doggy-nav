import { v4 as uuidv4 } from 'uuid';
import type { BookmarkDocument, BookmarkDocumentItem } from './model';
import { normalizeOrders } from './model';

export interface BookmarkImportPreview {
  items: BookmarkDocumentItem[];
  newCount: number;
  duplicateCount: number;
  invalidCount: number;
}

export function parseBookmarkDocument(
  html: string,
  existing: BookmarkDocument
): BookmarkImportPreview {
  const parser = new DOMParser();
  const dom = parser.parseFromString(html, 'text/html');
  const items: BookmarkDocumentItem[] = [];
  let invalidCount = 0;
  const visit = (element: Element, parentId: string | null) => {
    let order = 0;
    Array.from(element.children).forEach((child) => {
      if (child.tagName === 'DL') {
        visit(child, parentId);
        return;
      }
      if (child.tagName !== 'DT') return;
      const heading = child.querySelector(':scope > h3');
      const anchor = child.querySelector(':scope > a');
      const nested = child.querySelector(':scope > dl');
      if (heading) {
        const id = uuidv4();
        items.push({
          id,
          type: 'folder',
          title: heading.textContent?.trim() || 'Untitled Folder',
          parentId,
          order: order++,
        });
        if (nested) visit(nested, id);
      } else if (anchor) {
        const url = anchor.getAttribute('href')?.trim();
        if (!url) {
          invalidCount += 1;
          return;
        }
        items.push({
          id: uuidv4(),
          type: 'bookmark',
          title: anchor.textContent?.trim() || url,
          url,
          ...(anchor.getAttribute('icon')
            ? { icon: anchor.getAttribute('icon') || undefined }
            : {}),
          parentId,
          order: order++,
        });
      }
    });
  };
  const root = dom.querySelector('dl');
  if (root) visit(root, null);
  const fingerprints = new Set(
    existing.items
      .filter((item) => item.type === 'bookmark')
      .map((item) => `${item.title.trim().toLowerCase()}\n${item.url?.trim().toLowerCase() || ''}`)
  );
  const unique: BookmarkDocumentItem[] = [];
  let duplicateCount = 0;
  items.forEach((item) => {
    if (item.type === 'folder') {
      unique.push(item);
      return;
    }
    const fingerprint = `${item.title.trim().toLowerCase()}\n${item.url?.trim().toLowerCase() || ''}`;
    if (fingerprints.has(fingerprint)) duplicateCount += 1;
    else {
      fingerprints.add(fingerprint);
      unique.push(item);
    }
  });
  return { items: normalizeOrders(unique), newCount: unique.length, duplicateCount, invalidCount };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function generateBookmarkDocumentHtml(document: BookmarkDocument): string {
  const children = new Map<string | null, BookmarkDocumentItem[]>();
  document.items.forEach((item) => {
    const list = children.get(item.parentId) || [];
    list.push(item);
    children.set(item.parentId, list);
  });
  const build = (parentId: string | null, depth: number): string => {
    const pad = '    '.repeat(depth);
    const body = (children.get(parentId) || [])
      .toSorted((a, b) => a.order - b.order)
      .map((item) => {
        if (item.type === 'folder') {
          return `${pad}<DT><H3>${escapeHtml(item.title)}</H3>\n${pad}<DL><p>\n${build(item.id, depth + 1)}${pad}</DL><p>\n`;
        }
        return `${pad}<DT><A HREF="${escapeHtml(item.url || '')}"${item.icon ? ` ICON="${escapeHtml(item.icon)}"` : ''}>${escapeHtml(item.title)}</A>\n`;
      })
      .join('');
    return body;
  };
  return `<!DOCTYPE NETSCAPE-Bookmark-file-1>\n<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">\n<TITLE>Bookmarks</TITLE>\n<H1>Bookmarks</H1>\n<DL><p>\n${build(null, 1)}</DL><p>\n`;
}
