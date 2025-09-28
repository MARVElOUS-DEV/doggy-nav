'use client';

import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { NavItem } from '@/types';

interface NavStatsChartProps {
  data: {
    view: NavItem[];
    star: NavItem[];
    news: NavItem[];
  };
}

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316'];

const NavStatsChart: React.FC<NavStatsChartProps> = ({ data }) => {
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
    <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">数据统计</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Viewed Sites Chart */}
        <div className="p-4 bg-gray-50 rounded-xl">
          <h3 className="text-lg font-semibold text-gray-700 mb-4 text-center">最受欢迎网站 (访问量)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topViewedData}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  tick={{ fontSize: 12 }}
                />
                <YAxis />
                <Tooltip
                  formatter={(value) => [value, '访问量']}
                  labelFormatter={(name) => `网站: ${name}`}
                />
                <Legend />
                <Bar dataKey="view" name="访问量" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Starred Sites Chart */}
        <div className="p-4 bg-gray-50 rounded-xl">
          <h3 className="text-lg font-semibold text-gray-700 mb-4 text-center">最高赞网站 (点赞数)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topStarredData}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  tick={{ fontSize: 12 }}
                />
                <YAxis />
                <Tooltip
                  formatter={(value) => [value, '点赞数']}
                  labelFormatter={(name) => `网站: ${name}`}
                />
                <Legend />
                <Bar dataKey="star" name="点赞数" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Author Contribution Chart */}
        <div className="lg:col-span-2 p-4 bg-gray-50 rounded-xl">
          <h3 className="text-lg font-semibold text-gray-700 mb-4 text-center">贡献者排名</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={authorStats}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  tick={{ fontSize: 12 }}
                />
                <YAxis />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === 'total') return [value, '总贡献'];
                    if (name === 'count') return [value, '网站数量'];
                    return [value, name === 'view' ? '访问量' : '点赞数'];
                  }}
                />
                <Legend />
                <Bar dataKey="total" name="总贡献" fill="#10b981" />
                <Bar dataKey="count" name="网站数量" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NavStatsChart;