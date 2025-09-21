import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu } from '@arco-design/web-react';
import { Category } from '@/types';
import MenuStack from './MenuStack';


export default function AppNavMenus({ categories, showMenuType, onShowMenus, onHandleSubMenuClick }: { categories: Category[], showMenuType: boolean, onShowMenus: () => void, onHandleSubMenuClick: (parentId: string, id: string) => void }) {
  const sideBarWidth = () => {
    return showMenuType ? 220 : 70;
  };

  const isCollapse = !showMenuType;

  return (
    <div
      className="bg-blue-500 text-gray-300 text-center transition-all duration-300 z-50 fixed top-0 left-0 h-screen overflow-hidden flex flex-col"
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
          className="bg-blue-500 border-0 h-full"
        >
          <MenuStack menuList={categories} onHandleSubMenuItemClick={onHandleSubMenuClick} />
        </Menu>
      </div>

      <div className="sidebar-fix flex-shrink-0 mt-auto">
        <ul>
          <li className="item p-4 text-left cursor-pointer bg-blue-500 hover:bg-blue-600 transition-colors" onClick={onShowMenus}>
            <i className={`text-xl text-white ${isCollapse ? 'el-icon-s-unfold' : 'el-icon-s-fold'}`}></i>
          </li>
        </ul>
      </div>
    </div>
  );
}
