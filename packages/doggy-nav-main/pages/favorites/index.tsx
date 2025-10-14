import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Spin, Empty, Button } from '@arco-design/web-react';
import AuthGuard from '@/components/AuthGuard';
import { NavItem } from '@/types';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { authStateAtom, favoritesAtom, favoritesActionsAtom, initAuthFromStorageAtom } from '@/store/store';
import { useTranslation } from 'react-i18next';
import { DragEndEvent } from '@dnd-kit/core';
import api from '@/utils/api';
import FavoritesLayout from '@/features/favorites/components/FavoritesLayout';
import FavoriteItem from '@/features/favorites/components/FavoriteItem';
import FolderTile from '@/features/favorites/components/FolderTile';
import DraggableCard from '@/features/favorites/dnd/DraggableCard';
import DroppableCard from '@/features/favorites/dnd/DroppableCard';
import FolderOverlay from '@/features/favorites/components/FolderOverlay';


// Local union type for grid entries without changing global store types
const getNavId = (item: NavItem) => String((item as any).id ?? (item as any)._id ?? item.href ?? item.name ?? 'nav-item');
const getNavObjectId = (item: NavItem): string | null => ((item as any).id as string) || ((item as any)._id as string) || null;

type GridEntry =
  | { kind: 'item'; item: NavItem }
  | { kind: 'folder'; id: string; name?: string; items: NavItem[] };

