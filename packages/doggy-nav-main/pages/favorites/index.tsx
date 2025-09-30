import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Spin, Empty, Button } from '@arco-design/web-react';
import { IconLeft } from '@arco-design/web-react/icon';
import AuthGuard from '@/components/AuthGuard';
import { NavItem } from '@/types';
import { useAtomValue } from 'jotai';
import { authStateAtom } from '@/store/store';

// iPad-style favorite item with enhanced glassmorphism
const FavoriteItem = ({ item, onRemove }: { item: NavItem; onRemove: (id: string) => void }) => {
  return (
    <div className="group relative bg-white/20 backdrop-blur-xl rounded-3xl border border-white/30 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 overflow-hidden animate-fade-in">
      {/* Decorative gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent pointer-events-none"></div>

      {/* Status indicator */}
      <div className="absolute top-4 right-4 w-3 h-3 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 shadow-lg shadow-green-200/50 animate-pulse"></div>

      {/* Main content */}
      <Link href={item.href} target="_blank" rel="noopener noreferrer" className="block p-6">
        <div className="flex items-start space-x-4">
          {item.logo ? (
            <div className="flex-shrink-0 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-purple-500/20 rounded-2xl blur-md opacity-50"></div>
              <img
                src={item.logo}
                alt={item.name}
                className="relative w-14 h-14 rounded-2xl object-contain shadow-lg transition-all duration-300 group-hover:scale-105 border border-white/20"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/default-web.png';
                }}
              />
            </div>
          ) : (
            <div className="flex-shrink-0 relative w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg border border-white/20">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl"></div>
              <span className="relative">{item.name?.charAt(0) || 'W'}</span>
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors duration-300 truncate">
              {item.name}
            </h3>
            <p className="text-sm text-gray-700 group-hover:text-gray-800 transition-colors duration-300 line-clamp-2 mt-2">
              {item.desc || '这个网站什么描述也没有...'}
            </p>

            {item.tags && item.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {item.tags.slice(0, 2).map((tag, index) => (
                  <span
                    key={index}
                    className="bg-white/40 backdrop-blur-sm text-gray-700 text-xs px-3 py-1.5 rounded-full border border-white/30 shadow-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </Link>

      {/* Stats and actions */}
      <div className="border-t border-white/20 px-6 py-4 bg-white/10 backdrop-blur-sm flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center text-sm text-gray-600">
            <i className="iconfont icon-attentionfill mr-1.5"></i>
            <span className="font-medium">{item.view || 0}</span>
          </div>
          <div className="flex items-center text-sm text-red-500">
            <i className="iconfont icon-appreciatefill mr-1.5"></i>
            <span className="font-medium">{item.star || 0}</span>
          </div>
        </div>

        <button
          onClick={() => onRemove(item.id)}
          className="text-gray-500 hover:text-red-500 transition-all duration-300 hover:scale-110"
          title="取消收藏"
        >
          <i className="iconfont icon-close text-lg"></i>
        </button>
      </div>
    </div>
  );
};

export default function FavoritesPage() {
  const router = useRouter();
  const authState = useAtomValue(authStateAtom);
  const [favorites, setFavorites] = useState<NavItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add animation class to document for fade-in effects
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.classList.add('animate-fade-in');
    }
    return () => {
      document && document.body.classList.remove('animate-fade-in');
    };
  }, []);

  // Get favorites from localStorage on mount
  useEffect(() => {
    const loadFavorites = () => {
      if (typeof window !== 'undefined' && authState.isAuthenticated) {
        try {
          const storedFavorites = localStorage.getItem('favorites');
          if (storedFavorites) {
            const parsed = JSON.parse(storedFavorites);
            setFavorites(Array.isArray(parsed) ? parsed : []);
          }
        } catch (err) {
          console.error('Failed to load favorites:', err);
          setFavorites([]);
        }
      }
      setLoading(false);
    };

    loadFavorites();
  }, [authState.isAuthenticated]);

  const handleRemoveFavorite = (id: string) => {
    const updatedFavorites = favorites.filter(item => item.id !== id);
    setFavorites(updatedFavorites);

    // Save to localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
      } catch (err) {
        console.error('Failed to save favorites:', err);
      }
    }
  };

  const handleGoBack = () => {
    router.back();
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
          <title>我的收藏 - DoggyNav</title>
          <meta name="description" content="我收藏的网站" />
        </Head>

        {/* Custom header with iPad-style design */}
        <header className="sticky top-0 z-30 bg-white/40 backdrop-blur-2xl border-b border-white/30 shadow-md">
          <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                type="text"
                icon={<IconLeft />}
                onClick={handleGoBack}
                className="text-gray-700 hover:text-blue-600 transition-all duration-300 hover:scale-110 rounded-full bg-white/50 backdrop-blur-sm border border-white/30 shadow-sm"
              />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                我的收藏
              </h1>
            </div>

            <div className="flex items-center space-x-3">
              <div className="px-4 py-2 bg-white/50 backdrop-blur-sm rounded-full border border-white/30 shadow-sm">
                <span className="text-sm font-medium text-gray-700">
                  共 {favorites.length} 个收藏
                </span>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-10">
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
                    <span className="text-gray-600 font-medium">暂无收藏的网站</span>
                  }
                  className="relative"
                />
              </div>
              <p className="text-gray-700 mb-8 text-center max-w-md text-lg">
                您还没有收藏任何网站。浏览网站时点击 ❤️ 按钮可以添加到收藏夹。
              </p>
              <Link href="/navcontents">
                <Button
                  type="primary"
                  size="large"
                  className="px-8 py-5 text-lg rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  去浏览网站
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {favorites.map((item, index) => (
                <div
                  key={item.id}
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <FavoriteItem
                    item={item}
                    onRemove={handleRemoveFavorite}
                  />
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </AuthGuard>
  );
}

FavoritesPage.getLayout = (page) => {
  return page;
}