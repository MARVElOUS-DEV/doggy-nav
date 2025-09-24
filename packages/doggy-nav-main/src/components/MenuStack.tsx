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
                  <div className="flex items-center gap-3 w-full px-3 py-2.5 -mx-3 transition-all duration-200 group hover:bg-blue-50 hover:shadow-sm rounded-xl">
                    {category.icon && (
                      <div className="w-6 h-6 flex items-center justify-center text-blue-500 group-hover:text-blue-600 transition-colors">
                        <i className={`${category.icon} text-sm`} />
                      </div>
                    )}
                    <span className="font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
                      {category.name}
                    </span>
                    <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
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
                        {child.icon && (
                          <div className="w-5 h-5 flex items-center justify-center text-blue-400 group-hover:text-blue-500 transition-colors">
                            <i className={`${child.icon} text-xs`} />
                          </div>
                        )}
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
              className="group"
            >
              <div className="flex items-center gap-3 px-3 py-2.5 -mx-3 transition-all duration-200 group hover:bg-blue-50 hover:shadow-sm rounded-xl">
                {category.icon && (
                  <div className="w-6 h-6 flex items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600 text-white rounded-lg shadow-sm group-hover:shadow-md transition-shadow">
                    <i className={`${category.icon} text-sm`} />
                  </div>
                )}
                <div className="flex-1">
                  <span className="text-gray-700 group-hover:text-gray-900 transition-colors font-medium">
                    {category.name}
                  </span>
                </div>
                <div className="w-2 h-2 rounded-full bg-blue-400 opacity-0 group-hover:opacity-100 transition-transform group-hover:scale-125"></div>
              </div>
            </Menu.Item>
          );
        })}
    </>
  );
}