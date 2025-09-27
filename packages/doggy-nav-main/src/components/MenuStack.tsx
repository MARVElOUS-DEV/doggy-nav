import { Menu } from '@arco-design/web-react';
import { Category } from '@/types';
import { getIconComponent } from '@/utils/getWebsiteIcon';

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
                  <div className="flex items-center gap-3 w-full py-2.5 transition-all duration-200 group hover:bg-blue-50 hover:shadow-sm rounded-xl">
                    {category.icon && (getIconComponent(category.icon, 16))}
                    {category.name}
                    <div className="w-2 h-2 rounded-full bg-blue-400 opacity-0 group-hover:opacity-100 transition-transform group-hover:scale-125"></div>
                  </div>
                }
              >
                {category.children
                  ?.filter(child => child.showInMenu)
                  .map((child) => (
                    <Menu.Item
                      key={child._id}
                      onClick={() => onHandleSubMenuItemClick(child, child._id)}
                      className="group"
                    >
                      <div className="flex items-center gap-3 px-3 py-2.5 -mx-3 transition-all duration-200 group hover:bg-blue-50/50 rounded-xl">
                        {child.icon && (getIconComponent(child.icon, 16))}
                        <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors font-medium">
                          {child.name}
                        </span>
                        <div className="ml-auto w-2 h-2 rounded-full bg-blue-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      </div>
                    </Menu.Item>
                  ))}
              </Menu.SubMenu>
            );
          }

          return (
            <Menu.Item
              key={category._id}
              onClick={() => onHandleSubMenuItemClick(category, category._id)}
            >
              <div className="flex items-center gap-3 w-full py-2.5 transition-all duration-200 group hover:bg-blue-50 hover:shadow-sm rounded-xl">
                {category.icon && (getIconComponent(category.icon, 16))}
                <span className="text-gray-700 group-hover:text-gray-900 transition-colors font-medium">
                  {category.name}
                </span>
                <div className="w-2 h-2 rounded-full bg-blue-400 opacity-0 group-hover:opacity-100 transition-transform group-hover:scale-125"></div>
              </div>
            </Menu.Item>
          );
        })}
    </>
  );
}