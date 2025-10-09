import { useEffect, useMemo } from 'react';
import { Spin, Typography } from '@arco-design/web-react';
import AppNavList from '@/components/AppNavList';
import api from '@/utils/api';
import { useApi } from '@/hooks/useApi';
import { useRouter } from 'next/router';
import { NavItem } from '@/types';

const { Title } = Typography;

const highlightText = (text: string, query: string) => {
  if (!query) return text;

  const regex = new RegExp(`(${query})`, 'gi');
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
  const { q: query } = router.query;
  const { loading, data, execute: searchNavAction } = useApi<{ data: NavItem[] }, [{ keyword: string }]>(api.getNavList);
  useEffect(() => {
    if (query) {
      searchNavAction({ keyword: query as string });
    }
  }, [query,searchNavAction]);

  const groupedResults = useMemo(() => {
    const list = data?.data || [];
    if (!list) return [];

    // Group items by their category
    const groups: { [key: string]: { name: string; list: NavItem[] } } = {};

    list.forEach(item => {
      const categoryName = item.categoryName || 'Uncategorized';
      const categoryId = item.categoryId || 'uncategorized';

      if (!groups[categoryId]) {
        groups[categoryId] = {
          name: categoryName,
          list: []
        };
      }

      groups[categoryId].list.push({
        ...item,
        // Add highlighted versions of name and description
        highlightedName: highlightText(item.name, query as string),
        highlightedDesc: highlightText(item.desc || '', query as string)
      });
    });

    return Object.values(groups);
  }, [data, query]);

  if (!query) {
    return (
      <div className="main p-4 rounded-xl bg-theme-card text-theme-foreground border border-theme-border transition-colors">
        <div className="text-center py-8">
          <Title heading={4}>🔍输入关键词开始搜索吧</Title>
          <p className="text-theme-muted-foreground">Please enter a search term to see results.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="main p-4 rounded-xl bg-theme-background text-theme-foreground transition-colors">
      {loading && <Spin />}
      <div className="website-wrapper">
        <div className="mb-6">
          <Title heading={3} style={{ color: 'var(--color-foreground)' }}>
            {`Search Results for ${query.toString().length > 20 ? query.toString().slice(0, 20) + '...' : query}`}
          </Title>
          <p className="text-theme-muted-foreground">
            Found {data?.data.length || 0} results
          </p>
        </div>

        {groupedResults.length > 0 ? (
          groupedResults.map((group) => (
            <div
              key={group.name}
              className="mb-8 rounded-xl p-4 border border-theme-border transition-colors"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--color-card) 90%, transparent)',
                backdropFilter: 'blur(12px)'
              }}
            >
              <div className="website-title" style={{ color: 'var(--color-foreground)' }}>
                {group.name} ({group.list.length})
              </div>
              <AppNavList list={group.list} />
            </div>
          ))
        ) : (
          !loading && (
            <div className="text-center py-8">
              <Title heading={4}>No results found</Title>
              <p className="text-theme-muted-foreground">Try different search terms.</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}