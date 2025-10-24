import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '@/utils/api';
import FavoriteItem from '@/features/favorites/components/FavoriteItem';
import FolderTile from '@/features/favorites/components/FolderTile';
import FolderOverlay from '@/features/favorites/components/FolderOverlay';
import type { NavItem } from '@/types';

type GridEntry =
  | { kind: 'item'; item: NavItem }
  | { kind: 'folder'; id: string; name?: string; items: NavItem[] };

export default function Launchpad({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [entries, setEntries] = useState<GridEntry[]>([]);
  const [page, setPage] = useState(0);
  const [folderOpen, setFolderOpen] = useState<null | { id: string; name?: string; items: NavItem[] }>(null);

  // Fetch favorites structure when launchpad opens
  useEffect(() => {
    let cancel = false;
    async function load() {
      if (!open) return;
      try {
        const res = await api.getFavoritesStructured();
        if (!res?.data || cancel) return;
        const mapped: GridEntry[] = res.data.map((row: any) =>
          row.type === 'folder'
            ? { kind: 'folder', id: String(row.folder.id), name: row.folder.name, items: row.items }
            : { kind: 'item', item: row.nav }
        );
        setEntries(mapped);
      } catch {
        setEntries([]);
      }
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

  // Paging
  const perPage = 6 * 4; // 24 icons per page
  const pages = useMemo(() => {
    const arr: GridEntry[][] = [];
    for (let i = 0; i < entries.length; i += perPage) arr.push(entries.slice(i, i + perPage));
    return arr.length > 0 ? arr : [[]];
  }, [entries]);
  const safePage = Math.min(page, Math.max(0, pages.length - 1));
  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [safePage]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[85]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-xl" onClick={onClose} />

      {/* Content */}
      <div className="relative h-full w-full flex flex-col items-center pt-16 pb-28 px-6">
        <div className="w-full max-w-6xl flex-1 flex items-center justify-center">
          {pages.map((pg, idx) => (
            <div
              key={idx}
              className="absolute transition-opacity duration-300"
              style={{ opacity: idx === safePage ? 1 : 0, pointerEvents: idx === safePage ? 'auto' : 'none' }}
            >
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-8">
                {pg.map((entry, i) => (
                  <div key={(entry as any).id ?? i} className="animate-fade-in-up" style={{ animationDelay: `${i * 30}ms` }}>
                    {entry.kind === 'item' ? (
                      <FavoriteItem item={entry.item} />
                    ) : (
                      <FolderTile
                        items={entry.items}
                        name={entry.name}
                        onClick={() => setFolderOpen({ id: entry.id, name: entry.name, items: entry.items })}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Dots paginator */}
        <div className="absolute bottom-24 flex items-center gap-2">
          {pages.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setPage(i)}
              className="w-2.5 h-2.5 rounded-full transition-colors"
              style={{ backgroundColor: i === safePage ? 'var(--color-foreground)' : 'var(--color-muted)' }}
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
          onRemove={() => {}}
          onClose={() => setFolderOpen(null)}
        />
      )}
    </div>
  );
}
