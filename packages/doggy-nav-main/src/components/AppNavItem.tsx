import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Tooltip, Grid } from '@arco-design/web-react';
import { NavItem } from '@/types';
import { useUrlStatus } from '@/utils/urlStatus';
import { useIntersectionObserver } from '@/utils/useIntersectionObserver';

const { Col } = Grid;

interface AppNavItemProps {
  data: NavItem;
  onHandleNavClick: (data: NavItem) => void;
  onHandleNavStar: (data: NavItem, callback: () => void) => void;
}

export default function AppNavItem({ data, onHandleNavClick, onHandleNavStar }: AppNavItemProps) {
  const [isStar, setIsStar] = useState(false);
  const [logoSrc, setLogoSrc] = useState(data.logo);
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
      // Update localStorage favorites
      if (typeof window !== 'undefined') {
        try {
          const storedFavorites = localStorage.getItem('favorites');
          let favorites: NavItem[] = [];

          if (storedFavorites) {
            favorites = JSON.parse(storedFavorites);
          }

          // Toggle favorite status
          if (isStar) {
            // Remove from favorites
            favorites = favorites.filter(item => item.id !== data.id);
          } else {
            // Add to favorites
            favorites = [...favorites, data];
          }

          localStorage.setItem('favorites', JSON.stringify(favorites));
        } catch (err) {
          console.error('Failed to update favorites:', err);
        }
      }

      setIsStar(!isStar);
    });
  };

  const getStatusIndicator = () => {
    const baseClasses = "absolute top-4 right-4 w-3 h-3 rounded-full z-10 border-2 border-white shadow-sm";

    switch (urlStatus.status) {
      case 'checking':
        return (
          <Tooltip content="检查中...">
            <div className={`${baseClasses} bg-yellow-400 animate-pulse`} />
          </Tooltip>
        );
      case 'accessible':
        return (
          <Tooltip content={`网站可访问 (${urlStatus.responseTime}ms)`}>
            <div className={`${baseClasses} bg-green-500 shadow-green-200`}>
              <div className="w-full h-full bg-green-500 rounded-full animate-ping opacity-75" />
            </div>
          </Tooltip>
        );
      case 'inaccessible':
        return (
          <Tooltip content="网站不可访问">
            <div className={`${baseClasses} bg-red-500 shadow-red-200`} />
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
        className="group relative h-full bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-2 border border-gray-100 hover:border-blue-200 overflow-hidden"
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
                className="title text-lg font-bold text-gray-800 group-hover:text-blue-600 transition-colors duration-200 truncate"
                title={((typeof data.highlightedName  === 'string')? data.highlightedName : data.name? data.name : undefined) }
              >
                {data.highlightedName || data.name}
              </h3>
              <p
                className="desc text-sm text-gray-600 group-hover:text-gray-700 transition-colors duration-200 line-clamp-2 max-h-[40px] overflow-hidden"
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
                  className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full"
                >
                  {tag}
                </span>
              ))}
              {data.tags.length > 3 && (
                <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                  +{data.tags.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Author Info */}
          {data.authorName && (
            <div className="flex items-center text-xs text-gray-500 mb-4">
              <span className="mr-1">👤</span>
              <span>{data.authorName}</span>
            </div>
          )}
        </Link>

        {/* Footer */}
        <div className="mt-auto border-t border-gray-100 px-6 py-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="left flex items-center space-x-4">
              <button
                onClick={() => onHandleNavClick(data)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm shadow-sm hover:shadow-md transition-all duration-200 flex items-center"
                title="链接直达"
              >
                <i className="iconfont icon-tiaozhuan mr-1"></i>
                <span>直达</span>
              </button>
              <div className="text-xs text-gray-500">
                {data.authorUrl && (
                  <a
                    href={data.authorUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-blue-600 transition-colors duration-200 flex items-center"
                  >
                    <span className="iconfont icon-zuozhe mr-1"></span>
                    <span>作者</span>
                  </a>
                )}
              </div>
            </div>
            <div className="right flex items-center space-x-4">
              <button
                onClick={handleNavStar}
                className={`flex items-center space-x-1 text-sm transition-colors duration-200 ${
                  isStar ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
                }`}
                title="点赞"
              >
                <i className="iconfont icon-appreciatefill"></i>
                <span>{data.star}</span>
              </button>
              <div className="flex items-center space-x-1 text-sm text-blue-500">
                <i className="iconfont icon-attentionfill"></i>
                <span>{data.view}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Col>
  );
}
