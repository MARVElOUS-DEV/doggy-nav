import { useEffect, useMemo } from 'react';
import { Spin, Typography } from '@arco-design/web-react';
import AppNavList from '@/components/AppNavList';
import api from '@/utils/api';
import { useApi } from '@/hooks/useApi';
import { useRouter } from 'next/router';
import { NavItem } from '@/types';
import { useTranslation } from 'react-i18next';
import { useAtomValue } from 'jotai';
import { categoriesAtom } from '@/store/store';

const { Title } = Typography;

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const parseTagQuery = (value: string | string[] | undefined) => {
  if (Array.isArray(value)) {
    return value
      .flatMap((item) => String(item).split(','))
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [] as string[];
};

const highlightText = (text: string, query: string) => {
  if (!query) return text;

  const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, index) =>
    regex.test(part) ? (
      <span
        key={index}
        className="font-bold"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--color-primary) 25%, transparent)',
          color: 'var(--color-primary)'
        }}
      >
        {part}
      </span>
    ) : (
      part
    )
  );
};

export default function SearchResultsPage() {
  const router = useRouter();
  const { q: query, category } = router.query;
  const { t } = useTranslation('translation');
  const categories = useAtomValue(categoriesAtom);
  const selectedTags = useMemo(() => parseTagQuery(router.query.tags), [router.query.tags]);
  const categoryId = typeof category === 'string' ? category : '';
  const categoryName = categories.find((item) => item.id === categoryId)?.name;
  const queryText = typeof query === 'string' ? query : '';
  const hasFilters = Boolean(queryText || categoryId || selectedTags.length > 0);
  const { loading, data, execute: searchNavAction } = useApi<
    { data: NavItem[] },
    [{ keyword?: string; categoryId?: string; tags?: string[] }]
  >(api.getNavList);

  useEffect(() => {
    if (!router.isReady || !hasFilters) {
      return;
    }

    searchNavAction({
      ...(queryText ? { keyword: queryText } : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(selectedTags.length > 0 ? { tags: selectedTags } : {}),
    });
  }, [router.isReady, hasFilters, queryText, categoryId, selectedTags, searchNavAction]);

  const groupedResults = useMemo(() => {
    const list = data?.data || [];
    if (!list) return [];

    // Group items by their category
    const groups: { [key: string]: { name: string; list: NavItem[] } } = {};

    list.forEach((item) => {
      const categoryName = item.categoryName || t('uncategorized');
      const categoryId = item.categoryId || 'uncategorized';

      if (!groups[categoryId]) {
        groups[categoryId] = {
          name: categoryName,
          list: [],
        };
      }

      groups[categoryId].list.push({
        ...item,
        // Add highlighted versions of name and description
        highlightedName: highlightText(item.name, queryText),
        highlightedDesc: highlightText(item.desc || '', queryText),
      });
    });

    return Object.values(groups);
  }, [data, queryText, t]);

  if (!hasFilters) {
    return (
      <div className="main rounded-2xl bg-theme-background text-theme-foreground border border-theme-border shadow-lg p-8 transition-colors">
        <div className="text-center py-8">
          <Title heading={4}>{t('input_keyword_to_search')}</Title>
          <p className="text-theme-muted-foreground">{t('please_enter_search_term_to_see_results')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="main rounded-2xl bg-theme-background text-theme-foreground border border-theme-border shadow-lg p-8 transition-colors">
      {/* Optimized Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="flex flex-column items-center gap-4 p-6 glass-medium rounded-xl border border-theme-border animate-fade-in-simple">
            <Spin size={32} />
            <span className="text-theme-foreground text-lg font-medium">
              {t('loading')}
            </span>
          </div>
        </div>
      )}

      <div className="website-wrapper">
        <div className="mb-6">
          <Title heading={3} style={{ color: 'var(--color-foreground)' }}>
            {queryText
              ? `${t('search_results_for')} ${queryText.length > 20 ? `${queryText.slice(0, 20)}...` : queryText}`
              : t('filtered_results', { defaultValue: 'Filtered Results' })}
          </Title>
          <p className="text-theme-muted-foreground">
            {t('found_results', { count: data?.data.length || 0 })}
          </p>
          {(categoryName || selectedTags.length > 0) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {categoryName && (
                <span
                  className="inline-flex items-center rounded-full border border-theme-border px-3 py-1 text-xs font-medium"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--color-primary) 10%, transparent)',
                    color: 'var(--color-primary)',
                  }}
                >
                  {t('in_category', { defaultValue: 'In category' })}:{' '}
                  {t(categoryName, { defaultValue: categoryName })}
                </span>
              )}
              {selectedTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full border border-theme-border px-3 py-1 text-xs font-medium text-theme-muted-foreground"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {groupedResults.length > 0 ? (
          groupedResults.map((group) => (
            <div
              key={group.name}
              className="mb-8 rounded-xl p-4 border border-theme-border transition-colors"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--color-card) 90%, transparent)',
                backdropFilter: 'blur(12px)',
              }}
            >
              <div className="website-title" style={{ color: 'var(--color-foreground)' }}>
                {t(group.name, { defaultValue: group.name })} ({group.list.length})
              </div>
              <AppNavList list={group.list} />
            </div>
          ))
        ) : (
          !loading && (
            <div className="text-center py-8">
              <Title heading={4}>{t('no_results_found')}</Title>
              <p className="text-theme-muted-foreground">{t('try_different_search_terms')}</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
