import React from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, ArrowUp, ArrowDown, Calendar } from 'lucide-react';
import { TimelineYear } from '@/types/timeline';

interface TimelineControlsProps {
  years: TimelineYear[];
  expandedYear: number | null;
  onYearToggle: (year: number) => void;
  onItemScroll: (itemId: string) => void;
}

export default function TimelineControls({
  years,
  expandedYear,
  onYearToggle,
  onItemScroll,
}: TimelineControlsProps) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [sortBy, setSortBy] = React.useState<'date' | 'title'>('date');
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('desc');

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

  const filteredYears = years.filter(year => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return year.items.some(item =>
      item.title.toLowerCase().includes(searchLower) ||
      item.description?.toLowerCase().includes(searchLower) ||
      item.tags?.some(tag => tag.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div className="mb-8 space-y-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search websites..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              aria-label="Search websites"
            />
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'title')}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500"
              aria-label="Sort by"
            >
              <option value="date">Sort by Date</option>
              <option value="title">Sort by Title</option>
            </select>

            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              aria-label={`Sort ${sortOrder === 'asc' ? 'ascending' : 'descending'}`}
            >
              {sortOrder === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
          <Calendar className="w-4 h-4" />
          <span>Quick Jump:</span>
        </div>
        {filteredYears.map((year) => (
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

      {filteredYears.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">No websites found matching your search.</p>
        </div>
      )}
    </div>
  );
}