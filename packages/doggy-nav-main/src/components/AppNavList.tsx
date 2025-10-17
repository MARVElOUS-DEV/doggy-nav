import { Grid, Message } from '@arco-design/web-react';
import NavCard from './NavCard';
import { NavItem } from '@/types';
import { useAtom } from 'jotai';
import { favoritesActionsAtom, isAuthenticatedAtom } from '@/store/store';
import api from '@/utils/api';
import { useTranslation } from 'react-i18next';

const { Row } = Grid;

interface AppNavListProps {
  list: NavItem[];
}

export default function AppNavList({ list }: AppNavListProps) {
  const { t } = useTranslation();
  const [, favoritesActions] = useAtom(favoritesActionsAtom);
  const [isAuthenticated] = useAtom(isAuthenticatedAtom);

  const handleNavClick = async (item: NavItem) => {
    try {
      await api.updateNavView(item.id);
    } catch {}
    window.open(item.href, '_blank');
  };

  const handleNavStar = async(item: NavItem, callback: () => void) => {
    try {
      await api.updateNavStar(item.id);
      callback?.();
    } catch {}
  };

  const handleFavorite = async (item: NavItem, callback: (isFavorite: boolean) => void) => {
    if (!isAuthenticated) {
      Message.warning(t('please_login_to_favorite'));
      return;
    }

    try {
      const currentFavoriteStatus = item.isFavorite;

      if (currentFavoriteStatus) {
        await favoritesActions({ type: 'REMOVE_FAVORITE', navId: item.id });
        Message.success(t('unfavorite_success'));
        callback(false);
      } else {
        await favoritesActions({ type: 'ADD_FAVORITE', navId: item.id });
        Message.success(t('favorite_success'));
        callback(true);
      }
    } catch (error) {
      console.error('Favorite operation failed:', error);
      Message.error(t('operation_failed'));
    }
  };

  return (
    <div className="nav-list-container">
      <Row gutter={[24, 24]}>
        {list.map((item) => (
          <NavCard
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
