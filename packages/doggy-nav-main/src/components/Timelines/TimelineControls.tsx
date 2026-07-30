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
      <div className="rounded-xl border border-theme-border bg-theme-card p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-theme-muted-foreground" />
            <input
              type="text"
              placeholder={t('search_placeholder')}
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full rounded-lg border border-theme-border bg-theme-muted py-2 pl-10 pr-4 text-theme-foreground outline-none placeholder:text-theme-muted-foreground focus:border-theme-primary focus:ring-2 focus:ring-theme-primary/20"
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
