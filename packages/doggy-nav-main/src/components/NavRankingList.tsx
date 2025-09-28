import NavRanking from './NavRanking';
import { NavItem } from '@/types';
import { useTranslation } from 'react-i18next';

interface NavRankingListProps {
  data: {
    news: NavItem[];
    view: NavItem[];
    star: NavItem[];
  };
}

export default function NavRankingList({ data }: NavRankingListProps) {
  const { t } = useTranslation();

  return (
    <div className="nav-ranking-list grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl">
        <h3 className="text-xl font-bold text-blue-800 mb-4 flex items-center">
          <span className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></span>
          最新收录
        </h3>
        <div className="space-y-3">
          {data.news?.map((item) => (
            <NavRanking key={item.id} data={item} />
          )) || <div className="text-gray-500 text-center py-4">暂无数据</div>}
        </div>
      </div>

      <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-2xl">
        <h3 className="text-xl font-bold text-purple-800 mb-4 flex items-center">
          <span className="w-2 h-2 bg-purple-500 rounded-full mr-2 animate-pulse"></span>
          最受欢迎
        </h3>
        <div className="space-y-3">
          {data.view?.map((item) => (
            <NavRanking key={item.id} data={item} countType="view" />
          )) || <div className="text-gray-500 text-center py-4">暂无数据</div>}
        </div>
      </div>

      <div className="bg-gradient-to-br from-pink-50 to-pink-100 p-6 rounded-2xl">
        <h3 className="text-xl font-bold text-pink-800 mb-4 flex items-center">
          <span className="w-2 h-2 bg-pink-500 rounded-full mr-2 animate-pulse"></span>
          高赞推荐
        </h3>
        <div className="space-y-3">
          {data.star?.map((item) => (
            <NavRanking key={item.id} data={item} countType="star" />
          )) || <div className="text-gray-500 text-center py-4">暂无数据</div>}
        </div>
      </div>
    </div>
  );
}
