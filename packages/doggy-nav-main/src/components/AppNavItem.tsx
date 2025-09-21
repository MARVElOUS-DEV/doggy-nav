import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Tooltip, Grid } from '@arco-design/web-react';
import { NavItem } from '@/types';
import { useUrlStatus } from '@/utils/urlStatus';

const { Col } = Grid;

interface AppNavItemProps {
  data: NavItem;
  onHandleNavClick: (data: NavItem) => void;
  onHandleNavStar: (data: NavItem, callback: () => void) => void;
}

export default function AppNavItem({ data, onHandleNavClick, onHandleNavStar }: AppNavItemProps) {
  const [isStar, setIsStar] = useState(false);
  const [isView, setIsView] = useState(false);
  const urlStatus = useUrlStatus(data.href);

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
            <div className={`${baseClasses} bg-yellow-400 animate-pulse`} />
          </Tooltip>
        );
      case 'accessible':
        return (
          <Tooltip content={`网站可访问 (${urlStatus.responseTime}ms)`}>
            <div className={`${baseClasses} bg-green-500 shadow-green-200`}>
              <div className="w-full h-full bg-green-400 rounded-full animate-ping opacity-75" />
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
    <Col xs={24} sm={8} md={6} lg={4} className="website-item text-xs mb-5 overflow-hidden cursor-pointer transition-all duration-300 text-gray-500 relative">
      <div className="wrap rounded-md bg-white cursor-pointer shadow-lg relative">
        {getStatusIndicator()}
        <div className="link absolute right-5 top-2.5 hidden z-10" onClick={() => onHandleNavClick(data)}>
          <Tooltip content="链接直达">
            <i className="iconfont icon-tiaozhuan"></i>
          </Tooltip>
        </div>
        <Link href={`/nav/${data._id}`} className="info block transition-all duration-300 bg-white p-5 flex flex-col justify-start rounded-t-md">
          <div className="info-header flex items-center overflow-auto">
            <Image src={data.logo} alt={data.name} width={35} height={35} className="logo min-w-[35px] w-[35px] h-[35px] rounded-full mr-4" />
            <div className="info-header-right flex flex-col">
              <strong className="title text-blue-600 text-base truncate">{data.name}</strong>
              <div className="desc mt-1 truncate">{data.desc || '这个网站什么描述也没有...'}</div>
            </div>
          </div>
        </Link>
        <div className="website-item__footer border-t border-gray-100 bg-white p-2.5 text-right flex rounded-b-md">
          <div className="left text-xs">
            {data.authorUrl && (
              <a href={data.authorUrl} target="_blank" rel="noopener noreferrer" className="flex items-center">
                <span className="iconfont icon-zuozhe"></span>
                <span>{data.authorName}</span>
              </a>
            )}
          </div>
          <div className="right flex-1">
            <span className={`website-item__icon ${isView ? 'text-blue-500' : ''}`}>
              <span className="iconfont icon-attentionfill"></span>
              {data.view}
            </span>
            <span className={`website-item__icon ${isStar ? 'text-blue-500' : ''} ml-4`} onClick={handleNavStar}>
              <span className="iconfont icon-appreciatefill"></span>
              {data.star}
            </span>
          </div>
        </div>
      </div>
    </Col>
  );
}
