import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, Layout } from '@arco-design/web-react';
import { Category } from '@/types';
import MenuStack from './MenuStack';

const { Sider } = Layout;


export default function AppNavMenus({ categories, showMenuType, onShowMenus, onHandleSubMenuClick }: { categories: Category[], showMenuType: string, onShowMenus: () => void, onHandleSubMenuClick: (parentId: string, id: string) => void }) {
  const [defaultActive, setDefaultActive] = useState('0-0');

  const sideBarWidth = () => {
    if (showMenuType === 'half') {
      return 70;
    } else if (showMenuType === 'all') {
      return 220;
    } else {
      return 0;
    }
  };

  const isCollapse = showMenuType === 'half';

  return (
    <Sider
      width={sideBarWidth()}
      className="bg-blue-500 text-gray-300 text-center transition-all duration-500 z-50 fixed top-0 left-0 bottom-0 overflow-hidden"
    >
      <Link href="/" className="text-lg p-5 text-white flex items-center justify-center cursor-pointer">
        <Image
          src={isCollapse ? "/logo-icon.png" : "/logo-nav.png"}
          alt="logo"
          width={isCollapse ? 45 : 180}
          height={40}
          className="icon-logo"
        />
      </Link>

      <div className="menu-side-bar h-full overflow-y-auto overflow-x-hidden">
        <Menu
          defaultOpenKeys={[defaultActive]}
          collapse={isCollapse}
          className="bg-blue-500 border-0"
        >
          <MenuStack menuList={categories} onHandleSubMenuItemClick={onHandleSubMenuClick} />
        </Menu>
      </div>

      <div className="sidebar-fix absolute left-0 bottom-0 w-full">
        <ul>
          <li className="item p-4 text-left cursor-pointer bg-blue-500" onClick={onShowMenus}>
            <i className={`text-xl text-white ${isCollapse ? 'el-icon-s-unfold' : 'el-icon-s-fold'}`}></i>
          </li>
        </ul>
      </div>
    </Sider>
  );
}
