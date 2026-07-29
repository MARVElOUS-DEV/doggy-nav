import { useState, useEffect } from 'react';
import { Spin } from '@arco-design/web-react';
import dynamic from 'next/dynamic';
import Affiche from '@/components/Affiche';
import NavRankingList from '@/components/NavRankingList';
import VerticalTimelineContainer from '@/components/Timelines/VerticalTimelineContainer';
import api from '@/utils/api';
import { createTimelineData } from '@/utils/timelineData';
import { chromeMicroToISO } from '@/utils/time';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import {
  categoriesAtom,
  navRankingAtom,
  isAuthenticatedAtom,
  searchModalOpenAtom,
} from '@/store/store';
import Link from 'next/link';
import { TimelineItem as TimelineItemType, TimelineYear } from '@/types/timeline';
import { useTranslation } from 'react-i18next';
import useIntersectionObserver from '@/hooks/useIntersectionObserver';
import HomeHero from '@/components/HomeHero';

function DeferredSectionPlaceholder({
  title,
  description,
  minHeight = 'min-h-[320px]',
}: {
  title: string;
  description: string;
  minHeight?: string;
}) {
  return (
    <div
      className={`bg-theme-background rounded-2xl shadow-lg p-8 border border-theme-border flex items-center justify-center ${minHeight}`}
    >
      <div className="text-center">
        <Spin size={32} />
        <p className="mt-4 text-lg font-semibold text-theme-foreground">{title}</p>
        <p className="mt-2 text-theme-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

const LazyStatsChart = dynamic(() => import('@/components/StatsChart'), {
  ssr: false,
  loading: () => (
    <DeferredSectionPlaceholder
      title="Loading statistics"
      description="Preparing charts for this page."
    />
  ),
});

function createEmptyCurrentYearData(year: number): TimelineYear {
  return {
    year,
    items: [],
    totalWebsites: 0,
    color: '',
    position: { x: 0, y: 0, z: 0, rotation: 0 },
    featuredWebsites: [],
  };
}

export default function HomePage() {
  const [navRanking, setNavRanking] = useAtom(navRankingAtom);
  const [rankingLoading, setRankingLoading] = useState(true);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [timelineLoaded, setTimelineLoaded] = useState(false);
  const { t } = useTranslation('translation');
  const [currentYearData, setCurrentYearData] = useState<TimelineYear | null>(null);
  const currentYear = new Date().getFullYear();
  const categories = useAtomValue(categoriesAtom);
  const isAuthenticated = useAtomValue(isAuthenticatedAtom);
  const setSearchModalOpen = useSetAtom(searchModalOpenAtom);
  const handleTryGotoDesktop = () => {
    // Trigger driver hint on LightbulbRope
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('lightbulbrope:hint'));
    }
  };
  const [selectedItem, setSelectedItem] = useState<TimelineItemType | undefined>();
  const [totalNavCount, setTotalNavCount] = useState(0);
  const [totalViews, setTotalViews] = useState(0);
  const [shouldLoadTimeline, setShouldLoadTimeline] = useState(false);
  const [shouldLoadChart, setShouldLoadChart] = useState(false);
  const [timelineRef, isTimelineVisible] = useIntersectionObserver({
    rootMargin: '320px 0px',
    threshold: 0,
  });
  const [chartRef, isChartVisible] = useIntersectionObserver({
    rootMargin: '320px 0px',
    threshold: 0,
  });

  useEffect(() => {
    let cancelled = false;

    const fetchRanking = async () => {
      try {
        const navRankingData = await api.getNavRanking();
        if (!cancelled) {
          setNavRanking(navRankingData);
        }
      } catch (error) {
        console.error('Failed to fetch data', error);
      } finally {
        if (!cancelled) {
          setRankingLoading(false);
        }
      }
    };

    fetchRanking();

    return () => {
      cancelled = true;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isTimelineVisible) {
      setShouldLoadTimeline(true);
    }
  }, [isTimelineVisible]);

  useEffect(() => {
    if (isChartVisible) {
      setShouldLoadChart(true);
    }
  }, [isChartVisible]);

  useEffect(() => {
    if (rankingLoading || shouldLoadTimeline) {
      return;
    }

    const fallbackTimer = window.setTimeout(() => {
      setShouldLoadTimeline(true);
    }, 400);

    return () => {
      window.clearTimeout(fallbackTimer);
    };
  }, [rankingLoading, shouldLoadTimeline]);

  useEffect(() => {
    if (rankingLoading || shouldLoadChart) {
      return;
    }

    const fallbackTimer = window.setTimeout(() => {
      setShouldLoadChart(true);
    }, 1200);

    return () => {
      window.clearTimeout(fallbackTimer);
    };
  }, [rankingLoading, shouldLoadChart]);

  useEffect(() => {
    if (!shouldLoadTimeline || timelineLoaded) {
      return;
    }

    let cancelled = false;

    const fetchTimer = window.setTimeout(async () => {
      if (cancelled) {
        return;
      }

      setTimelineLoading(true);

      try {
        const list = await api.getNavAll({ pageSize: 100, pageNumber: 1 });
        const normalized = (list?.data || []).map((nav) => ({
          ...nav,
          createTime: chromeMicroToISO(nav.createTime) || nav.createTime,
        }));
        const timelineData = createTimelineData(normalized, true);
        const currentYearTimeline =
          timelineData.find((yearData) => yearData.year === currentYear) ||
          createEmptyCurrentYearData(currentYear);
        const totalViewsSum = normalized.reduce((sum, nav) => sum + (nav.view || 0), 0);

        if (!cancelled) {
          setCurrentYearData(currentYearTimeline);
          setTotalNavCount(list?.total || 0);
          setTotalViews(totalViewsSum);
        }
      } catch (error) {
        console.error('Failed to fetch deferred home page data', error);

        if (!cancelled) {
          setCurrentYearData(createEmptyCurrentYearData(currentYear));
        }
      } finally {
        if (!cancelled) {
          setTimelineLoading(false);
          setTimelineLoaded(true);
        }
      }
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(fetchTimer);
    };
  }, [currentYear, shouldLoadTimeline, timelineLoaded]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    // Navigation keys
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'f':
          e.preventDefault();
          setSearchModalOpen(true);
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
      className="min-h-screen overflow-hidden rounded-t-[1rem] bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800"
      onKeyDown={onKeyDown}
      tabIndex={-1}
      role="application"
      aria-label="Website Navigation Dashboard"
    >
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Hero Section */}
        <div className="mb-8">
          <div className="bg-theme-background rounded-3xl shadow-xl overflow-hidden border border-theme-border">
            <HomeHero
              isAuthenticated={isAuthenticated}
              onTryDesktop={handleTryGotoDesktop}
              onSearch={() => setSearchModalOpen(true)}
            />
          </div>
        </div>

        {/* Announcement Banner */}
        <div className="mb-8">
          <Affiche />
        </div>

        {/* Top Rankings Section */}
        {rankingLoading ? (
          <div className="bg-theme-background rounded-2xl shadow-lg p-8 border border-theme-border">
            <div className="flex justify-center items-center py-16">
              <div className="text-center">
                <Spin size={32} />
                <p className="mt-4 text-theme-muted-foreground">{t('loading_content')}</p>
              </div>
            </div>
          </div>
        ) : (
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

        {/* Timeline Section */}
        <div ref={timelineRef} className="my-8">
          {!shouldLoadTimeline || timelineLoading || !timelineLoaded ? (
            <DeferredSectionPlaceholder title={t('timeline')} description={t('loading_timeline')} />
          ) : (
            <div className="bg-theme-background rounded-2xl shadow-lg p-8 border border-theme-border">
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
        </div>

        {/* Statistics Chart Section */}
        <div ref={chartRef} className="mb-8">
          {!shouldLoadChart || rankingLoading ? (
            <DeferredSectionPlaceholder
              title={t('data_statistics')}
              description={t('loading_content')}
            />
          ) : navRanking ? (
            <LazyStatsChart data={navRanking} />
          ) : null}
        </div>

        {/* Stats Section */}
        {timelineLoaded && (
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
        {!rankingLoading && (
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