export default function FavoritesPage() {
  const authState = useAtomValue(authStateAtom);
  const [favorites, setFavorites] = useAtom(favoritesAtom);
  const favoritesActions = useSetAtom(favoritesActionsAtom);
  const initAuth = useSetAtom(initAuthFromStorageAtom);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation('translation');

  const [grid, setGrid] = useState<GridEntry[]>([]);
  const [openFolder, setOpenFolder] = useState<{ id: string; name?: string; items: NavItem[] } | null>(null);

  // Load structured favorites (folders + items)
  const loadStructured = async (): Promise<GridEntry[]> => {
    try {
      const res = await api.getFavoritesStructured();
      const entries = (res?.data || []).map((row: any) => {
        if (row.type === 'folder') {
          return { kind: 'folder', id: String(row.folder.id), name: row.folder.name, items: row.items } as GridEntry;
        }
        return { kind: 'item', item: row.nav } as GridEntry;
      });
      setGrid(entries);
      return entries;
    } catch (e) {
      console.error('Failed to load structured favorites:', e);
      return [];
    }
  };

  // Refresh structured data when favorites load or auth changes
  useEffect(() => {
    if (authState.initialized && authState.isAuthenticated) {
      loadStructured();
    } else {
      setGrid([]);
    }
  }, [authState.initialized, authState.isAuthenticated, favorites]);

  // Ensure auth is initialized here and add animation class for fade-in effects
  useEffect(() => {
    initAuth();
    if (typeof document !== 'undefined') {
      document.body.classList.add('animate-fade-in');
    }
    return () => {
      document && document.body.classList.remove('animate-fade-in');
    };
  }, [initAuth]);

  // Load favorites via store action when auth is initialized
  useEffect(() => {
    let canceled = false;
    const run = async () => {
      if (!authState.initialized) return;
      if (!authState.isAuthenticated) {
        setFavorites([]);
        setError(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        await favoritesActions({ type: 'LOAD_FAVORITES' });
      } catch (err) {
        const message = err instanceof Error ? err.message : t('operation_failed');
        if (!canceled) setError(message);
        setFavorites([]);
      } finally {
        if (!canceled) setLoading(false);
      }
    };
    run();
    return () => {
      canceled = true;
    };
  }, [authState.initialized, authState.isAuthenticated, favoritesActions, setFavorites, t]);

  const idOf = (e: GridEntry) => (e.kind === 'item' ? getNavId(e.item) : String(e.id));

  const onDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const sourceId = String(active.id);
    const targetId = String(over.id);

    const sourceEntry = grid.find((e) => (e.kind === 'item' && getNavId(e.item) === sourceId) || (e.kind === 'folder' && e.id === sourceId));
    const targetEntry = grid.find((e) => (e.kind === 'item' && getNavId(e.item) === targetId) || (e.kind === 'folder' && e.id === targetId));

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
        await api.createFavoriteFolder({ name: t('folder'), navIds: [targetNavId, sourceNavId] });
      }
      await loadStructured();
    } catch (err) {
      console.error('Drag operation failed:', err);
    }
  };

  const handleRemoveFavorite = async (navId: string) => {
    try {
      await api.removeFavorite(navId);
      await favoritesActions({ type: 'LOAD_FAVORITES' });
      const entries = await loadStructured();
      if (openFolder) {
        const folder = entries.find((e) => e.kind === 'folder' && e.id === openFolder.id) as Extract<GridEntry, { kind: 'folder' }> | undefined;
        if (folder) setOpenFolder({ id: folder.id, name: folder.name, items: folder.items });
        else setOpenFolder(null);
      }
    } catch (e) {
      console.error('Remove favorite failed:', e);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <Spin size={40} />
      </div>
    );
  }

  return (
    <AuthGuard redirectTo="/login">
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-indigo-50 to-purple-100">
        <Head>
          <title>{t('my_favorites')} - DoggyNav</title>
          <meta name="description" content={t('my_favorite_websites')} />
        </Head>


        <main className="max-w-7xl mx-auto px-6 py-10 pb-32"> {/* Add pb-32 to account for footer */}
          {error && (
            <div className="bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-2xl p-6 mb-8 text-red-700 shadow-lg animate-shake">
              {error}
            </div>
          )}

          {favorites.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-28 bg-white/20 backdrop-blur-lg rounded-3xl border border-white/30 shadow-xl max-w-2xl mx-auto animate-fade-in-up">
              <div className="relative mb-8">
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-400/20 to-purple-500/20 rounded-full blur-lg opacity-70"></div>
                <Empty
                  description={
                    <span className="text-gray-600 font-medium">{t('no_favorite_websites')}</span>
                  }
                  className="relative"
                />
              </div>
              <p className="text-gray-700 mb-8 text-center max-w-md text-lg">
                {t('no_favorite_websites_tip')}
              </p>
              <Link href="/navcontents">
                <Button
                  type="primary"
                  size="large"
                  className="px-8 py-5 text-lg rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  {t('go_browse_websites')}
                </Button>
              </Link>
            </div>
          ) : (
            <FavoritesLayout onDragEnd={onDragEnd}>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-8">
                {grid.map((entry, index) => {
                  const key = entry.kind === 'item' ? getNavId(entry.item) : String(entry.id);
                  return (
                    <DroppableCard key={key} id={key}>
                      <div
                        className="animate-fade-in-up"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <DraggableCard id={key}>
                          {entry.kind === 'item' ? (
                            <FavoriteItem item={entry.item} onRemove={handleRemoveFavorite} />
                          ) : (
                            <FolderTile items={entry.items} name={entry.name}
                              onClick={() => setOpenFolder({ id: entry.id, name: entry.name, items: entry.items })}
                            />
                          )}
                        </DraggableCard>
                      </div>
                    </DroppableCard>
                  );
                })}
              </div>
            </FavoritesLayout>
          )}
        </main>

        {/* Mac-style Floating Menu Bar */}
        <footer className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white/30 backdrop-blur-xl rounded-2xl border border-white/50 shadow-xl p-3 flex items-center space-x-6 z-50">
          <Link href="/" className="flex flex-col items-center text-xs text-gray-700 hover:text-blue-600 transition-colors">
            <div className="w-10 h-10 bg-white/80 backdrop-blur-sm rounded-xl flex items-center justify-center mb-1 hover:bg-white transition-colors shadow-sm">
              <span className="text-lg">🏠</span>
            </div>
            <span>{t('home')}</span>
          </Link>
          <Link href="/search" className="flex flex-col items-center text-xs text-gray-700 hover:text-blue-600 transition-colors">
            <div className="w-10 h-10 bg-white/80 backdrop-blur-sm rounded-xl flex items-center justify-center mb-1 hover:bg-white transition-colors shadow-sm">
              <span className="text-lg">🔍</span>
            </div>
            <span>{t('search')}</span>
          </Link>
          <Link href="/favorites" className="flex flex-col items-center text-xs text-blue-600 transition-colors">
            <div className="w-10 h-10 bg-blue-500 backdrop-blur-sm rounded-xl flex items-center justify-center mb-1 transition-colors shadow-sm">
              <span className="text-lg text-white">⭐</span>
            </div>
            <span>{t('favorites')}</span>
          </Link>
          <Link href="/timeline" className="flex flex-col items-center text-xs text-gray-700 hover:text-blue-600 transition-colors">
            <div className="w-10 h-10 bg-white/80 backdrop-blur-sm rounded-xl flex items-center justify-center mb-1 hover:bg-white transition-colors shadow-sm">
              <span className="text-lg">📊</span>
            </div>
            <span>{t('timeline')}</span>
          </Link>
          <Link href="/navcontents" className="flex flex-col items-center text-xs text-gray-700 hover:text-blue-600 transition-colors">
            <div className="w-10 h-10 bg-white/80 backdrop-blur-sm rounded-xl flex items-center justify-center mb-1 hover:bg-white transition-colors shadow-sm">
              <span className="text-lg">📚</span>
            </div>
            <span>{t('categories')}</span>
          </Link>
        </footer>
      </div>
      {openFolder && (
        <FolderOverlay
          name={openFolder.name}
          items={openFolder.items}
          onRemove={handleRemoveFavorite}
          onClose={() => setOpenFolder(null)}
        />
      )}
    </AuthGuard>
  );
}

FavoritesPage.getLayout = (page) => {
  return page;
}