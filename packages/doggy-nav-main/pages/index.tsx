import { useState, useEffect } from 'react';
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
  creativeTriggerHintAtom,
} from '@/store/store';
import Link from 'next/link';
import { TimelineItem as TimelineItemType, TimelineYear } from '@/types/timeline';
import { useTranslation } from 'react-i18next';
import useIntersectionObserver from '@/hooks/useIntersectionObserver';
import HomeHero from '@/components/HomeHero';
import { LoadingIndicator } from '@/components/PageLoading';

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
    <LoadingIndicator
      className={`rounded-2xl border border-theme-border bg-theme-background p-8 shadow-lg ${minHeight}`}
      label={<span className="text-lg font-semibold text-theme-foreground">{title}</span>}
      description={description}
    />
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
  const requestCreativeTriggerHint = useSetAtom(creativeTriggerHintAtom);
  const handleTryGotoDesktop = () => {
    requestCreativeTriggerHint((request) => request + 1);
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
      className="min-h-screen overflow-hidden rounded-t-[1rem] bg-theme-background"
      onKeyDown={onKeyDown}
      tabIndex={-1}
      role="application"
      aria-label="Website Navigation Dashboard"
    >
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Hero Section */}
        <div className="mb-8">
          <div className="bg-theme-card rounded-3xl shadow-xl overflow-hidden border border-theme-border">
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
          <div className="rounded-2xl border border-theme-border bg-theme-background p-8 shadow-lg">
            <LoadingIndicator className="py-16" label={t('loading_content')} />
          </div>
        ) : (
          <div className="rounded-2xl border border-theme-border bg-theme-background p-8 shadow-lg">
            <div className="mb-8">
              <h2 className="mb-2 text-2xl font-bold text-theme-foreground">
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
            <div className="rounded-2xl border border-theme-border bg-theme-background p-8 shadow-lg">
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
                    className="inline-block rounded-xl bg-theme-primary px-5 py-2.5 font-semibold text-theme-primary-foreground shadow-sm transition-opacity hover:opacity-90"
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
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-theme-border bg-theme-card p-6 shadow-sm">
              <div className="text-3xl font-bold text-theme-primary">
                {totalNavCount.toLocaleString()}
              </div>
              <div className="mt-1 text-theme-muted-foreground">{t('total_nav_count')}</div>
            </div>
            <div className="rounded-2xl border border-theme-border bg-theme-card p-6 shadow-sm">
              <div className="text-3xl font-bold text-theme-primary">
                {Math.max(categories.length - 1, 0)}
              </div>
              <div className="mt-1 text-theme-muted-foreground">{t('total_category_count')}</div>
            </div>
            <div className="rounded-2xl border border-theme-border bg-theme-card p-6 shadow-sm">
              <div className="text-3xl font-bold text-theme-primary">
                {totalViews.toLocaleString()}
              </div>
              <div className="mt-1 text-theme-muted-foreground">{t('total_views')}</div>
            </div>
          </div>
        )}

        {/* Footer CTA */}
        {!rankingLoading && (
          <div className="mt-12 text-center">
            <div className="rounded-2xl border border-theme-border bg-theme-background p-8 shadow-sm">
              <h3 className="mb-4 text-2xl font-bold text-theme-foreground">
                {t('cant_find_website')}
              </h3>
              <p className="mx-auto mb-6 max-w-2xl text-theme-muted-foreground">
                {t('best_navigation_service')}
              </p>
              <Link
                href="/recommend"
                className="inline-block rounded-xl bg-theme-primary px-8 py-3 font-semibold text-theme-primary-foreground shadow-sm transition-opacity hover:opacity-90"
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
