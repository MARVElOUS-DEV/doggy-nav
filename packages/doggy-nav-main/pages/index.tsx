import { useState, useEffect } from 'react';
import { Spin } from '@arco-design/web-react';
import Affiche from '@/components/Affiche';
import NavRankingList from '@/components/NavRankingList';
import NavStatsChart from '@/components/NavStatsChart';
import VerticalTimelineContainer from '@/components/Timeline/VerticalTimelineContainer';
import api from '@/utils/api';
import { createMockTimelineData } from '@/utils/timelineData';
import { useAtom } from 'jotai';
import { navRankingAtom } from '@/store/store';
import Link from 'next/link';
import { TimelineItem as TimelineItemType } from '@/types/timeline';

export default function HomePage() {
  const [navRanking, setNavRanking] = useAtom(navRankingAtom);
  const [loading, setLoading] = useState(false);
  const [currentYearData, setCurrentYearData] = useState<any>(null);
  const currentYear = new Date().getFullYear();
  const [selectedItem, setSelectedItem] = useState<TimelineItemType | undefined>();

  // Initial data fetch - nav ranking and timeline data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const navRankingData = await api.getNavRanking();
        setNavRanking(navRankingData);

        // Create mock timeline data
        const timelineData = createMockTimelineData();
        console.log('Generated current year data:', timelineData);
        if (timelineData && timelineData.length > 0) {
          setCurrentYearData(timelineData[0]); // 只取第一年（当前年）
        }
      } catch (error) {
        console.error("Failed to fetch data", error);
      } finally {
        setLoading(false)
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
      className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"
      onKeyDown={onKeyDown}
      tabIndex={-1}
      role="application"
      aria-label="Website Navigation Dashboard"
    >
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Hero Section */}
        <div className="mb-12">
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-purple-700 p-8 text-white">
              <div className="max-w-3xl mx-auto text-center">
                <h1 className="text-4xl md:text-5xl font-bold mb-4">精选网站导航</h1>
                <p className="text-xl opacity-90 mb-8">发现优质网站，探索数字世界</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/navcontents"
                    className="bg-white text-blue-600 hover:bg-gray-100 font-semibold py-3 px-6 rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105"
                  >
                    浏览分类
                  </Link>
                  <Link
                    href="/search"
                    className="bg-transparent border-2 border-white hover:bg-white hover:text-blue-600 font-semibold py-3 px-6 rounded-lg transition-all duration-300"
                  >
                    搜索网站
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
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">热门推荐</h2>
              <p className="text-gray-600">基于访问量、点赞数和最新收录的热门网站</p>
            </div>
            <NavRankingList data={navRanking} />
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <Spin size={40} />
              <p className="mt-4 text-gray-600">正在加载精彩内容...</p>
            </div>
          </div>
        )}

        {/* Timeline Section */}
        {!loading && currentYearData && (
          <div className="bg-white rounded-2xl shadow-lg p-8 my-8">
            <VerticalTimelineContainer
              year={currentYearData.year}
              items={currentYearData.items}
              onItemSelect={setSelectedItem}
              selectedItem={selectedItem}
            />
          </div>
        )}

        {/* Statistics Chart Section */}
        {!loading && navRanking && (
          <NavStatsChart data={navRanking} />
        )}

        {/* Stats Section */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-2xl shadow-lg">
              <div className="text-3xl font-bold">{navRanking?.view?.length || 0}</div>
              <div className="text-blue-100">热门网站</div>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-2xl shadow-lg">
              <div className="text-3xl font-bold">{navRanking?.star?.length || 0}</div>
              <div className="text-purple-100">高赞网站</div>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-2xl shadow-lg">
              <div className="text-3xl font-bold">{navRanking?.news?.length || 0}</div>
              <div className="text-green-100">最新收录</div>
            </div>
          </div>
        )}

        {/* Footer CTA */}
        {!loading && (
          <div className="mt-12 text-center">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">找不到想要的网站？</h3>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                我们致力于为用户提供最优质的网站导航服务。如果您有推荐的网站或宝贵建议，欢迎提交！
              </p>
              <Link
                href="/recommend"
                className="inline-block bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-8 rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105"
              >
                提交网站
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
