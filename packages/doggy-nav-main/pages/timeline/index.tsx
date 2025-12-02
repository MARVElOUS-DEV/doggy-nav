import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import TimelineContainer from '@/components/Timelines/TimelineContainer';
import { TimelineYear, TimelineItem } from '@/types/timeline';
import { createTimelineData, generateYearRange } from '@/utils/timelineData';
import { useTranslation } from 'react-i18next';
import api from '@/utils/api';
import { chromeMicroToISO } from '@/utils/time';

const TimelinePage: React.FC = () => {
  const [years, setYears] = useState<TimelineYear[]>([]);
  const [selectedItem, setSelectedItem] = useState<TimelineItem | null>(null);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation('translation');
  const currentYear = new Date().getFullYear();

  // Initialize year skeleton (latest 5 years)
  useEffect(() => {
    const skeletons = generateYearRange(currentYear - 4, currentYear).sort((a, b) => b.year - a.year);
    setYears(skeletons);
  }, []);

  // Function to fetch data for a specific year
  const fetchYearData = useCallback(async (year: number) => {
    setLoading(true);
    try {
      const list = await api.getNavAll({ 
        pageSize: 1000, 
        pageNumber: 1, 
        year: year 
      });

      const normalized = (list?.data || []).map((n) => ({
        ...n,
        createTime: chromeMicroToISO(n.createTime) || n.createTime,
      }));
      
      // Create timeline data for this specific year
      const timelineData = createTimelineData(normalized, false);
      const yearData = timelineData.find(y => y.year === year);

      if (yearData) {
        setYears(prev => prev.map(y => y.year === year ? yearData : y));
      } else {
        // If no data found for the year, ensure empty state is correct
        setYears(prev => prev.map(y => y.year === year ? { ...y, items: [] } : y));
      }
    } catch (error) {
      console.error(`Failed to fetch data for year ${year}`, error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Search function
  const handleSearch = useCallback(async (term: string) => {
    if (!term) {
      // If search is cleared, re-fetch current year to reset view
      fetchYearData(currentYear);
      return;
    }

    setLoading(true);
    try {
      const list = await api.getNavAll({ 
        pageSize: 1000, 
        pageNumber: 1, 
        name: term 
      });

      const normalized = (list?.data || []).map((n) => ({
        ...n,
        createTime: chromeMicroToISO(n.createTime) || n.createTime,
      }));
      
      const timelineData = createTimelineData(normalized, false);
      const sortedYears = [...timelineData].sort((a, b) => b.year - a.year);
      
      setYears(sortedYears);
    } catch (error) {
      console.error('Search failed', error);
    } finally {
      setLoading(false);
    }
  }, [currentYear, fetchYearData]);

  // Initial load - fetch current year
  useEffect(() => {
    fetchYearData(currentYear);
  }, [fetchYearData, currentYear]);

  const handleItemClick = (item: TimelineItem) => {
    setSelectedItem(item);
  };

  const handleYearClick = useCallback((year: number) => {
    // On-demand fetch for clicked year
    fetchYearData(year);
  }, [fetchYearData]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Head>
        <title>{t('website_timeline')} - Doggy Nav</title>
        <meta name="description" content={t('view_website_collection_history')} />
      </Head>

      <main className="container mx-auto px-4 py-8">
        <TimelineContainer
          years={years}
          onItemClick={handleItemClick}
          onYearClick={handleYearClick}
          selectedItem={selectedItem || undefined}
          onSearch={handleSearch}
          isSearching={loading}
          selectedYear={currentYear}
        />
      </main>

      {selectedItem && (
        <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-sm w-full border z-50">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-lg text-gray-900">{selectedItem.title}</h3>
              <p className="text-gray-600 text-sm mt-1">{selectedItem.description}</p>
              <p className="text-gray-500 text-xs mt-2">{new Date(selectedItem.createdAt).toLocaleDateString('zh-CN')}</p>
            </div>
            <button
              onClick={() => setSelectedItem(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          <div className="mt-3">
            <a
              href={selectedItem.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-700 text-sm underline"
            >
              {t('visit_website')}
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimelinePage;
