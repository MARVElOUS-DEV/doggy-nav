import { Grid, Message } from '@arco-design/web-react';
import AppNavItem from './AppNavItem';
import { NavItem } from '@/types';
import { useAtom } from 'jotai';
import { favoritesActionsAtom, isAuthenticatedAtom } from '@/store/store';

const { Row } = Grid;

interface AppNavListProps {
  list: NavItem[];
}

export default function AppNavList({ list }: AppNavListProps) {
  const [, favoritesActions] = useAtom(favoritesActionsAtom);
  const [isAuthenticated] = useAtom(isAuthenticatedAtom);

  const handleNavClick = (item: NavItem) => {
    window.open(item.href, '_blank');
  };

  const handleNavStar = (item: NavItem, callback: () => void) => {
    console.log('star', item);
    // TODO: Implement star API call
    callback();
  };

  const handleFavorite = async (item: NavItem, callback: (isFavorite: boolean) => void) => {
    if (!isAuthenticated) {
      Message.warning('请先登录后再收藏');
      return;
    }

    try {
      const currentFavoriteStatus = item.isFavorite;

      if (currentFavoriteStatus) {
        await favoritesActions({ type: 'REMOVE_FAVORITE', navId: item.id });
        Message.success('取消收藏成功');
        callback(false);
      } else {
        await favoritesActions({ type: 'ADD_FAVORITE', navId: item.id });
        Message.success('收藏成功');
        callback(true);
      }
    } catch (error) {
      console.error('Favorite operation failed:', error);
      Message.error('操作失败，请重试');
    }
  };

  return (
    <div className="nav-list-container">
      <Row gutter={[24, 24]}>
        {list.map((item) => (
          <AppNavItem
            key={item.id}
            data={item}
            onHandleNavClick={handleNavClick}
            onHandleNavStar={handleNavStar}
            onHandleFavorite={handleFavorite}
          />
        ))}
      </Row>
    </div>
  );
}
