import Link from 'next/link';
import { Tooltip } from '@arco-design/web-react';
import DoggyImage from './DoggyImage';
import dayjs from 'dayjs';
import { NavItem } from '@/types';

interface NavRankingProps {
  data: NavItem;
  countType?: 'createTimeDate' | 'view' | 'star';
}

export default function NavRanking({ data, countType = 'createTimeDate' }: NavRankingProps) {

  const formatAttr = (value: string | number) => {
    if (countType === 'createTimeDate') {
      return dayjs(value).format('YYYY-MM-DD');
    }
    return value;
  };

  return (
    <Link
      href={`/nav/${data.id}`}
      className="flex items-center text-theme-foreground mb-3 cursor-pointer min-h-[30px] transition-all duration-200 hover:bg-theme-muted rounded-lg p-2 -m-2 group"
    >
      <DoggyImage logo={data.logo} name={data.name} />
      <Tooltip content={data.name} position="top">
        <span className="flex-1 font-medium text-sm truncate group-hover:text-theme-primary transition-colors duration-200">{data.name}</span>
      </Tooltip>
      <span className="text-xs whitespace-nowrap">{data[countType] && formatAttr(data[countType])}</span>
      {countType === 'view' && <span className="iconfont icon-attentionfill ml-1 text-xs"></span>}
      {countType === 'star' && <span className="iconfont icon-appreciatefill ml-1 text-xs"></span>}
    </Link>
  );
}
