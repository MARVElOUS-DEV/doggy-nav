import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TimelineYear, TimelineItem as TimelineItemType } from '@/types/timeline';
import TimelineYearSection from './TimelineYearSection';
import TimelineControls from './TimelineControls';

interface TimelineContainerProps {
  years: TimelineYear[];
  onItemClick?: (item: TimelineItemType) => void;
  onYearClick?: (year: number) => void;
  selectedYear?: number;
  selectedItem?: TimelineItemType;
  onSearch?: (term: string) => void;
  isSearching?: boolean;
}

export default function TimelineContainer({
  years,
  onItemClick,
  onYearClick,
  selectedYear,
  selectedItem,
  onSearch,
  isSearching = false,
}: TimelineContainerProps) {
  const [expandedYear, setExpandedYear] = useState<number | null>(selectedYear || null);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const handleYearToggle = useCallback(
    (year: number) => {
      setExpandedYear((prev) => (prev === year ? null : year));
      onYearClick?.(year);
    },
    [onYearClick]
  );

  const handleItemScroll = useCallback((itemId: string) => {
    const element = document.getElementById(`timeline-item-${itemId}`);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest',
      });
    }
  }, []);

  useEffect(() => {
    if (selectedYear) {
      setExpandedYear(selectedYear);
    }
  }, [selectedYear]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onSearch) {
        onSearch(searchTerm);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, onSearch]);

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-4xl mx-auto p-6"
      role="region"
      aria-label="Timeline"
    >
      <TimelineControls
        years={years}
        expandedYear={expandedYear}
        onYearToggle={handleYearToggle}
        onItemScroll={handleItemScroll}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      <div className="relative">
        <div className="space-y-8">
          <AnimatePresence mode="wait">
            {years.map((yearData) => (
              <motion.div
                key={yearData.year}
                id={`timeline-year-${yearData.year}`}
                data-year={yearData.year}
                initial={{ opacity: 0, height: 0 }}
                animate={{
                  opacity: 1,
                  height: 'auto',
                  transition: { duration: 0.3, ease: 'easeInOut' },
                }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <TimelineYearSection
                  year={yearData.year}
                  items={yearData.items}
                  isExpanded={expandedYear === yearData.year}
                  onToggle={() => handleYearToggle(yearData.year)}
                  onItemClick={onItemClick}
                  selectedItem={selectedItem}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
