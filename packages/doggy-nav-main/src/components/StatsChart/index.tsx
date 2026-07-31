'use client';

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { NavItem } from '@/types';
import { useTranslation } from 'react-i18next';
import { useAtomValue } from 'jotai';
import { mobileAtom } from '@/store/store';

interface StatsChartProps {
  data: {
    view: NavItem[];
    star: NavItem[];
    news: NavItem[];
  };
}

const mobileChartMargin = { top: 8, right: 8, left: 0, bottom: 56 };
const desktopChartMargin = { top: 20, right: 30, left: 20, bottom: 60 };

function StatsChart({ data }: StatsChartProps): JSX.Element {
  const { t } = useTranslation();
  const isMobile = useAtomValue(mobileAtom);
  const chartMargin = isMobile ? mobileChartMargin : desktopChartMargin;
  // Recharts Legend sometimes has mismatched TS types in certain versions; cast to relax
  const LegendComp = Legend as unknown as React.ComponentType<any>;
  // Prepare data for top viewed sites
  const topViewedData = useMemo(() => {
    return (data?.view || [])
      .slice(0, 10) // Take top 10
      .map((item) => ({
        name: item.name.length > 15 ? `${item.name.substring(0, 12)}...` : item.name,
        view: item.view,
        author: item.authorName || 'Anonymous',
      }));
  }, [data]);

  // Prepare data for top starred sites
  const topStarredData = useMemo(() => {
    return (data?.star || [])
      .slice(0, 10) // Take top 10
      .map((item) => ({
        name: item.name.length > 15 ? `${item.name.substring(0, 12)}...` : item.name,
        star: item.star,
        author: item.authorName || 'Anonymous',
      }));
  }, [data]);

  // Prepare author statistics
  const authorStats = useMemo(() => {
    const authorMap: Record<string, { view: number; star: number; count: number }> = {};

    // Combine view and star data to get author statistics
    [...(data?.view || []), ...(data?.star || [])].forEach((item) => {
      const author = item.authorName || 'Anonymous';
      if (!authorMap[author]) {
        authorMap[author] = { view: 0, star: 0, count: 0 };
      }
      authorMap[author].view += item.view || 0;
      authorMap[author].star += item.star || 0;
      authorMap[author].count += 1;
    });

    // Convert to array and sort by total contributions
    return Object.entries(authorMap)
      .map(([name, stats]) => ({
        name,
        view: stats.view,
        star: stats.star,
        count: stats.count,
        total: stats.view + stats.star,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8); // Top 8 authors
  }, [data]);

  return (
    <div className="rounded-2xl border border-theme-border bg-theme-background p-3 text-theme-foreground shadow-lg transition-colors lg:p-6">
      <h2 className="mb-4 text-xl font-bold lg:mb-6 lg:text-2xl">{t('data_statistics')}</h2>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-8">
        {/* Top Viewed Sites Chart */}
        <div className="rounded-xl border border-theme-border bg-theme-card p-2 transition-colors lg:p-4">
          <h3 className="mb-2 text-center text-base font-semibold leading-tight text-theme-foreground lg:mb-4 lg:text-lg">
            {t('most_popular_websites_views')}
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topViewedData} margin={chartMargin}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }}
                  axisLine={{ stroke: 'var(--color-border)' }}
                  tickLine={{ stroke: 'var(--color-border)' }}
                />
                <YAxis
                  width={isMobile ? 36 : 60}
                  tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }}
                  axisLine={{ stroke: 'var(--color-border)' }}
                  tickLine={{ stroke: 'var(--color-border)' }}
                />
                <Tooltip
                  formatter={(value) => [value, t('views')]}
                  labelFormatter={(name) => `${t('website_label')}${name}`}
                  contentStyle={{
                    backgroundColor: 'var(--color-card)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-foreground)',
                  }}
                  labelStyle={{ color: 'var(--color-muted-foreground)' }}
                />
                <LegendComp wrapperStyle={{ color: 'var(--color-muted-foreground)' }} />
                <Bar
                  dataKey="view"
                  name={t('views')}
                  fill="var(--color-primary)"
                  fillOpacity={0.9}
                  stroke="var(--color-border)"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Starred Sites Chart */}
        <div className="rounded-xl border border-theme-border bg-theme-card p-2 transition-colors lg:p-4">
          <h3 className="mb-2 text-center text-base font-semibold leading-tight text-theme-foreground lg:mb-4 lg:text-lg">
            {t('highest_rated_websites_stars')}
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topStarredData} margin={chartMargin}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }}
                  axisLine={{ stroke: 'var(--color-border)' }}
                  tickLine={{ stroke: 'var(--color-border)' }}
                />
                <YAxis
                  width={isMobile ? 36 : 60}
                  tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }}
                  axisLine={{ stroke: 'var(--color-border)' }}
                  tickLine={{ stroke: 'var(--color-border)' }}
                />
                <Tooltip
                  formatter={(value) => [value, t('stars')]}
                  labelFormatter={(name) => `${t('website_label')}${name}`}
                  contentStyle={{
                    backgroundColor: 'var(--color-card)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-foreground)',
                  }}
                  labelStyle={{ color: 'var(--color-muted-foreground)' }}
                />
                <LegendComp wrapperStyle={{ color: 'var(--color-muted-foreground)' }} />
                <Bar
                  dataKey="star"
                  name={t('stars')}
                  fill="var(--color-secondary-foreground)"
                  fillOpacity={0.9}
                  stroke="var(--color-border)"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Author Contribution Chart */}
        <div className="rounded-xl border border-theme-border bg-theme-card p-2 transition-colors lg:col-span-2 lg:p-4">
          <h3 className="mb-2 text-center text-base font-semibold leading-tight text-theme-foreground lg:mb-4 lg:text-lg">
            {t('contributor_ranking')}
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={authorStats} margin={chartMargin}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }}
                  axisLine={{ stroke: 'var(--color-border)' }}
                  tickLine={{ stroke: 'var(--color-border)' }}
                />
                <YAxis
                  width={isMobile ? 36 : 60}
                  tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }}
                  axisLine={{ stroke: 'var(--color-border)' }}
                  tickLine={{ stroke: 'var(--color-border)' }}
                />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === 'total') return [value, t('total_contribution')];
                    if (name === 'count') return [value, t('website_count')];
                    return [value, name === 'view' ? t('view_count') : t('star_count')];
                  }}
                  contentStyle={{
                    backgroundColor: 'var(--color-card)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-foreground)',
                  }}
                  labelStyle={{ color: 'var(--color-muted-foreground)' }}
                />
                <LegendComp wrapperStyle={{ color: 'var(--color-muted-foreground)' }} />
                <Bar
                  dataKey="total"
                  name={t('total_contribution')}
                  fill="var(--color-primary)"
                  fillOpacity={0.9}
                  stroke="var(--color-border)"
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  dataKey="count"
                  name={t('website_count')}
                  fill="var(--color-ring)"
                  fillOpacity={0.9}
                  stroke="var(--color-border)"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StatsChart;
