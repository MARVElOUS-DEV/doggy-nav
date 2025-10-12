import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, ArrowUp, ArrowDown, Calendar, ExternalLink } from 'lucide-react';
import { TimelineItem as TimelineItemType } from '@/types/timeline';
import TimelineItem from './TimelineItem';
import { useTranslation } from 'react-i18next';

interface MonthlyTimelineContainerProps {
  year: number;
  items: TimelineItemType[];
  onItemSelect?: (item: TimelineItemType) => void;
  selectedItem?: TimelineItemType;
}

export default function MonthlyTimelineContainer({
  year,
  items,
  onItemSelect,
  selectedItem,
}: MonthlyTimelineContainerProps) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [sortBy, setSortBy] = React.useState<'date' | 'title'>('date');
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('desc');

  // Group items by month
  const groupedItems = items.reduce((acc, item) => {
    const month = new Date(item.createdAt).getMonth() + 1; // 1-12
    if (!acc[month]) acc[month] = [];
    acc[month].push(item);
    return acc;
  }, {} as Record<number, TimelineItemType[]>);

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

  // Group filtered items by month
  const filteredGroupedItems = filteredItems.reduce((acc, item) => {
    const month = new Date(item.createdAt).getMonth() + 1; // 1-12
    if (!acc[month]) acc[month] = [];
    acc[month].push(item);
    return acc;
  }, {} as Record<number, TimelineItemType[]>);

  // Sort items within each month
  const sortedGroupedItems: { month: number; items: TimelineItemType[] }[] = [];
  for (let month = 1; month <= 12; month++) {
    if (filteredGroupedItems[month]) {
      const sortedItems = [...filteredGroupedItems[month]].sort((a, b) => {
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
      sortedGroupedItems.push({ month, items: sortedItems });
    }
  }

  const handleItemClick = useCallback((item: TimelineItemType) => {
    onItemSelect?.(item);
  }, [onItemSelect]);

  // Month names using translation keys
  const monthNames = [
    t('january'), t('february'), t('march'), t('april'), t('may'), t('june'),
    t('july'), t('august'), t('september'), t('october'), t('november'), t('december')
  ];

  return (
    <div className="relative w-full max-w-4xl mx-auto" role="region" aria-label={t('annual_monthly_timeline')}>
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {year} {t('yearly_collection_timeline')}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {t('monthly_grouped_websites', { count: items.length })}
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
            <p className="text-amber-100">{t('monthly_grouped_collection_status')}</p>
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
              <div className="flex items-center space-x-2">
                <span>{t('months')}: <strong>{Object.keys(filteredGroupedItems).length}</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Timeline */}
      <div className="space-y-8">
        {sortedGroupedItems.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-lg">{t('no_websites_found')}</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">{t('try_different_keywords')}</p>
          </div>
        ) : (
          sortedGroupedItems.map((group, groupIndex) => (
            <motion.div
              key={group.month}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: groupIndex * 0.05 }}
            >
              {/* Month Header */}
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center mr-4 flex-shrink-0">
                  <span className="font-bold text-amber-700 dark:text-amber-200">{group.month}</span>
                </div>
                <div className="border-l-2 border-amber-400 pl-4 py-2">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {monthNames[group.month - 1]} ({group.month}{t('month')})
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    {group.items.length} {t('items')}
                  </p>
                </div>
              </div>

              {/* Month Items */}
              <div className="ml-20 space-y-4">
                {group.items.map((item, itemIndex) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: itemIndex * 0.02 }}
                  >
                    <TimelineItem
                      id={`timeline-item-${item.id}`}
                      item={item}
                      isSelected={selectedItem?.id === item.id}
                      onClick={() => handleItemClick(item)}
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Footer */}
      {sortedGroupedItems.length > 0 && (
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            {t('displaying_months_and_items', { months: sortedGroupedItems.length, items: filteredItems.length })}
          </div>
        </div>
      )}
    </div>
  );
}