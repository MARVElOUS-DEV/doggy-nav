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

interface StatsChartProps {
  data: {
    view: NavItem[];
    star: NavItem[];
    news: NavItem[];
  };
}

function StatsChart({ data }: StatsChartProps): JSX.Element {
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
    <div className="bg-theme-card text-theme-foreground border border-theme-border rounded-2xl shadow-lg p-6 mb-8 transition-colors">
      <h2 className="text-2xl font-bold mb-6">数据统计</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Viewed Sites Chart */}
        <div className="p-4 bg-theme-muted border border-theme-border rounded-xl transition-colors">
          <h3 className="text-lg font-semibold text-theme-muted-foreground mb-4 text-center">最受欢迎网站 (访问量)</h3>
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
                  formatter={(value) => [value, '访问量']}
                  labelFormatter={(name) => `网站: ${name}`}
                  contentStyle={{
                    backgroundColor: 'var(--color-card)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-foreground)'
                  }}
                  labelStyle={{ color: 'var(--color-muted-foreground)' }}
                />
                <Legend wrapperStyle={{ color: 'var(--color-muted-foreground)' }} />
                <Bar dataKey="view" name="访问量" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Starred Sites Chart */}
        <div className="p-4 bg-theme-muted border border-theme-border rounded-xl transition-colors">
          <h3 className="text-lg font-semibold text-theme-muted-foreground mb-4 text-center">最高赞网站 (点赞数)</h3>
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
                  formatter={(value) => [value, '点赞数']}
                  labelFormatter={(name) => `网站: ${name}`}
                  contentStyle={{
                    backgroundColor: 'var(--color-card)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-foreground)'
                  }}
                  labelStyle={{ color: 'var(--color-muted-foreground)' }}
                />
                <Legend wrapperStyle={{ color: 'var(--color-muted-foreground)' }} />
                <Bar dataKey="star" name="点赞数" fill="var(--color-secondary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Author Contribution Chart */}
        <div className="lg:col-span-2 p-4 bg-theme-muted border border-theme-border rounded-xl transition-colors">
          <h3 className="text-lg font-semibold text-theme-muted-foreground mb-4 text-center">贡献者排名</h3>
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
                    if (name === 'total') return [value, '总贡献'];
                    if (name === 'count') return [value, '网站数量'];
                    return [value, name === 'view' ? '访问量' : '点赞数'];
                  }}
                  contentStyle={{
                    backgroundColor: 'var(--color-card)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-foreground)'
                  }}
                  labelStyle={{ color: 'var(--color-muted-foreground)' }}
                />
                <Legend wrapperStyle={{ color: 'var(--color-muted-foreground)' }} />
                <Bar dataKey="total" name="总贡献" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="count" name="网站数量" fill="var(--color-accent)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StatsChart;