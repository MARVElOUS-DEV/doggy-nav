import { Grid } from '@arco-design/web-react';
import AppNavItem from './AppNavItem';
import { NavItem } from '@/types';

const { Row } = Grid;

interface AppNavListProps {
  list: NavItem[];
}

export default function AppNavList({ list }: AppNavListProps) {
  const handleNavClick = (item: NavItem) => {
    window.open(item.href, '_blank');
  };

  const handleNavStar = (item: NavItem) => {
    console.log('star', item);
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
          />
        ))}
      </Row>
    </div>
  );
}
