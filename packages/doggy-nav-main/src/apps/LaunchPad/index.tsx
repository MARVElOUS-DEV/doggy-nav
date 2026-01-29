import { useEffect, useMemo, useState } from 'react';
import type { DragEndEvent } from '@dnd-kit/core';
import api from '@/utils/api';
import FavoriteItem from '@/features/favorites/components/FavoriteItem';
import FolderTile from '@/features/favorites/components/FolderTile';
import FolderOverlay from '@/features/favorites/components/FolderOverlay';
import FavoritesLayout from '@/features/favorites/components/FavoritesLayout';
import DraggableCard from '@/features/favorites/dnd/DraggableCard';
import DroppableCard from '@/features/favorites/dnd/DroppableCard';
import type { NavItem } from '@/types';

type GridEntry =
  | { kind: 'item'; item: NavItem }
  | { kind: 'folder'; id: string; name?: string; items: NavItem[] };
// Paging
const perPage = 6 * 4; // 24 icons per page

export default function Launchpad({
  open,
  onClose,
  withinArea = true,
  dockOffset = 0,
}: {
  open: boolean;
  onClose: () => void;
  withinArea?: boolean;
  dockOffset?: number;
}) {
  const [entries, setEntries] = useState<GridEntry[]>([]);
  const [page, setPage] = useState(0);
  const [folderOpen, setFolderOpen] = useState<null | {
    id: string;
    name?: string;
    items: NavItem[];
  }>(null);

  // Helpers to identify items/folders for DnD and API
  const getNavId = (item: NavItem) =>
    String((item as any).id ?? item.href ?? item.name ?? 'nav-item');
  const getNavObjectId = (item: NavItem): string | null => ((item as any).id as string) || null;

  // Load favorites structure
  const loadStructured = async (): Promise<GridEntry[]> => {
    try {
      const res = await api.getFavoritesStructured();
      const mapped: GridEntry[] = (res?.data || []).map((row: any) =>
        row.type === 'folder'
          ? { kind: 'folder', id: String(row.folder.id), name: row.folder.name, items: row.items }
          : { kind: 'item', item: row.nav }
      );
      setEntries(mapped);
      return mapped;
    } catch {
      setEntries([]);
      return [];
    }
  };

  // Fetch favorites structure when launchpad opens
  useEffect(() => {
    let cancel = false;
    async function load() {
      if (!open) return;
      const data = await loadStructured();
      if (cancel) return;
      setEntries(data);
    }
    load();
    return () => {
      cancel = true;
    };
  }, [open]);

  // Close on escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setPage((p) => p + 1);
      if (e.key === 'ArrowLeft') setPage((p) => Math.max(0, p - 1));
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const pages = useMemo(() => {
    const arr: GridEntry[][] = [];
    for (let i = 0; i < entries.length; i += perPage) arr.push(entries.slice(i, i + perPage));
    return arr.length > 0 ? arr : [[]];
  }, [entries]);
  const safePage = Math.min(page, Math.max(0, pages.length - 1));
  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [safePage, page]);

  // Drag to compose folder or add to folder
  const onDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const sourceId = String(active.id);
    const targetId = String(over.id);

    const sourceEntry = entries.find(
      (e) =>
        (e.kind === 'item' && getNavId(e.item) === sourceId) ||
        (e.kind === 'folder' && e.id === sourceId)
    );
    const targetEntry = entries.find(
      (e) =>
        (e.kind === 'item' && getNavId(e.item) === targetId) ||
        (e.kind === 'folder' && e.id === targetId)
    );

    // Only allow moving items (not folders) in current implementation
    if (!sourceEntry || sourceEntry.kind !== 'item' || !targetEntry) return;

    try {
      const sourceNavId = getNavObjectId(sourceEntry.item);
      if (!sourceNavId) return;
      if (targetEntry.kind === 'folder') {
        await api.updateFavoriteFolder(targetEntry.id, { addNavIds: [sourceNavId] });
      } else if (targetEntry.kind === 'item') {
        const targetNavId = getNavObjectId(targetEntry.item);
        if (!targetNavId) return;
        await api.createFavoriteFolder({ name: 'Folder', navIds: [targetNavId, sourceNavId] });
      }
      const updated = await loadStructured();
      // If an overlay is open for a folder, refresh its content
      if (folderOpen) {
        const folder = updated.find((e) => e.kind === 'folder' && e.id === folderOpen.id) as
          | Extract<GridEntry, { kind: 'folder' }>
          | undefined;
        setFolderOpen(folder ? { id: folder.id, name: folder.name, items: folder.items } : null);
      }
    } catch (err) {
      console.error('Drag operation failed:', err);
    }
  };

  // Remove from favorites (used in folder overlay)
  const handleRemoveFavorite = async (navId: string) => {
    try {
      await api.removeFavorite(navId);
      const updated = await loadStructured();
      if (folderOpen) {
        const folder = updated.find((e) => e.kind === 'folder' && e.id === folderOpen.id) as
          | Extract<GridEntry, { kind: 'folder' }>
          | undefined;
        setFolderOpen(folder ? { id: folder.id, name: folder.name, items: folder.items } : null);
      }
    } catch (e) {
      console.error('Remove favorite failed:', e);
    }
  };

  // Move item out from current folder
  const handleMoveOutOfFolder = async (navId: string) => {
    if (!folderOpen) return;
    try {
      await api.updateFavoriteFolder(folderOpen.id, { removeNavIds: [navId] });
      let updated = await loadStructured();
      const folder = updated.find((e) => e.kind === 'folder' && e.id === folderOpen.id) as
        | Extract<GridEntry, { kind: 'folder' }>
        | undefined;
      if (folder && folder.items.length <= 1) {
        // Dissolve the folder: move remaining item out and delete folder
        if (folder.items.length === 1) {
          const lastId = getNavObjectId(folder.items[0]);
          if (lastId) await api.updateFavoriteFolder(folder.id, { removeNavIds: [lastId] });
        }
        await api.deleteFavoriteFolder(folderOpen.id);
        updated = await loadStructured();
        setFolderOpen(null);
      } else if (folder) {
        setFolderOpen({ id: folder.id, name: folder.name, items: folder.items });
      } else {
        setFolderOpen(null);
      }
    } catch (e) {
      console.error('Move out of folder failed:', e);
    }
  };

  if (!open) return null;
  // When not withinArea, cover header bar and windows area, but leave dock clickable (computed bottom)
  const rootClass = withinArea ? 'absolute inset-0 z-[85]' : 'fixed left-0 right-0 top-0 z-[85]';
  const rootStyle = withinArea ? undefined : ({ bottom: dockOffset } as React.CSSProperties);

  return (
    <div className={rootClass} style={rootStyle}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-xl" onClick={onClose} />

      {/* Content */}
      <div className="relative h-full w-full flex flex-col pt-16 pb-28 px-6">
        <div className="w-full max-w-6xl flex-1 relative mx-auto">
          <FavoritesLayout onDragEnd={onDragEnd}>
            {pages.map((pg, idx) => (
              <div
                key={idx}
                className="absolute transition-opacity duration-300"
                style={{
                  opacity: idx === safePage ? 1 : 0,
                  pointerEvents: idx === safePage ? 'auto' : 'none',
                }}
              >
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-8 xl:grid-cols-10 gap-8 justify-items-center">
                  {pg.map((entry, i) => {
                    const id = entry.kind === 'item' ? getNavId(entry.item) : entry.id;
                    return (
                      <DroppableCard key={id} id={id}>
                        <div
                          className="animate-fade-in-up"
                          style={{ animationDelay: `${i * 30}ms` }}
                        >
                          <DraggableCard id={id}>
                            {entry.kind === 'item' ? (
                              <FavoriteItem item={entry.item} />
                            ) : (
                              <FolderTile
                                items={entry.items}
                                name={entry.name}
                                onClick={() =>
                                  setFolderOpen({
                                    id: entry.id,
                                    name: entry.name,
                                    items: entry.items,
                                  })
                                }
                              />
                            )}
                          </DraggableCard>
                        </div>
                      </DroppableCard>
                    );
                  })}
                </div>
              </div>
            ))}
          </FavoritesLayout>
        </div>

        {/* Dots paginator */}
        <div
          className="absolute left-0 right-0 flex items-center justify-center gap-2"
          style={{ bottom: dockOffset }}
        >
          {pages.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setPage(i)}
              className="w-2.5 h-2.5 rounded-full transition-colors"
              style={{
                backgroundColor: i === safePage ? 'var(--color-foreground)' : 'var(--color-muted)',
              }}
              aria-label={`Go to page ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Folder overlay reuse */}
      {folderOpen && (
        <FolderOverlay
          name={folderOpen.name}
          items={folderOpen.items}
          onRemove={handleRemoveFavorite}
          onMoveOut={handleMoveOutOfFolder}
          onClose={() => setFolderOpen(null)}
        />
      )}
    </div>
  );
}
