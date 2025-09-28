import Link from 'next/link';
import Image from 'next/image';
import { Tooltip, Button } from '@arco-design/web-react';
import AppSearch from './AppSearch';
import LanguageSwitcher from './LanguageSwitcher';
import ThemeToggle from './ThemeToggle';
import UserAvatar from './UserAvatar';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { IconPlusCircle } from '@arco-design/web-react/icon';

interface AppHeaderProps {
  onHandleShowMenu: () => void;
}

export default function AppHeader({ onHandleShowMenu }: AppHeaderProps) {
  const { t } = useTranslation('translation');
  const [showSearch, setShowSearch] = useState(false);

  return (
    <header className="flex justify-between items-center bg-white shadow-lg p-4 w-full sticky top-0 z-50 bg-gradient-to-r from-white to-blue-50 min-h-[80px]">
      <div className="flex items-center">
        <Link href="/" className="flex items-center">
          <Image
            src="/logo-nav-black.png"
            alt="logo"
            width={150}
            height={40}
            className="filter dark:filter-none"
          />
        </Link>
      </div>

      <div className="flex items-center flex-1 max-w-2xl mx-8 h-12">
        {showSearch ? (
          <AppSearch onClose={() => setShowSearch(false)} />
        ) : (
          <Button
            className="w-full h-12 text-gray-500 rounded-2xl border-2 border-dashed border-gray-300 hover:border-blue-400 transition-all bg-white shadow-sm hover:shadow-md"
            onClick={() => setShowSearch(true)}
          >
            <div className="flex items-center justify-center text-gray-400">
              <i className="iconfont icon-search mr-2 text-lg"></i>
              <span>搜索网站...</span>
            </div>
          </Button>
        )}
      </div>

      <div className="flex items-center space-x-4">
        <Tooltip content={t('recommend_site')}>
          <Link
            href="/recommend"
            className="text-2xl text-gray-600 hover:text-blue-600 transition-colors duration-200 flex items-center justify-center w-10 h-10 rounded-full hover:bg-blue-50"
          >
            <IconPlusCircle />
          </Link>
        </Tooltip>

        <Tooltip content="搜索网站">
          <button
            className="text-2xl text-gray-600 hover:text-blue-600 transition-colors duration-200 flex items-center justify-center w-10 h-10 rounded-full hover:bg-blue-50"
            onClick={() => setShowSearch(!showSearch)}
          >
            <i className="iconfont icon-search"></i>
          </button>
        </Tooltip>

        <div className="ml-1">
          <LanguageSwitcher />
        </div>
        <div className="ml-1">
          <ThemeToggle />
        </div>

        {/* User Avatar */}
        <div className="ml-3">
          <UserAvatar />
        </div>

        <div className="menu-toggle-btn md:hidden ml-2">
          <button
            className="text-2xl text-gray-600 hover:text-blue-600 transition-colors duration-200 flex items-center justify-center w-10 h-10 rounded-full hover:bg-blue-50"
            onClick={onHandleShowMenu}
          >
            <i className="el-icon-menu"></i>
          </button>
        </div>
      </div>
    </header>
  );
}
