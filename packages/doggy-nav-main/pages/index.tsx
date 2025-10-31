import { useState, useEffect } from 'react';
import { Spin } from '@arco-design/web-react';
import Affiche from '@/components/Affiche';
import NavRankingList from '@/components/NavRankingList';
import StatsChart from '@/components/StatsChart';
import VerticalTimelineContainer from '@/components/Timelines/VerticalTimelineContainer';
import api from '@/utils/api';
import { createTimelineData } from '@/utils/timelineData';
import { chromeMicroToISO } from '@/utils/time';
import { useAtom, useAtomValue } from 'jotai';
import { categoriesAtom, navRankingAtom, isAuthenticatedAtom } from '@/store/store';
import Link from 'next/link';
import { TimelineItem as TimelineItemType } from '@/types/timeline';
import { useTranslation } from 'react-i18next';

export default function HomePage() {
  const [navRanking, setNavRanking] = useAtom(navRankingAtom);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation('translation');
  const [currentYearData, setCurrentYearData] = useState<any>(null);
  const currentYear = new Date().getFullYear();
  const categories = useAtomValue(categoriesAtom);
  const isAuthenticated = useAtomValue(isAuthenticatedAtom);
  const handleTryGotoDesktop = () => {
    // Trigger driver hint on LightbulbRope
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('lightbulbrope:hint'));
    }
  };
  const [selectedItem, setSelectedItem] = useState<TimelineItemType | undefined>();
  const [totalNavCount, setTotalNavCount] = useState(0);
  const [totalViews, setTotalViews] = useState(0);

  // Initial data fetch - nav ranking and timeline data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const navRankingData = await api.getNavRanking();
        setNavRanking(navRankingData);

        // Fetch nav list and build timeline data TODO: add more action
        const list = await api.getNavAll({ pageSize: 100, pageNumber: 1 });
        const normalized = (list?.data || []).map((n) => ({
          ...n,
          createTime: chromeMicroToISO(n.createTime) || n.createTime,
        }));
        const timelineData = createTimelineData(normalized, true);
        const currentYear = new Date().getFullYear();
        const cy = timelineData.find((y) => y.year === currentYear);
        setCurrentYearData(
          cy || {
            year: currentYear,
            items: [],
            totalWebsites: 0,
            color: '',
            position: { x: 0, y: 0, z: 0, rotation: 0 },
            featuredWebsites: [],
          }
        );

        // Fetch statistics for cards
        setTotalNavCount(list?.total || 0);
        const totalViewsSum = normalized.reduce(
          (sum: number, nav: any) => sum + (nav.view || 0),
          0
        );
        setTotalViews(totalViewsSum);
      } catch (error) {
        console.error('Failed to fetch data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onKeyDown = (e: React.KeyboardEvent) => {
    // Navigation keys
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'f':
          e.preventDefault();
          const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
          if (searchInput) {
            searchInput.focus();
            searchInput.select();
          }
          break;
        case 'j':
          e.preventDefault();
          // Navigate to next item (implementation would depend on app structure)
          break;
        case 'k':
          e.preventDefault();
          // Navigate to previous item (implementation would depend on app structure)
          break;
      }
    }

    // Escape key to close expanded sections
    if (e.key === 'Escape') {
      setSelectedItem(undefined);
    }
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800"
      onKeyDown={onKeyDown}
      tabIndex={-1}
      role="application"
      aria-label="Website Navigation Dashboard"
    >
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Hero Section */}
        <div className="mb-8">
          <div className="bg-theme-background rounded-3xl shadow-xl overflow-hidden border border-theme-border">
            <div className="hero-gradient p-8 text-white relative">
              <div className="max-w-3xl mx-auto text-center relative z-10">
                <h1 className="text-4xl md:text-5xl font-bold mb-4">
                  {t('curated_website_navigation')}
                </h1>
                <p className="text-xl opacity-90 mb-8">{t('discover_quality_websites')}</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  {isAuthenticated ? (
                    <button
                      type="button"
                      onClick={handleTryGotoDesktop}
                      className="cursor-pointer bg-theme-background text-theme-primary hover:bg-theme-muted font-semibold py-3 px-6 rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105"
                    >
                      {t('try_goto_desktop')}
                    </button>
                  ) : (
                    <Link
                      href="/login"
                      className="bg-theme-background text-theme-primary hover:bg-theme-muted font-semibold py-3 px-6 rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105"
                    >
                      {t('login_explore')}
                    </Link>
                  )}
                  <Link
                    href="/search"
                    className="bg-transparent border-2 border-theme-primary hover:bg-theme-background hover:text-theme-primary font-semibold py-3 px-6 rounded-lg transition-all duration-300"
                  >
                    {t('search_websites')}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Announcement Banner */}
        <div className="mb-8">
          <Affiche />
        </div>

        {/* Top Rankings Section */}
        {!loading && (
          <div className="bg-theme-background rounded-2xl shadow-lg p-8 border border-theme-border">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-theme-foreground mb-2">
                {t('popular_recommendations')}
              </h2>
              <p className="text-theme-muted-foreground">
                {t('based_on_views_likes_new_additions')}
              </p>
            </div>
            <NavRankingList data={navRanking} />
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <Spin size={40} />
              <p className="mt-4 text-theme-muted-foreground">{t('loading_content')}</p>
            </div>
          </div>
        )}

        {/* Timeline Section */}
        {!loading && (
          <div className="bg-theme-background rounded-2xl shadow-lg p-8 my-8 border border-theme-border">
            {currentYearData && currentYearData.items && currentYearData.items.length > 0 ? (
              <VerticalTimelineContainer
                year={currentYear}
                items={currentYearData.items}
                onItemSelect={setSelectedItem}
                selectedItem={selectedItem}
              />
            ) : (
              <div className="text-center">
                <h2 className="text-2xl font-bold text-theme-foreground mb-2">
                  {t('no_websites_collected_this_year')}
                </h2>
                <p className="text-theme-muted-foreground mb-6">{t('submit_worthwhile_sites')}</p>
                <Link
                  href="/recommend"
                  className="inline-block bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-2 px-4 rounded-lg shadow-lg transition-all duration-300"
                >
                  {t('submit_website')}
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Statistics Chart Section */}
        {!loading && navRanking && <StatsChart data={navRanking} />}

        {/* Stats Section */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-2xl shadow-lg">
              <div className="text-3xl font-bold">{totalNavCount.toLocaleString()}</div>
              <div className="text-blue-100">{t('total_nav_count')}</div>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-2xl shadow-lg">
              <div className="text-3xl font-bold">{Math.max(categories.length - 1, 0)}</div>
              <div className="text-purple-100">{t('total_category_count')}</div>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-2xl shadow-lg">
              <div className="text-3xl font-bold">{totalViews.toLocaleString()}</div>
              <div className="text-green-100">{t('total_views')}</div>
            </div>
          </div>
        )}

        {/* Footer CTA */}
        {!loading && (
          <div className="mt-12 text-center">
            <div className="bg-theme-background rounded-2xl shadow-lg p-8 border border-theme-border">
              <h3 className="text-2xl font-bold text-theme-foreground mb-4">
                {t('cant_find_website')}
              </h3>
              <p className="text-theme-muted-foreground mb-6 max-w-2xl mx-auto">
                {t('best_navigation_service')}
              </p>
              <Link
                href="/recommend"
                className="inline-block bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-8 rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105"
              >
                {t('submit_website')}
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
