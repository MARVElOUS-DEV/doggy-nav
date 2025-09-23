import Link from 'next/link';
import { Tooltip } from '@arco-design/web-react';
import DoggyImage from './DoggyImage';
import dayjs from 'dayjs';
import { NavItem } from '@/types';

interface NavRankingProps {
  data: NavItem;
  countType?: 'createTime' | 'view' | 'star';
}

export default function NavRanking({ data, countType = 'createTime' }: NavRankingProps) {

  const formatAttr = (value: string | number) => {
    if (countType === 'createTime') {
      return dayjs(value).format('YYYY-MM-DD');
    }
    return value;
  };

  return (
    <Link
      href={`/nav/${data._id}`}
      className="flex items-center text-gray-800 mb-3 cursor-pointer min-h-[30px] transition-all duration-200 hover:bg-blue-50 hover:bg-opacity-50 rounded-lg p-2 -m-2 group"
    >
      <DoggyImage logo={data.logo} name={data.name} />
      <Tooltip content={data.name} position="top">
        <span className="flex-1 font-medium text-sm truncate group-hover:text-blue-600 transition-colors duration-200">{data.name}</span>
      </Tooltip>
      <span className="text-xs whitespace-nowrap">{data[countType] && formatAttr(data[countType])}</span>
      {countType === 'view' && <span className="iconfont icon-attentionfill ml-1 text-xs"></span>}
      {countType === 'star' && <span className="iconfont icon-appreciatefill ml-1 text-xs"></span>}
    </Link>
  );
}
