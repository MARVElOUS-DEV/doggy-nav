import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, Calendar, ExternalLink } from 'lucide-react';
import { TimelineItem as TimelineItemType } from '@/types/timeline';
import Link from 'next/link';
import DoggyImage from '../DoggyImage';
import { useTranslation } from 'react-i18next';
import api from '@/utils/api';

interface VerticalTimelineContainerProps {
  year: number;
  items: TimelineItemType[];
  onItemSelect?: (item: TimelineItemType) => void;
  selectedItem?: TimelineItemType;
}

export default function VerticalTimelineContainer({
  year,
  items,
  onItemSelect,
  selectedItem,
}: VerticalTimelineContainerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const { t } = useTranslation('translation');

  const filteredItems = items.filter((item) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      item.title.toLowerCase().includes(searchLower) ||
      item.description?.toLowerCase().includes(searchLower) ||
      item.category?.toLowerCase().includes(searchLower) ||
      item.tags?.some((tag) => tag.toLowerCase().includes(searchLower))
    );
  });

  const sortedItems = [...filteredItems].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const handleItemClick = useCallback(
    async (item: TimelineItemType) => {
      onItemSelect?.(item);
    },
    [onItemSelect]
  );

  return (
    <div
      className="w-full max-w-4xl mx-auto px-3 sm:px-0"
      role="region"
      aria-label={t('vertical_timeline')}
    >
      {/* Header */}
      <div className="mb-6 text-center">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
          {year} {t('year_collection_timeline')}
        </h2>
        <div className="mt-2 text-center">
          <Link
            href="/timeline"
            className="text-theme-primary hover:underline font-medium inline-flex items-center"
          >
            {t('view_full_timeline')} <span className="ml-1">→</span>
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6 relative max-w-md mx-auto">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder={t('search_websites_placeholder')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm sm:text-base"
          aria-label={t('search_websites_label')}
        />
      </div>

      {/* Stats */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg p-4 mb-6 text-center max-w-md mx-auto">
        <div className="flex items-center justify-center space-x-4 text-sm">
          <div className="flex items-center space-x-1">
            <Calendar className="w-4 h-4" />
            <span>{t('total_count', { count: items.length })}</span>
          </div>
          <div className="flex items-center space-x-1">
            <span>{t('display_count', { count: filteredItems.length })}</span>
          </div>
        </div>
      </div>

      {/* Alternating Timeline */}
      <div className="relative">
        {/* Timeline Line - Left on mobile, Center on md+ */}
        <div className="absolute left-4 md:left-1/2 md:-translate-x-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-amber-400 via-amber-300 to-amber-400"></div>

        {/* Timeline Items */}
        <div className="relative">
          {sortedItems.length === 0 ? (
            <div className="text-center py-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                {t('no_matching_websites')}
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                {t('try_other_keywords')}
              </p>
            </div>
          ) : (
            <div className="flex flex-col md:grid md:grid-cols-2 md:gap-x-12">
              {sortedItems.map((item, index) => {
                const date = new Date(item.createdAt);
                const month = date.getMonth() + 1;
                const day = date.getDate();
                const isLeft = index % 2 === 0;
                const rowIndex = Math.floor(index / 2);

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.03 }}
                    className={`relative group mb-4 md:mb-6 pl-10 md:pl-0 ${isLeft ? 'md:col-start-1 md:pr-6' : 'md:col-start-2 md:pl-6'}`}
                    style={{
                      gridRowStart: rowIndex + 1,
                      marginTop: !isLeft ? '2rem' : '0',
                    }}
                  >
                    {/* Timeline Dot - Left on mobile, alternating on md+ */}
                    <div
                      className={`absolute top-3 w-3 h-3 md:w-4 md:h-4 bg-amber-500 rounded-full border-2 md:border-4 border-white dark:border-gray-900 shadow-lg z-10 group-hover:bg-amber-400 transition-colors left-[0.625rem] ${
                        isLeft ? 'md:left-auto md:-right-[1.5rem]' : 'md:-left-[1.5rem]'
                      }`}
                    ></div>

                    {/* Connector Line - Right on mobile, alternating on md+ */}
                    <div
                      className={`absolute top-4 w-4 md:w-6 h-0.5 bg-amber-300 left-6 ${
                        isLeft ? 'md:left-auto md:-right-6' : 'md:-left-6'
                      }`}
                    ></div>

                    {/* Date Label */}
                    <div className={`text-[10px] md:text-xs text-amber-600 dark:text-amber-400 font-medium mb-1 text-left ${isLeft ? 'md:text-right' : 'md:text-left'}`}>
                      {t('month_day_format', { month, day })}
                    </div>

                    {/* Content Card */}
                    <div
                      className={`flex items-center space-x-2 md:space-x-3 p-2 md:p-3 rounded-lg cursor-pointer transition-all duration-200 group-hover:shadow-md ${
                        selectedItem?.id === item.id
                          ? `bg-amber-50 dark:bg-gray-800 border-l-4 ${isLeft ? 'md:border-l-0 md:border-r-4' : ''} border-amber-400`
                          : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                      } ${isLeft ? 'md:flex-row-reverse md:space-x-reverse' : ''}`}
                      onClick={() => handleItemClick(item)}
                    >
                      {/* Website Icon */}
                      {item.logo && (
                        <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-md overflow-hidden border border-gray-200 dark:border-gray-600">
                          <DoggyImage logo={item.logo} name={item.title} width={40} height={40} />
                        </div>
                      )}

                      {/* Website Title */}
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-medium text-gray-900 dark:text-white truncate text-sm md:text-base text-left ${isLeft ? 'md:text-right' : 'md:text-left'}`}>
                          {item.title}
                        </h3>
                      </div>

                      {/* External Link */}
                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-amber-500 transition-colors flex-shrink-0"
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              const id = (item as any).navId || (item as any).id;
                              if (id) {
                                await api.updateNavView(String(id));
                              }
                            } catch {}
                          }}
                          aria-label={`${t('visit_website')} ${item.title}`}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      {sortedItems.length > 0 && (
        <div className="mt-6 sm:mt-8 pt-4 border-t border-gray-200 dark:border-gray-700 text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400">
          {t('showing_websites_total', { count: filteredItems.length })}
        </div>
      )}
    </div>
  );
}
