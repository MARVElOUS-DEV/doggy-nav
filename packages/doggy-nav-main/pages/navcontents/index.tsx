import { Empty } from '@arco-design/web-react';
import AppNavList from '@/components/AppNavList';
import api from '@/utils/api';
import { useApi } from '@/hooks/useApi';
import { useRouter } from 'next/router';
import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAtomValue, useSetAtom } from 'jotai';
import { categoriesAtom, selectedCategoryAtom } from '@/store/store';
import type { Category, NavItem } from '@/types';
import { LoadingIndicator } from '@/components/PageLoading';

function findCategoryById(categories: Category[], targetId: string): Category | null {
  for (const category of categories) {
    if (category.id === targetId) return category;
    if (category.children?.length) {
      const nested = findCategoryById(category.children, targetId);
      if (nested) return nested;
    }
  }
  return null;
}

function findCategoryPath(categories: Category[], targetId: string): Category[] {
  for (const category of categories) {
    if (category.id === targetId) return [category];
    if (category.children?.length) {
      const nested = findCategoryPath(category.children, targetId);
      if (nested.length > 0) return [category, ...nested];
    }
  }
  return [];
}

export default function NavContentsPage() {
  const router = useRouter();
  const { category, tags } = router.query;
  const { t } = useTranslation('translation');
  const { loading, data = [], execute: findNavByCategoryAction } = useApi(
    api.findNavByCategory,
  );
  const setSelectedCategory = useSetAtom(selectedCategoryAtom);
  const categories = useAtomValue(categoriesAtom);
  const selectedCategoryId = typeof category === 'string' ? category : '';
  const sectionData = useMemo(() => (Array.isArray(data) ? data : []), [data]);
  const selectedTags = useMemo(() => {
    const values = Array.isArray(tags) ? tags : typeof tags === 'string' ? [tags] : [];
    return values
      .flatMap((item) => String(item).split(','))
      .map((item) => item.trim())
      .filter(Boolean);
  }, [tags]);

  useEffect(() => {
    if (!router.isReady || !selectedCategoryId) return;
    setSelectedCategory(selectedCategoryId);
    findNavByCategoryAction(selectedCategoryId, { tags: selectedTags });
  }, [
    router.isReady,
    selectedCategoryId,
    selectedTags,
    findNavByCategoryAction,
    setSelectedCategory,
  ]);

  const categoryPath = useMemo(
    () => (selectedCategoryId ? findCategoryPath(categories, selectedCategoryId) : []),
    [categories, selectedCategoryId],
  );
  const currentCategory = useMemo(
    () => (selectedCategoryId ? findCategoryById(categories, selectedCategoryId) : null),
    [categories, selectedCategoryId],
  );
  const sectionsById = useMemo(() => {
    const sections = new Map<string, { id: string; name: string; list: NavItem[] }>();
    sectionData.forEach((item) => sections.set(item.id, item));
    return sections;
  }, [sectionData]);
  const currentSection = selectedCategoryId ? sectionsById.get(selectedCategoryId) : undefined;
  const currentBookmarks = currentSection?.list || [];
  const childCategories = useMemo(
    () => (currentCategory?.children || []).filter((child) => child.showInMenu),
    [currentCategory],
  );
  const pageTitle = currentCategory?.name || currentSection?.name || sectionData[0]?.name || '';

  const openCategory = (nextCategoryId: string) => {
    void router.push({
      pathname: '/navcontents',
      query: {
        category: nextCategoryId,
        ...(selectedTags.length > 0 ? { tags: selectedTags.join(',') } : {}),
      },
    });
  };

  if (loading) {
    return <LoadingIndicator className="py-20" label={t('loading_content')} />;
  }

  if (!selectedCategoryId && !currentCategory && sectionData.length === 0) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-8 text-theme-foreground">
        <div className="rounded-2xl border border-theme-border bg-theme-background p-16 text-center shadow-lg">
          <Empty
            description={
              <div className="text-theme-muted-foreground">
                <p className="mb-4 text-2xl">📭</p>
                <p className="mb-2 text-lg">{t('no_navigation_content')}</p>
                <p className="text-sm">{t('no_resources_any_category')}</p>
              </div>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 text-theme-foreground">
      <div
        className="overflow-hidden rounded-3xl border shadow-lg"
        style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}
      >
        <header
          className="border-b border-theme-border px-8 py-7"
          style={{
            background:
              'linear-gradient(120deg, color-mix(in srgb, var(--color-primary) 18%, transparent), color-mix(in srgb, var(--color-secondary) 18%, transparent))',
          }}
        >
          {categoryPath.length > 0 ? (
            <nav
              aria-label={t('category_breadcrumb')}
              className="mb-4 flex flex-wrap items-center gap-2 text-sm text-theme-muted-foreground"
            >
              {categoryPath.map((item, index) => (
                <div key={item.id} className="flex items-center gap-2">
                  {index > 0 ? <span aria-hidden="true">/</span> : null}
                  <button
                    type="button"
                    className="rounded-full px-3 py-1 transition-colors hover:text-theme-primary"
                    style={
                      index === categoryPath.length - 1
                        ? {
                            backgroundColor:
                              'color-mix(in srgb, var(--color-primary) 16%, transparent)',
                            color: 'var(--color-primary)',
                          }
                        : undefined
                    }
                    onClick={() => openCategory(item.id)}
                  >
                    {t(item.name, { defaultValue: item.name })}
                  </button>
                </div>
              ))}
            </nav>
          ) : null}

          <h1 className="text-3xl font-bold">
            {t(pageTitle, { defaultValue: pageTitle })}
          </h1>
          {currentCategory?.description ? (
            <p className="mt-2 max-w-3xl text-theme-muted-foreground">
              {currentCategory.description}
            </p>
          ) : null}

          {childCategories.length > 0 ? (
            <nav aria-label={t('subcategories_label')} className="mt-5 flex flex-wrap items-center gap-2">
              <span className="mr-1 text-sm font-medium text-theme-muted-foreground">
                {t('subcategories_label')}:
              </span>
              {childCategories.map((child) => (
                <button
                  key={child.id}
                  type="button"
                  className="rounded-full border border-theme-border bg-theme-background px-3 py-1.5 text-sm font-medium transition-colors hover:border-theme-primary hover:text-theme-primary"
                  onClick={() => openCategory(child.id)}
                >
                  {t(child.name, { defaultValue: child.name })}
                </button>
              ))}
            </nav>
          ) : null}
        </header>

        <main className="space-y-5 bg-theme-background p-8 transition-colors">
          <h2 className="text-xl font-semibold">{t('bookmarks_section_title')}</h2>
          {currentBookmarks.length > 0 ? (
            <AppNavList list={currentBookmarks} />
          ) : (
            <div className="rounded-2xl border border-dashed border-theme-border py-12 text-center">
              <Empty
                description={
                  <div className="text-theme-muted-foreground">
                    <p className="mb-2 text-lg">{t('no_content')}</p>
                    <p className="text-sm">
                      {childCategories.length > 0
                        ? t('no_direct_resources_choose_subcategory')
                        : t('no_resources_in_category')}
                    </p>
                  </div>
                }
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
