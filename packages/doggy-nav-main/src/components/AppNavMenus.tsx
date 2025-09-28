import Link from 'next/link';
import { Menu } from '@arco-design/web-react';
import { Category } from '@/types';
import MenuStack from './MenuStack';
import { OVERVIEW } from '@/utils/localCategories';
import {
  IconMenuFold,
  IconMenuUnfold,
} from '@arco-design/web-react/icon';


export default function AppNavMenus({ categories, showMenuType, onShowMenus, onHandleSubMenuClick }: { categories: Category[], showMenuType: boolean, onShowMenus: () => void, onHandleSubMenuClick: (category: Category, id: string) => void }) {
  const isCollapse = !showMenuType;

  return (
    <div className="h-full flex flex-col overflow-hidden bg-gradient-to-b from-blue-50 to-indigo-50 text-gray-800">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-blue-200 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-3 text-lg font-bold hover:text-blue-600 transition-colors">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-2 rounded-lg shadow-sm">
            <span className="text-white font-bold">DN</span>
          </div>
          {!isCollapse && <span className="text-xl text-gray-800 font-semibold">DoggyNav</span>}
        </Link>
        <button
          onClick={onShowMenus}
          className="text-gray-600 hover:text-blue-600 p-1 rounded hover:bg-blue-100 transition-colors"
        >
          {isCollapse ? <IconMenuUnfold /> : <IconMenuFold />}
        </button>
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-4">
        <Menu
          collapse={isCollapse}
          className="border-0 bg-transparent text-gray-700"
          defaultSelectedKeys={[OVERVIEW.id]}
          style={{ backgroundColor: 'transparent' }}
          onClickMenuItem={(...a) => {
            console.log("🚀 ~ e:", a)
          }}
        >
          <MenuStack menuList={categories} onHandleSubMenuItemClick={onHandleSubMenuClick} />
        </Menu>
      </div>

      {/* Sidebar Footer */}
      {!isCollapse && (
        <div className="p-4 border-t border-blue-200 text-xs text-gray-500">
          <p className="text-center">© {new Date().getFullYear()} DoggyNav</p>
        </div>
      )}
    </div>
  );
}
