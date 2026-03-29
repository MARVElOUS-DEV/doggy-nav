import { useEffect, useMemo, useRef, useState } from 'react';
import { IconClose } from '@arco-design/web-react/icon';
import { Search as SearchIcon } from 'lucide-react';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import { useAtomValue } from 'jotai';
import { categoriesAtom, tagsAtom } from '@/store/store';

const parseQueryString = (value: string | string[] | undefined) => {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }

  return value ?? '';
};

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

interface AppSearchProps {
  onClose?: () => void;
}

export default function AppSearch({ onClose }: AppSearchProps) {
  const { t } = useTranslation('translation');
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const categories = useAtomValue(categoriesAtom);
  const tags = useAtomValue(tagsAtom);
  const [searchValue, setSearchValue] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [scopeToCategory, setScopeToCategory] = useState(false);

  const pageCategoryId =
    router.pathname === '/navcontents' ? parseQueryString(router.query.category) : '';
  const queryCategoryId =
    router.pathname === '/search' ? parseQueryString(router.query.category) : '';
  const currentCategoryId = pageCategoryId || queryCategoryId;
  const currentCategory = categories.find((item) => item.id === currentCategoryId);
  const activeCategoryId = scopeToCategory ? currentCategoryId : '';

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 30);

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleEsc);

    return () => {
      window.clearTimeout(timeoutId);
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  useEffect(() => {
    if (!router.isReady) {
      return;
    }

    const nextQuery = parseQueryString(router.query.q);
    const nextTags = parseTagQuery(router.query.tags);
    const nextCategoryId =
      router.pathname === '/search' ? parseQueryString(router.query.category) : '';

    setSearchValue(nextQuery);
    setSelectedTags(nextTags);
    setScopeToCategory(Boolean(nextCategoryId));
  }, [router.isReady, router.pathname, router.query.category, router.query.q, router.query.tags]);

  const visibleTags = useMemo(() => {
    const keyword = searchValue.trim().toLowerCase();
    const sortedTags = [...tags].sort(
      (left, right) => (right.count ?? 0) - (left.count ?? 0) || left.name.localeCompare(right.name)
    );

    if (!keyword) {
      return sortedTags.slice(0, 18);
    }

    const matchingTags = sortedTags.filter((item) => item.name.toLowerCase().includes(keyword));
    return matchingTags.length > 0 ? matchingTags.slice(0, 18) : sortedTags.slice(0, 12);
  }, [searchValue, tags]);

  const handleSearch = () => {
    const keyword = searchValue.trim();

    if (!keyword && selectedTags.length === 0 && !activeCategoryId) {
      return;
    }

    const nextQuery: Record<string, string> = {};

    if (keyword) {
      nextQuery.q = keyword;
    }

    if (activeCategoryId) {
      nextQuery.category = activeCategoryId;
    }

    if (selectedTags.length > 0) {
      nextQuery.tags = selectedTags.join(',');
    }

    const pathname = !keyword && activeCategoryId && selectedTags.length === 0 ? '/navcontents' : '/search';
    void router.push({ pathname, query: nextQuery });
    onClose?.();
  };

  const toggleTag = (tagName: string) => {
    setSelectedTags((current) =>
      current.includes(tagName)
        ? current.filter((item) => item !== tagName)
        : [...current, tagName]
    );
  };

  const clearAll = () => {
    setSearchValue('');
    setSelectedTags([]);
    setScopeToCategory(false);
    inputRef.current?.focus();
  };

  return (
    <div className="fixed inset-0 z-[90] p-4 sm:p-6">
      <div
        className="absolute inset-0"
        onClick={onClose}
        style={{
          background:
            'radial-gradient(circle at top, color-mix(in srgb, var(--color-primary) 12%, transparent), rgba(15, 23, 42, 0.58))',
          backdropFilter: 'blur(16px)',
        }}
      />

      <div className="relative mx-auto flex min-h-full max-w-3xl items-center" onClick={(event) => event.stopPropagation()}>
        <div
          className="w-full rounded-[32px] border p-5 shadow-2xl sm:p-7"
          style={{
            background:
              'linear-gradient(180deg, color-mix(in srgb, var(--color-card) 96%, white 4%), color-mix(in srgb, var(--color-background) 94%, var(--color-primary) 6%))',
            borderColor: 'color-mix(in srgb, var(--color-border) 82%, white 18%)',
            boxShadow:
              '0 30px 100px color-mix(in srgb, black 30%, transparent), inset 0 1px 0 color-mix(in srgb, white 12%, transparent)',
          }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-theme-foreground sm:text-3xl">
                {t('search_placeholder')}
              </h2>
              <p className="mt-2 text-sm text-theme-muted-foreground sm:text-base">
                {t('simplified_search_description')}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label={t('close_search')}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border transition-colors"
              style={{
                borderColor: 'var(--color-border)',
                backgroundColor: 'color-mix(in srgb, var(--color-background) 90%, transparent)',
                color: 'var(--color-muted-foreground)',
              }}
            >
              <IconClose />
            </button>
          </div>

          <div
            className="mt-6 rounded-[28px] border p-3 sm:p-4"
            style={{
              borderColor: 'color-mix(in srgb, var(--color-primary) 22%, var(--color-border))',
              background:
                'linear-gradient(160deg, color-mix(in srgb, var(--color-background) 90%, transparent), color-mix(in srgb, var(--color-primary) 8%, transparent))',
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="hidden h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl sm:flex"
                style={{
                  backgroundColor:
                    'color-mix(in srgb, var(--color-primary) 14%, var(--color-background))',
                  color: 'var(--color-primary)',
                }}
              >
                <SearchIcon className="h-5 w-5" />
              </div>

              <input
                ref={inputRef}
                type="text"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    handleSearch();
                  }
                }}
                placeholder={t('search_placeholder')}
                className="min-w-0 flex-1 border-none bg-transparent text-lg font-medium text-theme-foreground outline-none placeholder:text-theme-muted-foreground sm:text-2xl"
              />

              {searchValue && (
                <button
                  type="button"
                  onClick={() => setSearchValue('')}
                  className="rounded-2xl px-3 py-2 text-sm transition-colors"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--color-secondary) 90%, transparent)',
                    color: 'var(--color-muted-foreground)',
                  }}
                >
                  {t('clear_search')}
                </button>
              )}

              <button
                type="button"
                onClick={handleSearch}
                className="inline-flex items-center rounded-2xl px-4 py-3 text-sm font-semibold text-white"
                style={{
                  background:
                    'linear-gradient(135deg, var(--color-primary), color-mix(in srgb, var(--color-primary) 72%, white 28%))',
                }}
              >
                {t('search')}
              </button>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-theme-border px-3 py-1 text-xs text-theme-muted-foreground">
                {t('search_keyboard_hint_enter')}
              </span>
              <span className="rounded-full border border-theme-border px-3 py-1 text-xs text-theme-muted-foreground">
                {t('search_keyboard_hint_escape')}
              </span>
              {(searchValue || selectedTags.length > 0 || scopeToCategory) && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="rounded-full px-3 py-1 text-xs text-theme-muted-foreground transition-colors hover:text-theme-foreground"
                >
                  {t('clear_filters')}
                </button>
              )}
            </div>
          </div>

          {currentCategory && (
            <div className="mt-5">
              <button
                type="button"
                onClick={() => setScopeToCategory((current) => !current)}
                className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors"
                style={{
                  borderColor: scopeToCategory
                    ? 'color-mix(in srgb, var(--color-primary) 28%, var(--color-border))'
                    : 'var(--color-border)',
                  backgroundColor: scopeToCategory
                    ? 'color-mix(in srgb, var(--color-primary) 10%, var(--color-background))'
                    : 'color-mix(in srgb, var(--color-background) 90%, transparent)',
                  color: scopeToCategory ? 'var(--color-primary)' : 'var(--color-foreground)',
                }}
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{
                    backgroundColor: scopeToCategory
                      ? 'var(--color-primary)'
                      : 'var(--color-muted-foreground)',
                  }}
                />
                {t('search_current_category')}:{' '}
                {t(currentCategory.name, { defaultValue: currentCategory.name })}
              </button>
            </div>
          )}

          <div className="mt-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-theme-foreground">
                  {t('filter_tags')}
                </h3>
                <p className="mt-1 text-sm text-theme-muted-foreground">
                  {t('simplified_search_tags_description')}
                </p>
              </div>

              {selectedTags.length > 0 && (
                <span className="rounded-full border border-theme-border px-3 py-1 text-xs text-theme-muted-foreground">
                  {selectedTags.length} {t('selected')}
                </span>
              )}
            </div>

            {selectedTags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {selectedTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm"
                    style={{
                      borderColor: 'color-mix(in srgb, var(--color-primary) 22%, var(--color-border))',
                      backgroundColor:
                        'color-mix(in srgb, var(--color-primary) 10%, var(--color-background))',
                      color: 'var(--color-primary)',
                    }}
                  >
                    #{tag}
                    <span className="text-xs">×</span>
                  </button>
                ))}
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              {visibleTags.map((tag) => {
                const isActive = selectedTags.includes(tag.name);

                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.name)}
                    className="rounded-full border px-3 py-2 text-sm transition-colors"
                    style={{
                      borderColor: isActive
                        ? 'color-mix(in srgb, var(--color-primary) 24%, var(--color-border))'
                        : 'var(--color-border)',
                      backgroundColor: isActive
                        ? 'color-mix(in srgb, var(--color-primary) 10%, var(--color-background))'
                        : 'color-mix(in srgb, var(--color-card) 86%, transparent)',
                      color: isActive ? 'var(--color-primary)' : 'var(--color-foreground)',
                    }}
                  >
                    #{tag.name}
                    {typeof tag.count === 'number' ? (
                      <span className="ml-2 text-xs text-theme-muted-foreground">({tag.count})</span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
