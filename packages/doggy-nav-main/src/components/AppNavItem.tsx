import { useState } from 'react';
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

  const handleLogoError = () => {
    setLogoSrc('/default-web.png');
  };

  const handleNavStar = () => {
    onHandleNavStar(data, () => {
      setIsStar(true);
    });
  };

  const getStatusIndicator = () => {
    const baseClasses = "absolute top-3 right-3 w-3 h-3 rounded-full z-10 border-2 border-white shadow-sm";

    switch (urlStatus.status) {
      case 'checking':
        return (
          <Tooltip content="检查中...">
            <div className={`${baseClasses} bg-warning animate-pulse`} />
          </Tooltip>
        );
      case 'accessible':
        return (
          <Tooltip content={`网站可访问 (${urlStatus.responseTime}ms)`}>
            <div className={`${baseClasses} bg-success shadow-green-200`}>
              <div className="w-full h-full bg-success rounded-full animate-ping opacity-75" />
            </div>
          </Tooltip>
        );
      case 'inaccessible':
        return (
          <Tooltip content="网站不可访问">
            <div className={`${baseClasses} bg-error shadow-red-200`} />
          </Tooltip>
        );
      default:
        return null;
    }
  };

  return (
    <Col xs={24} sm={12} md={8} lg={6} className="website-item text-xs mb-5 overflow-hidden cursor-pointer transition-all duration-300 text-gray-500 relative group">
      <div
        ref={intersectionRef}
        className="wrap rounded-xl glass-medium cursor-pointer shadow-lg relative h-full flex flex-col transition-all duration-300 ease-in-out transform group-hover:-translate-y-1 group-hover:shadow-xl group-hover:bg-opacity-30"
      >
        {getStatusIndicator()}
        <div className="link absolute right-5 top-2.5 hidden z-10 group-hover:block transition-opacity duration-300" onClick={() => onHandleNavClick(data)}>
          <Tooltip content="链接直达">
            <i className="iconfont icon-tiaozhuan text-primary-500 hover:text-primary-700 transition-colors duration-200"></i>
          </Tooltip>
        </div>
        <Link
          href={`/nav/${data._id}`}
          className="info transition-all duration-300 bg-transparent bg-opacity-20 p-5 flex flex-col justify-start rounded-t-xl flex-grow group-hover:bg-gradient-to-br from-white from-opacity-20 to-primary-50 to-opacity-30"
        >
          <div className="info-header flex items-center overflow-auto min-h-[40px]">
            <div className="logo-container relative">
              <Image
                src={logoSrc}
                alt={data.name}
                width={35}
                height={35}
                className="logo min-w-[35px] w-[35px] h-[35px] rounded-full mr-4 flex-shrink-0 transition-transform duration-300 group-hover:scale-105"
                onError={handleLogoError}
              />
            </div>
            <div className="info-header-right flex flex-col">
              <strong className="title text-primary-600 text-base truncate group-hover:text-primary-800 transition-colors duration-200">{data.name}</strong>
              <div className="desc mt-1 text-xs truncate group-hover:text-gray-700 transition-colors duration-200">{data.desc || '这个网站什么描述也没有...'}</div>
            </div>
          </div>
        </Link>
        <div className="website-item__footer border-t border-white border-opacity-20 bg-transparent bg-opacity-20 p-2.5 text-right flex flex-shrink-0 rounded-b-xl group-hover:border-primary-200 group-hover:border-opacity-30 transition-all duration-200">
          <div className="left text-xs">
            {data.authorUrl && (
              <a href={data.authorUrl} target="_blank" rel="noopener noreferrer" className="flex items-center group-hover:text-primary-600 transition-colors duration-200">
                <span className="iconfont icon-zuozhe"></span>
                <span>{data.authorName}</span>
              </a>
            )}
          </div>
          <div className="right flex-1">
            <span className={`website-item__icon ${isStar ? 'text-primary-500' : ''} group-hover:text-primary-500 transition-colors duration-200`}>
              <span className="iconfont icon-attentionfill"></span>
              {data.view}
            </span>
            <span className={`website-item__icon ${isStar ? 'text-primary-500' : ''} ml-4 group-hover:text-primary-500 transition-colors duration-200`} onClick={handleNavStar}>
              <span className="iconfont icon-appreciatefill"></span>
              {data.star}
            </span>
          </div>
        </div>
      </div>
    </Col>
  );
}
