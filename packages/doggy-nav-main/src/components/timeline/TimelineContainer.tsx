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
}

export default function TimelineContainer({
  years,
  onItemClick,
  onYearClick,
  selectedYear,
  selectedItem,
}: TimelineContainerProps) {
  const [expandedYear, setExpandedYear] = useState<number | null>(selectedYear || null);
  const containerRef = useRef<HTMLDivElement>(null);
  const observer = useRef<IntersectionObserver>();

  const handleYearToggle = useCallback((year: number) => {
    setExpandedYear(prev => prev === year ? null : year);
    onYearClick?.(year);
  }, [onYearClick]);

  const handleItemScroll = useCallback((itemId: string) => {
    const element = document.getElementById(`timeline-item-${itemId}`);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest'
      });
    }
  }, []);

  useEffect(() => {
    if (selectedYear) {
      setExpandedYear(selectedYear);
    }
  }, [selectedYear]);

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
      />

      <div className="relative">
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-amber-300 via-amber-100 to-transparent" />

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
                  transition: { duration: 0.3, ease: 'easeInOut' }
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