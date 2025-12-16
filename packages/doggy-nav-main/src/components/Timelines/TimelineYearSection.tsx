import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Globe } from 'lucide-react';
import { TimelineItem as TimelineItemType } from '@/types/timeline';
import TimelineItem from './TimelineItem';

interface TimelineYearSectionProps {
  year: number;
  items: TimelineItemType[];
  isExpanded: boolean;
  onToggle: () => void;
  onItemClick?: (item: TimelineItemType) => void;
  selectedItem?: TimelineItemType;
}

export default function TimelineYearSection({
  year,
  items,
  isExpanded,
  onToggle,
  onItemClick,
  selectedItem,
}: TimelineYearSectionProps) {
  const quarters = items.reduce((acc, item) => {
    const quarter = Math.floor((new Date(item.createdAt).getMonth() + 2) / 3);
    if (!acc[quarter]) acc[quarter] = [];
    acc[quarter].push(item);
    return acc;
  }, {} as Record<number, TimelineItemType[]>);

  return (
    <div className="relative">
      {/* Year Header - Centered */}
      <div className="flex justify-center mb-4">
        <button
          onClick={onToggle}
          className="flex items-center space-x-2 px-4 py-2 rounded-full bg-amber-100 dark:bg-amber-900/30 hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors duration-200 group"
          aria-expanded={isExpanded}
          aria-controls={`year-${year}-content`}
        >
          <motion.div
            animate={{ rotate: isExpanded ? 90 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-amber-600"
          >
            <ChevronRight className="w-5 h-5" />
          </motion.div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-amber-600 transition-colors">
            {year}
          </h2>
          <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
            <Globe className="w-4 h-4" />
            <span>{items.length}</span>
          </div>
        </button>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            id={`year-${year}-content`}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="space-y-8"
          >
            {Object.entries(quarters)
              .sort(([a], [b]) => parseInt(a) - parseInt(b))
              .map(([quarter, quarterItems]) => {
                const sortedQuarterItems = quarterItems.sort(
                  (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );

                return (
                  <div key={`${year}-Q${quarter}`} className="relative">
                    {/* Quarter Label - Centered */}
                    <div className="flex justify-center mb-4">
                      <span className="px-3 py-1 text-sm font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-full">
                        Q{quarter} {year}
                      </span>
                    </div>

                    {/* Alternating Grid Layout */}
                    <div className="relative">
                      {/* Timeline Line - Left on mobile, Center on md+ */}
                      <div className="absolute left-4 md:left-1/2 md:-translate-x-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-amber-300 via-amber-200 to-amber-300"></div>

                      <div className="flex flex-col md:grid md:grid-cols-2 md:gap-x-8">
                        {sortedQuarterItems.map((item, index) => {
                          const isLeft = index % 2 === 0;
                          const rowIndex = Math.floor(index / 2);

                          return (
                            <motion.div
                              key={item.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.3, delay: index * 0.03 }}
                              className={`relative mb-3 pl-10 md:pl-0 ${isLeft ? 'md:col-start-1 md:pr-4' : 'md:col-start-2 md:pl-4'}`}
                              style={{
                                gridRowStart: rowIndex + 1,
                                marginTop: !isLeft ? '1.5rem' : '0',
                              }}
                            >
                              {/* Timeline Dot - Left on mobile, alternating on md+ */}
                              <div
                                className={`absolute top-4 w-3 h-3 bg-amber-400 rounded-full border-2 border-white dark:border-gray-800 shadow-md z-10 left-[0.625rem] ${
                                  isLeft ? 'md:left-auto md:-right-[1.375rem]' : 'md:-left-[1.375rem]'
                                }`}
                              ></div>

                              {/* Connector Line - Right on mobile, alternating on md+ */}
                              <div
                                className={`absolute top-5 w-4 h-0.5 bg-amber-200 left-6 ${
                                  isLeft ? 'md:left-auto md:-right-4' : 'md:-left-4'
                                }`}
                              ></div>

                              <TimelineItem
                                id={`timeline-item-${item.id}`}
                                item={item}
                                isSelected={selectedItem?.id === item.id}
                                onClick={() => onItemClick?.(item)}
                              />
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}