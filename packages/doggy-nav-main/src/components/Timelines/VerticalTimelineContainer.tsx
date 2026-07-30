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
        <h2 className="text-xl font-bold text-theme-foreground sm:text-2xl">
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
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-theme-muted-foreground" />
        <input
          type="text"
          placeholder={t('search_websites_placeholder')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-lg border border-theme-border bg-theme-card py-2 pl-10 pr-3 text-sm text-theme-foreground outline-none transition-shadow placeholder:text-theme-muted-foreground focus:border-theme-primary focus:ring-2 focus:ring-theme-primary/20 sm:text-base"
          aria-label={t('search_websites_label')}
        />
      </div>

      {/* Stats */}
      <div className="mx-auto mb-6 max-w-md rounded-xl border border-theme-primary/20 bg-theme-secondary p-4 text-center text-theme-secondary-foreground">
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
        <div className="absolute bottom-0 left-4 top-0 w-0.5 bg-theme-primary/30 md:left-1/2 md:-translate-x-1/2"></div>

        {/* Timeline Items */}
        <div className="relative">
          {sortedItems.length === 0 ? (
            <div className="rounded-xl border border-theme-border bg-theme-muted py-8 text-center shadow-sm">
              <Calendar className="mx-auto mb-4 h-12 w-12 text-theme-muted-foreground" />
              <p className="text-lg text-theme-muted-foreground">{t('no_matching_websites')}</p>
              <p className="mt-2 text-sm text-theme-muted-foreground">{t('try_other_keywords')}</p>
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
                      className={`absolute left-[0.625rem] top-3 z-10 h-3 w-3 rounded-full border-2 border-theme-card bg-theme-primary shadow-lg transition-opacity group-hover:opacity-80 md:h-4 md:w-4 md:border-4 ${
                        isLeft ? 'md:left-auto md:-right-[1.5rem]' : 'md:-left-[1.5rem]'
                      }`}
                    ></div>

                    {/* Connector Line - Right on mobile, alternating on md+ */}
                    <div
                      className={`absolute left-6 top-4 h-0.5 w-4 bg-theme-primary/40 md:w-6 ${
                        isLeft ? 'md:left-auto md:-right-6' : 'md:-left-6'
                      }`}
                    ></div>

                    {/* Date Label */}
                    <div
                      className={`mb-1 text-left text-[10px] font-medium text-theme-primary md:text-xs ${isLeft ? 'md:text-right' : 'md:text-left'}`}
                    >
                      {t('month_day_format', { month, day })}
                    </div>

                    {/* Content Card */}
                    <div
                      className={`flex items-center space-x-2 md:space-x-3 p-2 md:p-3 rounded-lg cursor-pointer transition-all duration-200 group-hover:shadow-md ${
                        selectedItem?.id === item.id
                          ? `bg-theme-secondary border-l-4 ${isLeft ? 'md:border-l-0 md:border-r-4' : ''} border-theme-primary`
                          : 'border border-theme-border bg-theme-card hover:bg-theme-muted'
                      } ${isLeft ? 'md:flex-row-reverse md:space-x-reverse' : ''}`}
                      onClick={() => handleItemClick(item)}
                    >
                      {/* Website Icon */}
                      {item.logo && (
                        <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-md border border-theme-border md:h-10 md:w-10">
                          <DoggyImage logo={item.logo} name={item.title} width={40} height={40} />
                        </div>
                      )}

                      {/* Website Title */}
                      <div className="flex-1 min-w-0">
                        <h3
                          className={`truncate text-left text-sm font-medium text-theme-foreground md:text-base ${isLeft ? 'md:text-right' : 'md:text-left'}`}
                        >
                          {item.title}
                        </h3>
                      </div>

                      {/* External Link */}
                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-shrink-0 text-theme-muted-foreground transition-colors hover:text-theme-primary"
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
        <div className="mt-6 border-t border-theme-border pt-4 text-center text-xs text-theme-muted-foreground sm:mt-8 sm:text-sm">
          {t('showing_websites_total', { count: filteredItems.length })}
        </div>
      )}
    </div>
  );
}
