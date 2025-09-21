import { Menu } from '@arco-design/web-react';
import { Category } from '@/types';

interface MenuStackProps {
  menuList: Category[];
  onHandleSubMenuItemClick: (parentId: string, id: string) => void;
}

export default function MenuStack({ menuList, onHandleSubMenuItemClick }: MenuStackProps) {
  return (
    <>
      {menuList
        .filter(category => category.showInMenu)
        .map((category) => (
          <Menu.SubMenu
            key={category._id}
            title={
              <span className="flex items-center gap-2">
                {category.icon && (
                  <i className={`${category.icon} text-base`} />
                )}
                <span>{category.name}</span>
              </span>
            }
          >
            {category.children
              ?.filter(child => child.showInMenu)
              .map((child) => (
                <Menu.Item
                  key={child._id}
                  onClick={() => onHandleSubMenuItemClick(category._id, child._id)}
                >
                  {child.name}
                </Menu.Item>
              ))}
          </Menu.SubMenu>
        ))}
    </>
  );
}
