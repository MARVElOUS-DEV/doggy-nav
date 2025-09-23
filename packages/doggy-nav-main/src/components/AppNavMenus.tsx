import Link from 'next/link';
import Image from 'next/image';
import { Menu } from '@arco-design/web-react';
import { Category } from '@/types';
import MenuStack from './MenuStack';
import { OVERVIEW } from '@/utils/localCategories';
import {
  IconMenuFold,
  IconMenuUnfold,
} from '@arco-design/web-react/icon';


export default function AppNavMenus({ categories, showMenuType, onShowMenus,selectedKeys, onHandleSubMenuClick }: { categories: Category[], showMenuType: boolean, selectedKeys: string[], onShowMenus: () => void, onHandleSubMenuClick: (category: Category, id: string) => void }) {
  const sideBarWidth = () => {
    return showMenuType ? 220 : 70;
  };

  const isCollapse = !showMenuType;

  return (
    <div
      className=" text-gray-300 text-center transition-all duration-300 h-screen overflow-hidden flex flex-col"
      style={{ width: sideBarWidth() }}
    >
      <Link href="/" className="text-lg p-5 text-white flex items-center justify-center cursor-pointer flex-shrink-0">
        <Image
          src={isCollapse ? "/logo-icon.png" : "/logo-nav.png"}
          alt="logo"
          width={isCollapse ? 45 : 180}
          height={40}
          className="icon-logo"
        />
      </Link>

      <div className="menu-side-bar flex-1 overflow-y-auto overflow-x-hidden">
        <Menu
          collapse={isCollapse}
          className="border-0 h-full"
          defaultSelectedKeys={[OVERVIEW._id]}
          onClickMenuItem={(...a) => {
            console.log("🚀 ~ e:", a)
          }}
        >
          <MenuStack menuList={categories} onHandleSubMenuItemClick={onHandleSubMenuClick} />
        </Menu>
      </div>

      <div className="sidebar-fix flex-shrink-0 mt-auto">
        <ul>
          <li className="item p-4 text-left cursor-pointer transition-colors flex-center" onClick={onShowMenus}>
            {isCollapse ? <IconMenuUnfold /> : <IconMenuFold />}
          </li>
        </ul>
      </div>
    </div>
  );
}
