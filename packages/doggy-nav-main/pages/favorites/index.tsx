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
import FavoritesLayout from '@/features/favorites/components/FavoritesLayout';
import FavoriteItem from '@/features/favorites/components/FavoriteItem';
import FolderTile from '@/features/favorites/components/FolderTile';
import DraggableCard from '@/features/favorites/dnd/DraggableCard';
import DroppableCard from '@/features/favorites/dnd/DroppableCard';


// Local union type for grid entries without changing global store types
const getNavId = (item: NavItem) => String((item as any).id ?? (item as any)._id ?? item.href ?? item.name ?? 'nav-item');

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

  // Keep a local grid that can have folders, derived from favorites
  useEffect(() => {
    setGrid((prev) => {
      // Preserve existing folders; only add new standalone items from favorites that are not already grouped
      const existingItemIds = new Set<string>(
        prev.flatMap((e) => (e.kind === 'item' ? [getNavId(e.item)] : e.items.map((i) => getNavId(i))))
      );
      const newItems: GridEntry[] = favorites
        .filter((f) => !existingItemIds.has(getNavId(f)))
        .map((f) => ({ kind: 'item', item: f }));
      // Prune items no longer present in favorites
      const validIds = new Set(favorites.map((f) => getNavId(f)));
      const pruned = prev
        .map((e) =>
          e.kind === 'item'
            ? e
            : { ...e, items: e.items.filter((it) => validIds.has(getNavId(it))) }
        )
        .filter((e) => (e.kind === 'item' ? validIds.has(getNavId(e.item)) : e.items.length > 0));
      return [...pruned, ...newItems];
    });
  }, [favorites]);

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

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const sourceId = String(active.id);
    const targetId = String(over.id);

    setGrid((entries) => {
      let sourceEntry: NavItem | null = null;

      // Remove source from its current location (top-level or inside a folder)
      const withoutSource: GridEntry[] = entries
        .map((e) => {
          if (e.kind === 'item' && getNavId(e.item) === sourceId) {
            sourceEntry = e.item;
            return null;
          }
          if (e.kind === 'folder') {
            const inside = e.items.find((it) => getNavId(it) === sourceId);
            if (inside) {
              sourceEntry = inside;
              return { ...e, items: e.items.filter((it) => getNavId(it) !== sourceId) };
            }
          }
          return e;
        })
        .filter(Boolean) as GridEntry[];

      if (!sourceEntry) return entries;

      const targetIndex = withoutSource.findIndex((e) => idOf(e) === targetId);
      if (targetIndex === -1) return withoutSource;
      const target = withoutSource[targetIndex];

      if (target.kind === 'folder') {
        const updated = [...withoutSource];
        const folder = updated[targetIndex] as Extract<GridEntry, { kind: 'folder' }>;
        if (!folder.items.find((it) => getNavId(it) === getNavId(sourceEntry!))) {
          folder.items = [...folder.items, sourceEntry!];
        }
        return updated;
      }

      // target is an item: create a new folder combining both
      const targetItem = target.item;
      if (getNavId(sourceEntry) === getNavId(targetItem)) return entries;

      const updated = withoutSource.filter((_, idx) => idx !== targetIndex);
      const newFolder: GridEntry = {
        kind: 'folder',
        id: `folder-${Date.now()}-${getNavId(targetItem)}`,
        name: undefined,
        items: [targetItem, sourceEntry],
      };
      updated.splice(targetIndex, 0, newFolder);
      return updated;
    });
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
                            <FavoriteItem item={entry.item} />
                          ) : (
                            <FolderTile items={entry.items} />
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
    </AuthGuard>
  );
}

FavoritesPage.getLayout = (page) => {
  return page;
}