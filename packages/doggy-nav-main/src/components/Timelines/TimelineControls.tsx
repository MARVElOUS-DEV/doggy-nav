import { motion } from 'framer-motion';
import { Search, Calendar } from 'lucide-react';
import { TimelineYear } from '@/types/timeline';
import { useTranslation } from 'react-i18next';

interface TimelineControlsProps {
  years: TimelineYear[];
  expandedYear: number | null;
  onYearToggle: (year: number) => void;
  onItemScroll: (itemId: string) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

export default function TimelineControls({
  years,
  expandedYear,
  onYearToggle,
  onItemScroll,
  searchTerm,
  onSearchChange,
}: TimelineControlsProps) {
  const { t } = useTranslation();

  const handleJumpToYear = (year: number) => {
    onYearToggle(year);
    const element = document.getElementById(`timeline-year-${year}`);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  };

  return (
    <div className="mb-8 space-y-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={t('search_placeholder')}
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              aria-label={t('search_tooltip')}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
          <Calendar className="w-4 h-4" />
          <span>{t('quick_jump')}:</span>
        </div>
        {years.map((year) => (
          <motion.button
            key={year.year}
            onClick={() => handleJumpToYear(year.year)}
            className={`px-3 py-1.5 text-sm rounded-full transition-all duration-200 ${
              expandedYear === year.year
                ? 'bg-amber-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-amber-100 dark:hover:bg-amber-900'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label={`Jump to year ${year.year}`}
          >
            {year.year}
          </motion.button>
        ))}
      </div>

      {years.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">{t('no_websites_found')}</p>
        </div>
      )}
    </div>
  );
}
