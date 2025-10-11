import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Tooltip, Grid, Button, Space } from '@arco-design/web-react';
import { NavItem } from '@/types';
import { useUrlStatus } from '@/utils/urlStatus';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { IconRightCircle } from '@arco-design/web-react/icon';
import { FavoriteButton, StarButton, ViewCounter } from './Buttons';

const { Col } = Grid;

interface AppNavItemProps {
  data: NavItem;
  onHandleNavClick: (data: NavItem) => void;
  onHandleNavStar: (data: NavItem, callback: () => void) => void;
  onHandleFavorite?: (data: NavItem, callback: (isFavorite: boolean) => void) => void;
}

export default function AppNavItem({ data, onHandleNavClick, onHandleNavStar, onHandleFavorite }: AppNavItemProps) {
  const [isStar, setIsStar] = useState(false);
  const [isFavorite, setIsFavorite] = useState(data.isFavorite || false);
  const [logoSrc, setLogoSrc] = useState(data.logo);
  const [viewCount, setViewCount] = useState<number>(data.view || 0);
  const [intersectionRef, isVisible] = useIntersectionObserver({ threshold: 0.1 });
  const urlStatus = useUrlStatus(data.href, isVisible);

  // Check if item is in favorites on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedFavorites = localStorage.getItem('favorites');
        if (storedFavorites) {
          const favorites = JSON.parse(storedFavorites);
          const isFavorited = Array.isArray(favorites) && favorites.some((item: NavItem) => item.id === data.id);
          setIsStar(isFavorited);
        }
      } catch (err) {
        console.error('Failed to check favorites:', err);
      }
    }
  }, [data.id]);

  const handleLogoError = () => {
    setLogoSrc('/default-web.png');
  };

  const handleNavStar = () => {
    onHandleNavStar(data, () => {
      setIsStar(!isStar);
    });
  };

  const handleFavorite = () => {
    if (!onHandleFavorite) return;

    onHandleFavorite(data, (newFavoriteStatus) => {
      setIsFavorite(newFavoriteStatus);
    });
  };

  const getStatusIndicator = () => {
    const baseClasses = "absolute top-4 right-4 w-3 h-3 rounded-full z-10";
    const baseStyle = {
      border: '2px solid var(--color-card)',
    } as const;

    switch (urlStatus.status) {
      case 'checking':
        return (
          <Tooltip content="检查中...">
            <div
              className={baseClasses}
              style={{
                ...baseStyle,
                backgroundColor: 'color-mix(in srgb, var(--color-secondary) 55%, transparent)',
                boxShadow: '0 0 0 4px color-mix(in srgb, var(--color-secondary) 15%, transparent)'
              }}
            />
          </Tooltip>
        );
      case 'accessible':
        return (
          <Tooltip content={`网站可访问 (${urlStatus.responseTime}ms)`}>
            <div
              className={baseClasses}
              style={{
                ...baseStyle,
                backgroundColor: 'color-mix(in srgb, var(--color-primary) 75%, transparent)',
                boxShadow: '0 0 0 4px color-mix(in srgb, var(--color-primary) 18%, transparent)'
              }}
            >
              <div
                className="w-full h-full rounded-full animate-ping opacity-75"
                style={{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 90%, transparent)' }}
              />
            </div>
          </Tooltip>
        );
      case 'inaccessible':
        return (
          <Tooltip content="网站不可访问">
            <div
              className={baseClasses}
              style={{
                ...baseStyle,
                backgroundColor: 'color-mix(in srgb, var(--color-destructive) 75%, transparent)',
                boxShadow: '0 0 0 4px color-mix(in srgb, var(--color-destructive) 18%, transparent)'
              }}
            />
          </Tooltip>
        );
      default:
        return null;
    }
  };

  return (
    <Col
      xs={24}
      sm={12}
      md={8}
      lg={6}
      xl={6}
      className="website-item"
    >
      <div
        ref={intersectionRef}
        className="group relative h-full rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-2 border overflow-hidden bg-theme-background text-theme-foreground border-theme-border"
        style={{
          boxShadow: '0 12px 24px rgba(15, 23, 42, 0.08)',
        }}
      >
        {/* Status Indicator */}
        {getStatusIndicator()}

        {/* Main Content */}
        <Link
          href={`/nav/${data.id}`}
          className="p-6 h-full flex flex-col min-h-[120px]"
        >
          <div className="flex items-center space-x-4 mb-4">
            <div className="logo-container flex-shrink-0">
              <Image
                src={logoSrc}
                alt={data.name}
                width={48}
                height={48}
                className="logo w-12 h-12 rounded-xl shadow-md transition-transform duration-300 group-hover:scale-110"
                onError={handleLogoError}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3
                className="title text-lg font-bold transition-colors duration-200 truncate group-hover:text-theme-primary"
                style={{ color: 'var(--color-foreground)' }}
                title={((typeof data.highlightedName  === 'string')? data.highlightedName : data.name? data.name : undefined) }
              >
                {data.highlightedName || data.name}
              </h3>
              <p
                className="desc text-sm transition-colors duration-200 line-clamp-2 max-h-[40px] overflow-hidden group-hover:text-theme-foreground"
                style={{ color: 'var(--color-muted-foreground)' }}
                title={typeof (data.highlightedDesc)  === 'string' ? data.highlightedDesc: data.desc? data.desc: '这个网站什么描述也没有' }
              >
                {data.highlightedDesc || data.desc || '这个网站什么描述也没有...'}
              </p>
            </div>
          </div>

          {/* Tags */}
          {data.tags && data.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {data.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="text-xs px-2 py-1 rounded-full"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--color-primary) 20%, transparent)',
                    color: 'var(--color-primary)'
                  }}
                >
                  {tag}
                </span>
              ))}
              {data.tags.length > 3 && (
                <span
                  className="text-xs px-2 py-1 rounded-full"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--color-muted) 85%, transparent)',
                    color: 'var(--color-muted-foreground)'
                  }}
                >
                  +{data.tags.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Author Info */}
          {data.authorName && (
            <div className="flex items-center text-xs text-theme-muted-foreground mb-4">
              <span className="mr-1">👤</span>
              <span>{data.authorName}</span>
            </div>
          )}
        </Link>

        {/* Footer */}
        <div
          className="mt-auto border-t px-6 py-4"
          style={{
            borderColor: 'var(--color-border)',
            backgroundColor: 'color-mix(in srgb, var(--color-muted) 80%, transparent)'
          }}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button
              type='primary'
              onClick={async () => {
                try {
                  await Promise.resolve(onHandleNavClick(data));
                  setViewCount((v) => v + 1);
                } catch {}
              }}
              className="w-full sm:w-auto py-1 hover:translate-x-0.5 rounded-xl text-base shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center"
              title="链接直达"
              icon={<IconRightCircle fontSize={16} />}
            >
              直达
            </Button>
            <Space size="mini" className="flex w-full sm:w-auto items-center justify-end sm:justify-start space-x-4">
              <FavoriteButton
                isFavorite={isFavorite}
                onToggle={handleFavorite}
                variant="icon-only"
              />
              <StarButton
                isStarred={isStar}
                starCount={data.star}
                onToggle={handleNavStar}
                variant="icon-only"
              />
              <ViewCounter viewCount={viewCount} />
            </Space>
          </div>
        </div>
      </div>
    </Col>
  );
}
