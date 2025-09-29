import { Menu } from '@arco-design/web-react';
import { Category } from '@/types';
import { DynamicIcon } from './DoggyImage';

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
                key={category.id}
                className={"transition-all duration-200 hover:bg-blue-50 hover:shadow-sm"}
                title={
                  <div className="group flex items-center gap-3 w-full py-2.5">
                    {category.icon && <DynamicIcon iconName= {category.icon} fontSize={16} />}
                    <span className="text-gray-700 group-hover:text-gray-900 transition-colors font-medium">
                      {category.name}
                    </span>
                    <div className="ml-auto w-2 h-2 rounded-full bg-blue-400 opacity-0 group-hover:opacity-100 transition-transform group-hover:scale-125"></div>
                  </div>
                }
              >
                {category.children
                  ?.filter(child => child.showInMenu)
                  .map((child) => (
                    <Menu.Item
                      key={child.id}
                      onClick={() => onHandleSubMenuItemClick(child, child.id)}
                    >
                      <div className="group flex items-center gap-3 px-3 py-2.5 -mx-3 transition-all duration-200 hover:bg-blue-50/50 rounded-xl">
                        {child.icon && <DynamicIcon iconName= {child.icon} fontSize={16} />}
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
              key={category.id}
              onClick={() => onHandleSubMenuItemClick(category, category.id)}
              className="transition-all duration-200 hover:bg-blue-50 hover:shadow-sm"
            >
              <div className="group flex items-center gap-3 w-full py-2.5">
                {category.icon && <DynamicIcon iconName= {category.icon} fontSize={16} />}
                <span className="text-gray-700 group-hover:text-gray-900 transition-colors font-medium">
                  {category.name}
                </span>
                <div className="ml-auto w-2 h-2 rounded-full bg-blue-400 opacity-0 group-hover:opacity-100 transition-transform group-hover:scale-125"></div>
              </div>
            </Menu.Item>
          );
        })}
    </>
  );
}