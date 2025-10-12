import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, ArrowUp, ArrowDown, Calendar, ExternalLink } from 'lucide-react';
import { TimelineItem as TimelineItemType } from '@/types/timeline';
import TimelineItem from './TimelineItem';
import { useTranslation } from 'react-i18next';

interface SimplifiedTimelineContainerProps {
  year: number;
  items: TimelineItemType[];
  onItemSelect?: (item: TimelineItemType) => void;
  selectedItem?: TimelineItemType;
}

export default function SimplifiedTimelineContainer({
  year,
  items,
  onItemSelect,
  selectedItem,
}: SimplifiedTimelineContainerProps) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [sortBy, setSortBy] = React.useState<'date' | 'title'>('date');
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('desc');

  // Filter items based on search term
  const filteredItems = items.filter(item => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      item.title.toLowerCase().includes(searchLower) ||
      item.description?.toLowerCase().includes(searchLower) ||
      item.category?.toLowerCase().includes(searchLower) ||
      item.tags?.some(tag => tag.toLowerCase().includes(searchLower))
    );
  });

  // Sort items
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sortBy === 'date') {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    } else {
      const titleA = a.title.toLowerCase();
      const titleB = b.title.toLowerCase();
      return sortOrder === 'desc' ? titleB.localeCompare(titleA) : titleA.localeCompare(titleB);
    }
  });

  const handleItemClick = useCallback((item: TimelineItemType) => {
    onItemSelect?.(item);
  }, [onItemSelect]);

  return (
    <div className="relative w-full max-w-4xl mx-auto" role="region" aria-label={t('current_year_data_timeline')}>
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {year} {t('yearly_website_collection')}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {t('total_websites_collected', { count: items.length })}
        </p>
      </div>

      {/* Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={t('search_placeholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              aria-label={t('search_tooltip')}
            />
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'title')}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500"
              aria-label={t('sort_by')}
            >
              <option value="date">{t('sort_by_date')}</option>
              <option value="title">{t('sort_by_title')}</option>
            </select>

            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              aria-label={t(sortOrder === 'asc' ? 'sort_ascending' : 'sort_descending')}
            >
              {sortOrder === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl p-6 mb-6 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-xl font-semibold mb-1">{year} {t('annual_statistics')}</h3>
            <p className="text-amber-100">{t('curated_website_resources')}</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <div className="flex items-center space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>{t('collected')}: <strong>{items.length}</strong></span>
              </div>
              <div className="flex items-center space-x-2">
                <span>{t('displayed')}: <strong>{filteredItems.length}</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Items */}
      <div className="space-y-4">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-lg">{t('no_websites_found')}</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">{t('try_different_keywords')}</p>
          </div>
        ) : (
          sortedItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <TimelineItem
                id={`timeline-item-${item.id}`}
                item={item}
                isSelected={selectedItem?.id === item.id}
                onClick={() => handleItemClick(item)}
              />
            </motion.div>
          ))
        )}
      </div>

      {/* Footer */}
      {filteredItems.length > 0 && (
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            {t('displaying_websites_count', { count: filteredItems.length, date: new Date().toLocaleDateString() })}
          </div>
        </div>
      )}
    </div>
  );
}