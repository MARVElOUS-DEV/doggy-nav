import Link from 'next/link';
import Image from 'next/image';
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
    <Link href={`/nav/${data._id}`} className="flex items-center text-gray-800 mb-5 cursor-pointer">
      <Image src={data.logo} alt={data.name} width={20} height={20} className="rounded-full mr-2" />
      <span className="name flex-1 font-medium text-sm">{data.name}</span>
      <span className="widget">{data[countType] && formatAttr(data[countType])}</span>
      {countType === 'view' && <span className="iconfont icon-attentionfill ml-1"></span>}
      {countType === 'star' && <span className="iconfont icon-appreciatefill ml-1"></span>}
    </Link>
  );
}
