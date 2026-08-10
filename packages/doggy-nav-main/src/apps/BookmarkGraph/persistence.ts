import { openDB } from 'idb';
import {
  EMPTY_DOCUMENT,
  EMPTY_VIEW_STATE,
  migrateLegacyNodes,
  type BookmarkDocument,
  type BookmarkEditorViewState,
  type LegacyBookmarkGraphNode,
} from './model';

const DB_NAME = 'bookmark-graph-db';
const STORE_NAME = 'graph-state';
const DOCUMENT_V2_KEY = 'document-v2';
const VIEW_V2_KEY = 'view-v2';
const MAX_SAFE_POSITION = 100_000;

function safeView(view?: BookmarkEditorViewState): BookmarkEditorViewState {
  const next = { ...EMPTY_VIEW_STATE, ...view };
  const positionsAreSafe = Object.values(next.positions).every(
    ({ x, y }) =>
      Number.isFinite(x) &&
      Number.isFinite(y) &&
      Math.abs(x) <= MAX_SAFE_POSITION &&
      Math.abs(y) <= MAX_SAFE_POSITION
  );
  return positionsAreSafe ? next : { ...next, positions: {}, viewport: EMPTY_VIEW_STATE.viewport };
}

async function database() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME);
    },
  });
}

export async function loadWorkspace(): Promise<{
  document: BookmarkDocument;
  view: BookmarkEditorViewState;
  migrated: boolean;
}> {
  const db = await database();
  const document = (await db.get(STORE_NAME, DOCUMENT_V2_KEY)) as BookmarkDocument | undefined;
  const view = (await db.get(STORE_NAME, VIEW_V2_KEY)) as BookmarkEditorViewState | undefined;
  if (document?.version === 2 && Array.isArray(document.items)) {
    return { document, view: safeView(view), migrated: false };
  }
  const legacyNodes = (await db.get(STORE_NAME, 'nodes')) as LegacyBookmarkGraphNode[] | undefined;
  const legacyView = (await db.get(STORE_NAME, 'view')) as
    | { scale?: number; position?: { x: number; y: number } }
    | undefined;
  if (!legacyNodes?.length)
    return { document: EMPTY_DOCUMENT, view: EMPTY_VIEW_STATE, migrated: false };
  return {
    document: migrateLegacyNodes(legacyNodes),
    view: {
      ...EMPTY_VIEW_STATE,
      positions: Object.fromEntries(legacyNodes.map((node) => [node.id, node.position])),
      viewport: {
        x: legacyView?.position?.x || 0,
        y: legacyView?.position?.y || 0,
        zoom: legacyView?.scale || 1,
      },
    },
    migrated: true,
  };
}

export async function saveWorkspace(document: BookmarkDocument, view: BookmarkEditorViewState) {
  const db = await database();
  const transaction = db.transaction(STORE_NAME, 'readwrite');
  await Promise.all([
    transaction.store.put(document, DOCUMENT_V2_KEY),
    transaction.store.put(view, VIEW_V2_KEY),
    transaction.done,
  ]);
  // Legacy keys remain solely as a migration source. They are never read after this document exists.
}

export async function clearWorkspace() {
  const db = await database();
  await db.clear(STORE_NAME);
}
