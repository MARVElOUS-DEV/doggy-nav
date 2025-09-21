import Link from 'next/link';
import Image from 'next/image';
import { Tooltip } from '@arco-design/web-react';
import AppSearch from './AppSearch';
import LanguageSwitcher from './LanguageSwitcher';
import ThemeToggle from './ThemeToggle';
import { useTranslation } from 'react-i18next';

interface AppHeaderProps {
  onHandleShowMenu: () => void;
  onHandleShowPopup: () => void;
}

export default function AppHeader({ onHandleShowMenu, onHandleShowPopup }: AppHeaderProps) {
  const { t } = useTranslation('translation');

  return (
    <header className="flex justify-between items-center bg-white sticky top-0 z-10 shadow-md p-4">
      <div className="flex items-center">
        <Link href="/">
          <Image src="/logo-nav.png" alt="logo" width={150} height={40} className="filter invert" />
        </Link>
        <AppSearch />
      </div>
      <div className="flex items-center">
        <Tooltip content={t('recommend_site')}>
          <Link href="/recommend" className="text-2xl ml-8 text-gray-500 cursor-pointer">
            <i className="el-icon-circle-plus"></i>
          </Link>
        </Tooltip>
        <div className="ml-4">
          <LanguageSwitcher />
        </div>
        <div className="ml-2">
          <ThemeToggle />
        </div>
        <div className="menu-toggle-btn md:hidden">
          <i className="el-icon-menu text-2xl ml-8 text-gray-500 cursor-pointer" onClick={onHandleShowMenu}></i>
        </div>
      </div>
    </header>
  );
}
