import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import dayjs from 'dayjs';
import { NavItem } from '@/types';

interface NavRankingProps {
  data: NavItem;
  countType?: 'createTime' | 'view' | 'star';
}

export default function NavRanking({ data, countType = 'createTime' }: NavRankingProps) {
  const [logoSrc, setLogoSrc] = useState(data.logo);

  const formatAttr = (value: string | number) => {
    if (countType === 'createTime') {
      return dayjs(value).format('YYYY-MM-DD');
    }
    return value;
  };

  const handleLogoError = () => {
    setLogoSrc('/default-web.png');
  };

  return (
    <Link href={`/nav/${data._id}`} className="flex items-center text-gray-800 mb-3 cursor-pointer min-h-[30px]">
      <Image
        src={logoSrc}
        alt={data.name}
        width={20}
        height={20}
        className="rounded-full mr-2 flex-shrink-0"
        onError={handleLogoError}
      />
      <span className="name flex-1 font-medium text-sm truncate">{data.name}</span>
      <span className="widget text-xs whitespace-nowrap">{data[countType] && formatAttr(data[countType])}</span>
      {countType === 'view' && <span className="iconfont icon-attentionfill ml-1 text-xs"></span>}
      {countType === 'star' && <span className="iconfont icon-appreciatefill ml-1 text-xs"></span>}
    </Link>
  );
}
