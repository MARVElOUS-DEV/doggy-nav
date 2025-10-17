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
  ResponsiveContainer
} from 'recharts';
import { NavItem } from '@/types';
import { useTranslation } from 'react-i18next';

interface StatsChartProps {
  data: {
    view: NavItem[];
    star: NavItem[];
    news: NavItem[];
  };
}

function StatsChart({ data }: StatsChartProps): JSX.Element {
  const { t } = useTranslation();
  // Recharts Legend sometimes has mismatched TS types in certain versions; cast to relax
  const LegendComp = Legend as unknown as React.ComponentType<any>;
  // Prepare data for top viewed sites
  const topViewedData = useMemo(() => {
    return (data?.view || [])
      .slice(0, 10) // Take top 10
      .map(item => ({
        name: item.name.length > 15 ? `${item.name.substring(0, 12)}...` : item.name,
        view: item.view,
        author: item.authorName || 'Anonymous'
      }));
  }, [data]);

  // Prepare data for top starred sites
  const topStarredData = useMemo(() => {
    return (data?.star || [])
      .slice(0, 10) // Take top 10
      .map(item => ({
        name: item.name.length > 15 ? `${item.name.substring(0, 12)}...` : item.name,
        star: item.star,
        author: item.authorName || 'Anonymous'
      }));
  }, [data]);

  // Prepare author statistics
  const authorStats = useMemo(() => {
    const authorMap: Record<string, { view: number; star: number; count: number }> = {};

    // Combine view and star data to get author statistics
    [...(data?.view || []), ...(data?.star || [])].forEach(item => {
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
        total: stats.view + stats.star
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8); // Top 8 authors
  }, [data]);

  return (
    <div className="bg-theme-background text-theme-foreground border border-theme-border rounded-2xl shadow-lg p-6 mb-8 transition-colors">
      <h2 className="text-2xl font-bold mb-6">{t('data_statistics')}</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Viewed Sites Chart */}
        <div className="p-4 bg-theme-muted border border-theme-border rounded-xl transition-colors">
          <h3 className="text-lg font-semibold text-theme-muted-foreground mb-4 text-center">{t('most_popular_websites_views')}</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topViewedData}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
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
                    color: 'var(--color-foreground)'
                  }}
                  labelStyle={{ color: 'var(--color-muted-foreground)' }}
                />
                <LegendComp wrapperStyle={{ color: 'var(--color-muted-foreground)' }} />
                <Bar dataKey="view" name={t('views')} fill="var(--color-primary)" fillOpacity={0.9} stroke="var(--color-border)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Starred Sites Chart */}
        <div className="p-4 bg-theme-muted border border-theme-border rounded-xl transition-colors">
          <h3 className="text-lg font-semibold text-theme-muted-foreground mb-4 text-center">{t('highest_rated_websites_stars')}</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topStarredData}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
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
                    color: 'var(--color-foreground)'
                  }}
                  labelStyle={{ color: 'var(--color-muted-foreground)' }}
                />
                <LegendComp wrapperStyle={{ color: 'var(--color-muted-foreground)' }} />
                <Bar dataKey="star" name={t('stars')} fill="#06B6D4" fillOpacity={0.9} stroke="var(--color-border)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Author Contribution Chart */}
        <div className="lg:col-span-2 p-4 bg-theme-muted border border-theme-border rounded-xl transition-colors">
          <h3 className="text-lg font-semibold text-theme-muted-foreground mb-4 text-center">{t('contributor_ranking')}</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={authorStats}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
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
                    color: 'var(--color-foreground)'
                  }}
                  labelStyle={{ color: 'var(--color-muted-foreground)' }}
                />
                <LegendComp wrapperStyle={{ color: 'var(--color-muted-foreground)' }} />
                <Bar dataKey="total" name={t('total_contribution')} fill="var(--color-primary)" fillOpacity={0.9} stroke="var(--color-border)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="count" name={t('website_count')} fill="#F59E0B" fillOpacity={0.9} stroke="var(--color-border)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StatsChart;