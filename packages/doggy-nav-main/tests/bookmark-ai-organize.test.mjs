import assert from 'node:assert/strict';
import {
  bookmarkOrganizeResponseToDocument,
  documentToBookmarkOrganizeRequest,
} from '../src/apps/BookmarkGraph/aiOrganizeDocument.ts';
import { runPackedLayout } from '../src/apps/BookmarkGraph/elkLayout.ts';

const source = {
  version: 2,
  items: [
    {
      id: 'root',
      type: 'bookmark',
      title: 'Root',
      url: 'https://root.example/full?q=1',
      icon: 'root.png',
      parentId: null,
      order: 1,
    },
    { id: 'folder-a', type: 'folder', title: 'Old name', parentId: null, order: 0 },
    { id: 'nested', type: 'folder', title: 'Nested', parentId: 'folder-a', order: 1 },
    {
      id: 'child',
      type: 'bookmark',
      title: 'Child title',
      url: 'https://child.example/path',
      icon: 'data:image/png;base64,abc',
      parentId: 'folder-a',
      order: 0,
    },
  ],
};

assert.deepEqual(documentToBookmarkOrganizeRequest(source, '  Make it useful  '), {
  instruction: 'Make it useful',
  bookmarks: [
    { id: 'root', title: 'Root', url: 'https://root.example/full?q=1' },
    { id: 'child', title: 'Child title', url: 'https://child.example/path' },
  ],
  tree: [
    {
      id: 'folder-a',
      title: 'Old name',
      children: ['child', { id: 'nested', title: 'Nested', children: [] }],
    },
    'root',
  ],
});

const organized = bookmarkOrganizeResponseToDocument(source, {
  tree: [
    'child',
    {
      id: 'ai-folder-search',
      title: 'Search tools',
      children: [{ id: 'folder-a', title: 'Renamed', children: ['root'] }],
    },
  ],
});
assert.deepEqual(organized, {
  version: 2,
  items: [
    {
      id: 'child',
      type: 'bookmark',
      title: 'Child title',
      url: 'https://child.example/path',
      icon: 'data:image/png;base64,abc',
      parentId: null,
      order: 0,
    },
    { id: 'ai-folder-search', type: 'folder', title: 'Search tools', parentId: null, order: 1 },
    { id: 'folder-a', type: 'folder', title: 'Renamed', parentId: 'ai-folder-search', order: 0 },
    {
      id: 'root',
      type: 'bookmark',
      title: 'Root',
      url: 'https://root.example/full?q=1',
      icon: 'root.png',
      parentId: 'folder-a',
      order: 0,
    },
  ],
});

assert.throws(
  () => bookmarkOrganizeResponseToDocument(source, { tree: ['root'] }),
  /missing bookmarks/
);
assert.throws(
  () => bookmarkOrganizeResponseToDocument(source, { tree: ['root', 'root', 'child'] }),
  /invalid bookmarks/
);

const laidOut = await runPackedLayout(organized, {
  positions: { stale: { x: 1, y: 1 } },
  collapsedFolderIds: [],
  viewport: { x: 0, y: 0, zoom: 1 },
  filters: { query: '', visibleFolderIds: [] },
});
assert.deepEqual(
  new Set(Object.keys(laidOut.positions)),
  new Set(organized.items.map(({ id }) => id))
);
