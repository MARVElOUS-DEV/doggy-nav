import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Calendar, CheckCircle, AlertCircle } from 'lucide-react';
import { TimelineItem as TimelineItemType } from '@/types/timeline';

interface TimelineItemProps {
  id: string;
  item: TimelineItemType;
  isSelected: boolean;
  onClick: () => void;
}

export default function TimelineItem({
  id,
  item,
  isSelected,
  onClick,
}: TimelineItemProps) {
  const date = new Date(item.createdAt);
  const formattedDate = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const statusIcon = item.status === 'active' ? (
    <CheckCircle className="w-4 h-4 text-green-500" />
  ) : (
    <AlertCircle className="w-4 h-4 text-yellow-500" />
  );

  return (
    <motion.div
      id={id}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      whileHover={{ y: -2 }}
      className={`relative group cursor-pointer transition-all duration-200 ${
        isSelected
          ? 'bg-amber-50 dark:bg-gray-800 border-l-4 border-amber-400'
          : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-amber-300'
      } rounded-lg p-4 shadow-sm`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={`${item.title} - Added on ${formattedDate}`}
    >
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-amber-400 rounded-full border-2 border-white dark:border-gray-900" />

      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
              {item.title}
            </h3>
            {statusIcon}
          </div>

          {item.description && (
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
              {item.description}
            </p>
          )}

          <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center space-x-1">
              <Calendar className="w-3 h-3" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="capitalize">{item.status}</span>
            </div>
          </div>

          {item.tags && item.tags.length > 0 && (
            <div className="flex items-center space-x-2 mt-3">
              {item.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-200 text-xs rounded-full"
                >
                  {tag}
                </span>
              ))}
              {item.tags.length > 3 && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  +{item.tags.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2 ml-4">
          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-amber-500 transition-colors"
              onClick={(e) => e.stopPropagation()}
              aria-label="Open website in new tab"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}