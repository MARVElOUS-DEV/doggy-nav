import { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Spin, Empty, Button } from '@arco-design/web-react';
import AuthGuard from '@/components/AuthGuard';
import { NavItem } from '@/types';
import { useAtomValue } from 'jotai';
import { authStateAtom } from '@/store/store';
import DoggyImage from '@/components/DoggyImage';
import { useTranslation } from 'react-i18next';

// Mac-style app icon
const FavoriteItem = ({ item, onRemove }: { item: NavItem; onRemove: (id: string) => void }) => {
  const { t } = useTranslation('translation');
  return (
    <div
      className="flex flex-col items-center group cursor-pointer transform transition-all duration-200 hover:scale-110"
      onClick={() => {
        window.open(item.href, '_blank', 'noopener,noreferrer');
      }}
    >
      <div className="w-16 h-16 bg-white rounded-xl shadow-lg p-2 mb-2 flex items-center justify-center group-hover:shadow-xl transition-shadow duration-200">
        {item.logo ? (
          <DoggyImage
            logo={item.logo}
            name={item.name}
            className="rounded-full flex-shrink-0 w-[48px] h-[48px] object-contain"
          />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
            {item.name?.charAt(0) || 'W'}
          </div>
        )}
      </div>
      <span className="text-sm text-center text-gray-700 font-medium max-w-full truncate">
        {item.name}
      </span>
      <span className="text-xs text-center text-gray-500 mt-1 max-w-full truncate">
        {item.category || t('uncategorized')}
      </span>
    </div>
  );
};

export default function FavoritesPage() {
  const router = useRouter();
  const authState = useAtomValue(authStateAtom);
  const [favorites, setFavorites] = useState<NavItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation('translation');

  const mockFavorites = useMemo(() => [
    {
      id: '1',
      name: 'GitHub',
      href: 'https://github.com',
      logo: 'https://github.githubassets.com/favicons/favicon.svg',
      desc: 'Code repository platform',
      category: 'Development',
      isFavorite: true,
      view: 1250,
      star: 420,
      tags: ['Development', 'Code'],
    },
    {
      id: '2',
      name: 'YouTube',
      href: 'https://youtube.com',
      logo: 'https://www.youtube.com/favicon.ico',
      desc: 'Video sharing platform',
      category: 'Media',
      isFavorite: true,
      view: 3200,
      star: 890,
      tags: ['Video', 'Entertainment'],
    },
    {
      id: '3',
      name: 'Twitter',
      href: 'https://twitter.com',
      logo: 'https://abs.twimg.com/responsive-web/client-web/icon-ios.b1fc7275.png',
      desc: 'Social media platform',
      category: 'Social',
      isFavorite: true,
      view: 2100,
      star: 560,
      tags: ['Social', 'News'],
    },
    {
      id: '4',
      name: 'Figma',
      href: 'https://figma.com',
      logo: 'https://static.figma.com/app/icon/1/favicon.ico',
      desc: 'Design and prototyping tool',
      category: 'Design',
      isFavorite: true,
      view: 980,
      star: 320,
      tags: ['Design', 'UI/UX'],
    },
    {
      id: '5',
      name: 'Google Drive',
      href: 'https://drive.google.com',
      logo: 'https://ssl.gstatic.com/images/branding/product/1x/drive_2020q4_32dp.png',
      desc: 'Cloud storage service',
      category: 'Productivity',
      isFavorite: true,
      view: 1800,
      star: 450,
      tags: ['Productivity', 'Storage'],
    },
    {
      id: '6',
      name: 'Netflix',
      href: 'https://netflix.com',
      logo: 'https://www.netflix.com/favicon.ico',
      desc: 'Streaming service',
      category: 'Entertainment',
      isFavorite: true,
      view: 2700,
      star: 780,
      tags: ['Video', 'Entertainment'],
    },
    {
      id: '7',
      name: 'Slack',
      href: 'https://slack.com',
      logo: 'https://a.slack-edge.com/80588/img/icons/icon_128.png',
      desc: 'Team communication platform',
      category: 'Productivity',
      isFavorite: true,
      view: 1100,
      star: 290,
      tags: ['Communication', 'Team'],
    },
    {
      id: '8',
      name: 'LinkedIn',
      href: 'https://linkedin.com',
      logo: 'https://static.licdn.com/aero-v1/sc/h/al2o9zrvru7aqj8e1x2rzsrca',
      desc: 'Professional networking',
      category: 'Business',
      isFavorite: true,
      view: 1500,
      star: 380,
      tags: ['Networking', 'Business'],
    },
  ], []);

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
          } else {
            // Use mock data when no favorites exist in localStorage
            setFavorites(mockFavorites);
          }
        } catch (err) {
          console.error('Failed to load favorites:', err);
          setFavorites(mockFavorites); // Fallback to mock data
        }
      } else {
        // When not authenticated, use mock data
        setFavorites(mockFavorites);
      }
      setLoading(false);
    };

    loadFavorites();
  }, [authState.isAuthenticated, mockFavorites]);

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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-8">
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