import { Menu } from '@arco-design/web-react';
import { Category } from '@/types';
interface MenuStackProps {
  menuList: Category[];
  onHandleSubMenuItemClick: (category: Category, id: string) => void;
}

export default function MenuStack({ menuList, onHandleSubMenuItemClick }: MenuStackProps) {
  return (
    <>
      {menuList
        .filter(category => category.showInMenu)
        .map((category) => {
          const hasChildren = category.children && category.children.length > 0;

          if (hasChildren) {
            return (
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
                    <Menu.Item key={child._id} onClick={() => onHandleSubMenuItemClick(child, child._id)}>
                      <div className='flex-center'>
                        {child.name}
                      </div>
                    </Menu.Item>
                  ))}
              </Menu.SubMenu>
            );
          }

          return (
            <Menu.Item key={category._id} onClick={() => onHandleSubMenuItemClick(category, category._id)}>
              <div className="flex items-center gap-2">
                {category.icon && (
                  <i className={`${category.icon} text-base`} />
                )}
                <span>{category.name}</span>
              </div>
            </Menu.Item>
          );
        })}
    </>
  );
}
