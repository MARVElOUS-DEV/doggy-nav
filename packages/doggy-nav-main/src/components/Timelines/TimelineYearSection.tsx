import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, Globe } from 'lucide-react';
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
      <div className="absolute left-8 w-4 h-4 bg-amber-400 rounded-full border-2 border-white dark:border-gray-800 shadow-lg" />

      <div className="ml-20">
        <button
          onClick={onToggle}
          className="flex items-center space-x-2 p-3 -ml-3 rounded-lg hover:bg-amber-50 dark:hover:bg-gray-800 transition-colors duration-200 group"
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white group-hover:text-amber-600 transition-colors">
            {year}
          </h2>
          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <Globe className="w-4 h-4" />
            <span>{items.length} websites</span>
          </div>
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              id={`year-${year}-content`}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="space-y-6"
            >
              {Object.entries(quarters)
                .sort(([a], [b]) => parseInt(a) - parseInt(b))
                .map(([quarter, quarterItems]) => (
                  <div key={`${year}-Q${quarter}`} className="relative">
                    <div className="absolute left-0 top-11 w-12 h-0.5 bg-gradient-to-r from-amber-200 to-transparent" />
                    <div className="absolute left-12 top-9 w-2 h-2 bg-amber-300 rounded-full" />

                    <div className="ml-16">
                      <h3 className="text-sm font-medium text-amber-600 dark:text-amber-400 mb-3">
                        Q{quarter} {year}
                      </h3>
                      <div className="space-y-3">
                        {quarterItems
                          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                          .map((item) => (
                            <TimelineItem
                              key={item.id}
                              id={`timeline-item-${item.id}`}
                              item={item}
                              isSelected={selectedItem?.id === item.id}
                              onClick={() => onItemClick?.(item)}
                            />
                          ))}
                      </div>
                    </div>
                  </div>
                ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}