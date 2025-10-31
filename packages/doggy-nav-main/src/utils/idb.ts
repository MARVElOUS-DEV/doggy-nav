// Minimal IndexedDB helper with safe fallback to localStorage
export async function getSetting<T = unknown>(key: string): Promise<T | undefined> {
  if (typeof window === 'undefined') return undefined;
  try {
    if (!('indexedDB' in window)) throw new Error('IndexedDB not supported');
    const db = await openDB('doggy-nav', 1, (db) => {
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
    });
    const tx = db.transaction('settings', 'readonly');
    const store = tx.objectStore('settings');
    const value = await requestToPromise<{ key: string; value: any } | undefined>(store.get(key));
    tx.commit?.();
    db.close();
    return (value?.value as T) ?? undefined;
  } catch {
    try {
      const raw = window.localStorage.getItem(`settings:${key}`);
      return raw ? (JSON.parse(raw) as T) : undefined;
    } catch {
      return undefined;
    }
  }
}

export async function setSetting<T = unknown>(key: string, value: T): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    if (!('indexedDB' in window)) throw new Error('IndexedDB not supported');
    const db = await openDB('doggy-nav', 1, (db) => {
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
    });
    const tx = db.transaction('settings', 'readwrite');
    const store = tx.objectStore('settings');
    await requestToPromise(store.put({ key, value }));
    await tx.done?.catch?.(() => {});
    db.close();
  } catch {
    try {
      window.localStorage.setItem(`settings:${key}`, JSON.stringify(value));
    } catch {}
  }
}

function openDB(
  name: string,
  version: number,
  onUpgrade: (db: IDBDatabase) => void
): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(name, version);
    req.onupgradeneeded = () => {
      try {
        onUpgrade(req.result);
      } catch (e) {
        reject(e);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function requestToPromise<T = any>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result as T);
    req.onerror = () => reject(req.error);
  });
}
