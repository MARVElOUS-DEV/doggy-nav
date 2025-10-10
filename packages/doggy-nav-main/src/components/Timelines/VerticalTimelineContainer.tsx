import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, Calendar, ExternalLink } from 'lucide-react';
import { TimelineItem as TimelineItemType } from '@/types/timeline';
import DoggyImage from '../DoggyImage';

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

  // Sort items by date (newest first)
  const sortedItems = [...filteredItems].sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const handleItemClick = useCallback((item: TimelineItemType) => {
    onItemSelect?.(item);
  }, [onItemSelect]);

  return (
    <div className="w-full max-w-2xl mx-auto px-3 sm:px-0" role="region" aria-label="垂直时间线">
      {/* Header */}
      <div className="mb-6 text-center">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
          {year} 年收录时间线
        </h2>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
          共 {items.length} 个网站
        </p>
      </div>

      {/* Search */}
      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="搜索网站..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm sm:text-base"
          aria-label="搜索网站"
        />
      </div>

      {/* Stats */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg p-4 mb-6 text-center">
        <div className="flex items-center justify-center space-x-4 text-sm">
          <div className="flex items-center space-x-1">
            <Calendar className="w-4 h-4" />
            <span>总数: {items.length}</span>
          </div>
          <div className="flex items-center space-x-1">
            <span>显示: {filteredItems.length}</span>
          </div>
        </div>
      </div>

      {/* Vertical Timeline */}
      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute left-6 sm:left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-amber-400 via-amber-300 to-amber-400"></div>

        {/* Timeline Items */}
        <div className="space-y-6 sm:space-y-8">
          {sortedItems.length === 0 ? (
            <div className="text-center py-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-lg">没有找到匹配的网站</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">请尝试其他搜索关键词</p>
            </div>
          ) : (
            sortedItems.map((item, index) => {
              const date = new Date(item.createdAt);
              const month = date.getMonth() + 1;
              const day = date.getDate();

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="relative flex items-start group"
                >
                  {/* Timeline Dot */}
                  <div className="absolute left-5 sm:left-6 w-3 h-3 sm:w-4 sm:h-4 bg-amber-500 rounded-full border-2 sm:border-4 border-white dark:border-gray-900 shadow-lg z-10 group-hover:bg-amber-400 transition-colors"></div>

                  {/* Timeline Content */}
                  <div className="ml-12 sm:ml-16 flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-1">
                      <div className="text-[10px] sm:text-xs text-amber-600 dark:text-amber-400 font-medium whitespace-nowrap">
                        {month}月{day}日
                      </div>
                    </div>

                    <div
                      className={`flex items-center space-x-3 p-2 sm:p-3 rounded-lg cursor-pointer transition-all duration-200 group-hover:shadow-md ${
                        selectedItem?.id === item.id
                          ? 'bg-amber-50 dark:bg-gray-800 border-l-4 border-amber-400'
                          : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                      onClick={() => handleItemClick(item)}
                    >
                      {/* Website Icon */}
                      {item.logo && (
                        <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-md overflow-hidden border border-gray-200 dark:border-gray-600">
                          <DoggyImage 
                            logo={item.logo}
                            name={item.title}
                            width={40}
                            height={40}
                          />
                          <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs">
                            {item.title.charAt(0).toUpperCase()}
                          </div>
                        </div>
                      )}

                      {/* Website Title */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 dark:text-white truncate text-sm sm:text-base">
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
                          onClick={(e) => e.stopPropagation()}
                          aria-label={`访问 ${item.title}`}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* Footer */}
      {sortedItems.length > 0 && (
        <div className="mt-6 sm:mt-8 pt-4 border-t border-gray-200 dark:border-gray-700 text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400">
          共显示 {filteredItems.length} 个网站
        </div>
      )}
    </div>
  );
}