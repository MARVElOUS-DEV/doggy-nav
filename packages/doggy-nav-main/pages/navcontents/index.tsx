import { Spin, Empty } from '@arco-design/web-react';
import AppNavList from '@/components/AppNavList';
import api from '@/utils/api';
import { useApi } from '@/hooks/useApi';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export default function NavContentsPage() {
  const router = useRouter();
  const { category } = router.query;
  const { t } = useTranslation('translation');
  const { loading, data = [], execute: findNavByCategoryAction } = useApi(api.findNavByCategory);

  useEffect(() => {
    if (!category) return;
    findNavByCategoryAction(category as string);
  }, [category, findNavByCategoryAction]);

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
          {data && data.length > 0 ? (
            data.map((item, index) => (
              <div
                key={item.id}
                className="category-section rounded-2xl shadow-lg overflow-hidden transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                style={{
                  backgroundColor: 'var(--color-card)',
                  border: '1px solid var(--color-border)',
                  boxShadow:
                    index === 0
                      ? '0 0 0 2px color-mix(in srgb, var(--color-primary) 25%, transparent)'
                      : undefined
                }}
              >
                <div
                  className="section-header px-8 py-6 border-b border-theme-border transition-colors"
                  style={{
                    background: 'linear-gradient(90deg, color-mix(in srgb, var(--color-primary) 18%, transparent) 0%, color-mix(in srgb, var(--color-secondary) 18%, transparent) 100%)'
                  }}
                >
                  <div className="flex items-center space-x-4">
                    <div
                      className="w-4 h-4 rounded-full animate-pulse"
                      style={{ backgroundColor: 'var(--color-primary)' }}
                    ></div>
                    <h2
                      id={item.id}
                      className="text-2xl font-bold"
                    >
                      {t(item.name, { defaultValue: item.name })}
                    </h2>
                    {item.list && (
                      <span
                        className="text-sm font-medium px-3 py-1 rounded-full"
                        style={{
                          backgroundColor: 'color-mix(in srgb, var(--color-primary) 25%, transparent)',
                          color: 'var(--color-primary)'
                        }}
                      >
                        {item.list.length} {t('items_count')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="section-content p-8">
                  {item.list && item.list.length > 0 ? (
                    <AppNavList list={item.list} />
                  ) : (
                    <div className="text-center py-12">
                      <Empty
                        description={
                          <div className="text-theme-muted-foreground">
                            <p className="text-lg mb-2">{t('no_content')}</p>
                            <p className="text-sm">{t('no_resources_in_category')}</p>
                          </div>
                        }
                      />
                    </div>
                  )}
                </div>
              </div>
            ))
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
      {!loading && data && data.length > 0 && (
        <div className="mt-16 text-center">
          <div className="bg-theme-background border border-theme-border rounded-xl shadow-md p-6 transition-colors">
            <p className="text-theme-muted-foreground">
              {t('showing')}{' '}
              <span
                className="font-bold"
                style={{ color: 'var(--color-primary)' }}
              >
                {data.reduce((acc, item) => acc + (item.list?.length || 0), 0)}
              </span>{' '}
              {t('website_resources')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}