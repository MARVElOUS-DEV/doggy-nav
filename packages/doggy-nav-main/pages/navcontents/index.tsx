import { Button, Empty, Grid, Spin } from '@arco-design/web-react';
import AppNavList from '@/components/AppNavList';
import api from '@/utils/api';
import { useApi } from '@/hooks/useApi';
import { useRouter } from 'next/router';
import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAtomValue, useSetAtom } from 'jotai';
import { categoriesAtom, selectedCategoryAtom } from '@/store/store';
import type { Category } from '@/types';

const { Row, Col } = Grid;

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
      if (nested.length > 0) {
        return [category, ...nested];
      }
    }
  }
  return [];
}

export default function NavContentsPage() {
  const router = useRouter();
  const { category, tags } = router.query;
  const selectedTags = useMemo(() => {
    if (Array.isArray(tags)) {
      return tags
        .flatMap((item) => String(item).split(','))
        .map((item) => item.trim())
        .filter(Boolean);
    }
    if (typeof tags === 'string') {
      return tags
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    }
    return [] as string[];
  }, [tags]);
  const { t } = useTranslation('translation');
  const { loading, data = [], execute: findNavByCategoryAction } = useApi(api.findNavByCategory);
  const setSelectedCategory = useSetAtom(selectedCategoryAtom);
  const categories = useAtomValue(categoriesAtom);
  const selectedCategoryId = typeof category === 'string' ? category : '';
  const sectionData = useMemo(() => (Array.isArray(data) ? data : []), [data]);

  useEffect(() => {
    if (!router.isReady) return;
    if (!category) return;
    setSelectedCategory(category as string);
    findNavByCategoryAction(category as string, {
      tags: selectedTags,
    });
  }, [router.isReady, category, selectedTags, findNavByCategoryAction, setSelectedCategory]);

  const categoryPath = useMemo(
    () => (selectedCategoryId ? findCategoryPath(categories, selectedCategoryId) : []),
    [categories, selectedCategoryId],
  );

  const currentCategory = useMemo(
    () => (selectedCategoryId ? findCategoryById(categories, selectedCategoryId) : null),
    [categories, selectedCategoryId],
  );

  const sectionsById = useMemo(() => {
    const map = new Map<string, { id: string; name: string; list: any[] }>();
    sectionData.forEach((item) => {
      map.set(item.id, item);
    });
    return map;
  }, [sectionData]);

  const currentBookmarks = selectedCategoryId
    ? sectionsById.get(selectedCategoryId)?.list || []
    : [];

  const childFolders = useMemo(
    () => (currentCategory?.children || []).filter((child) => child.showInMenu),
    [currentCategory],
  );

  const openCategory = (nextCategoryId: string) => {
    void router.push({
      pathname: '/navcontents',
      query: {
        category: nextCategoryId,
        ...(selectedTags.length > 0 ? { tags: selectedTags.join(',') } : {}),
      },
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl text-theme-foreground">
      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-20">
          <div className="text-center">
            <Spin size={40} />
            <p className="mt-4 text-theme-muted-foreground">{t('loading_content')}</p>
          </div>
        </div>
      )}

      {/* Content Section */}
      {!loading && (
        <div className="website-wrapper space-y-12">
          {(currentCategory || sectionData.length > 0) ? (
            <>
              <div
                className="rounded-3xl border shadow-lg overflow-hidden"
                style={{
                  backgroundColor: 'var(--color-card)',
                  borderColor: 'var(--color-border)',
                }}
              >
                <div
                  className="px-8 py-7 border-b border-theme-border"
                  style={{
                    background:
                      'linear-gradient(120deg, color-mix(in srgb, var(--color-primary) 18%, transparent), color-mix(in srgb, var(--color-secondary) 18%, transparent))',
                  }}
                >
                  <div className="flex flex-col gap-4">
                    {categoryPath.length > 0 ? (
                      <div className="flex flex-wrap items-center gap-2 text-sm text-theme-muted-foreground">
                        {categoryPath.map((item, index) => (
                          <div key={item.id} className="flex items-center gap-2">
                            {index > 0 ? <span>/</span> : null}
                            <button
                              type="button"
                              className="rounded-full px-3 py-1 transition-colors"
                              style={{
                                backgroundColor:
                                  index === categoryPath.length - 1
                                    ? 'color-mix(in srgb, var(--color-primary) 16%, transparent)'
                                    : 'transparent',
                                color:
                                  index === categoryPath.length - 1
                                    ? 'var(--color-primary)'
                                    : 'var(--color-muted-foreground)',
                              }}
                              onClick={() => openCategory(item.id)}
                            >
                              {t(item.name, { defaultValue: item.name })}
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : null}

                    <div className="flex flex-wrap items-end justify-between gap-4">
                      <div>
                        <h1 className="text-3xl font-bold">
                          {t(currentCategory?.name || sectionData[0]?.name || '', {
                            defaultValue:
                              currentCategory?.name || sectionData[0]?.name || '',
                          })}
                        </h1>
                        <p className="mt-2 text-theme-muted-foreground">
                          {childFolders.length > 0
                            ? t('browse_nested_folders_in_main_pane', {
                                count: childFolders.length,
                              })
                            : t('no_resources_in_category')}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-sm">
                        <span
                          className="rounded-full px-4 py-2 font-medium"
                          style={{
                            backgroundColor:
                              'color-mix(in srgb, var(--color-primary) 18%, transparent)',
                            color: 'var(--color-primary)',
                          }}
                        >
                          {currentBookmarks.length} {t('items_count')}
                        </span>
                        <span
                          className="rounded-full px-4 py-2 font-medium"
                          style={{
                            backgroundColor:
                              'color-mix(in srgb, var(--color-secondary) 14%, var(--color-card))',
                            color: 'var(--color-foreground)',
                            border: '1px solid color-mix(in srgb, var(--color-secondary) 24%, var(--color-border))',
                          }}
                        >
                          {t('folders_count', { count: childFolders.length })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-8 bg-theme-background transition-colors space-y-10">
                  {childFolders.length > 0 ? (
                    <div className="space-y-5">
                      <div className="flex items-center justify-between gap-4">
                        <h2 className="text-xl font-semibold">{t('folders_section_title')}</h2>
                        <p className="text-sm text-theme-muted-foreground">
                          {t('open_folder_to_continue_browsing')}
                        </p>
                      </div>

                      <Row gutter={[20, 20]}>
                        {childFolders.map((child) => {
                          const childList = sectionsById.get(child.id)?.list || [];
                          return (
                            <Col xs={24} sm={12} lg={8} xl={6} key={child.id}>
                              <button
                                type="button"
                                onClick={() => openCategory(child.id)}
                                className="w-full h-full rounded-2xl border p-5 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                                style={{
                                  backgroundColor: 'var(--color-card)',
                                  borderColor:
                                    'color-mix(in srgb, var(--color-border) 80%, var(--color-primary) 20%)',
                                }}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div
                                    className="flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-bold"
                                    style={{
                                      background:
                                        'linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 20%, transparent), color-mix(in srgb, var(--color-secondary) 16%, transparent))',
                                      color: 'var(--color-primary)',
                                    }}
                                  >
                                    {t(child.name, { defaultValue: child.name })
                                      .charAt(0)
                                      .toUpperCase()}
                                  </div>
                                  <span className="text-xs text-theme-muted-foreground">
                                    {t('subfolders_count', {
                                      count:
                                        child.children?.filter((item) => item.showInMenu)
                                          .length || 0,
                                    })}
                                  </span>
                                </div>

                                <div className="mt-4">
                                  <h3 className="text-lg font-semibold">
                                    {t(child.name, { defaultValue: child.name })}
                                  </h3>
                                  <p className="mt-2 text-sm text-theme-muted-foreground line-clamp-2">
                                    {childList.length > 0
                                      ? t('bookmarks_available_in_folder', {
                                          count: childList.length,
                                        })
                                      : t('open_folder_to_browse_deeper_levels')}
                                  </p>
                                </div>

                                <div className="mt-5 flex items-center justify-between text-sm">
                                  <span
                                    className="rounded-full px-3 py-1"
                                    style={{
                                      backgroundColor:
                                        'color-mix(in srgb, var(--color-primary) 14%, transparent)',
                                      color: 'var(--color-primary)',
                                    }}
                                  >
                                    {t('bookmarks_count', { count: childList.length })}
                                  </span>
                                  <span className="text-theme-primary">{t('open')}</span>
                                </div>
                              </button>
                            </Col>
                          );
                        })}
                      </Row>
                    </div>
                  ) : null}

                  <div className="space-y-5">
                    <div className="flex items-center justify-between gap-4">
                      <h2 className="text-xl font-semibold">{t('bookmarks_section_title')}</h2>
                      {categoryPath.length > 1 ? (
                        <Button onClick={() => openCategory(categoryPath[categoryPath.length - 2].id)}>
                          {t('back_to_parent')}
                        </Button>
                      ) : null}
                    </div>

                    {currentBookmarks.length > 0 ? (
                      <AppNavList list={currentBookmarks} />
                    ) : (
                      <div className="text-center py-12 rounded-2xl border border-dashed border-theme-border">
                        <Empty
                          description={
                            <div className="text-theme-muted-foreground">
                              <p className="text-lg mb-2">{t('no_content')}</p>
                              <p className="text-sm">
                                {childFolders.length > 0
                                  ? t('folder_contains_nested_folders_only')
                                  : t('no_resources_in_category')}
                              </p>
                            </div>
                          }
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-theme-background border border-theme-border rounded-2xl shadow-lg p-16 text-center transition-colors">
              <Empty
                description={
                  <div className="text-theme-muted-foreground">
                    <p className="text-2xl mb-4">📭</p>
                    <p className="text-lg mb-2">{t('no_navigation_content')}</p>
                    <p className="text-sm">{t('no_resources_any_category')}</p>
                  </div>
                }
              />
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      {!loading && sectionData.length > 0 && (
        <div className="mt-16 text-center">
          <div className="bg-theme-background border border-theme-border rounded-xl shadow-md p-6 transition-colors">
            <p className="text-theme-muted-foreground">
              {t('showing_current_folder_resources', {
                count: currentBookmarks.length,
              })}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
