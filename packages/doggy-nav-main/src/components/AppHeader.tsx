import Link from 'next/link';
import Image from 'next/image';
import { Tooltip, Button, Dropdown, Menu } from '@arco-design/web-react';
import Search from './Search';
import LanguageSwitcher from './LanguageSwitcher';
import ThemeToggle from './ThemeToggle';
import UserAvatar from './UserAvatar';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { IconPlusCircle, IconMenuFold, IconMenuUnfold, IconMenu } from '@arco-design/web-react/icon';
import { isFeatureEnabled } from '@/config/featureFlags';
import ReactIf from './ReactIf';
import { useRouter } from 'next/router';

interface AppHeaderProps {
  onHandleShowMenu: () => void;
  showMenuType?: boolean;
}

export default function AppHeader({ onHandleShowMenu, showMenuType = false }: AppHeaderProps) {
  const { t } = useTranslation('translation');
  const [showSearch, setShowSearch] = useState(false);
  const router = useRouter();

  const mobileDropdownMenu = (
    <Menu>
      <Menu.Item key="search" onClick={() => setShowSearch(!showSearch)}>
        <div className="flex items-center py-1">
          <i className="iconfont icon-search text-lg mr-3"></i>
          <span>{t('search', '搜索')}</span>
        </div>
      </Menu.Item>
      <Menu.Item key="recommend" onClick={() => router.push('/recommend')}>
        <div className="flex items-center py-1">
          <IconPlusCircle className="text-lg mr-3" />
          <span>{t('recommend_site')}</span>
        </div>
      </Menu.Item>
      {isFeatureEnabled('lang_switch') && (
        <Menu.Item key="language">
          <div className="flex items-center justify-between py-1">
            <span className="mr-3">{t('language', '语言')}</span>
            <LanguageSwitcher />
          </div>
        </Menu.Item>
      )}
      <Menu.Item key="theme">
        <div className="flex items-center justify-between py-1">
          <span className="mr-3">{t('theme', '主题')}</span>
          <ThemeToggle />
        </div>
      </Menu.Item>
      <Menu.Item key="profile">
        <div className="flex items-center py-1">
          <span className="mr-3">{t('profile', '个人中心')}</span>
          <UserAvatar />
        </div>
      </Menu.Item>
    </Menu>
  );

  return (
    <header className="flex justify-between items-center bg-theme-card shadow-lg p-4 w-full sticky top-0 z-50 bg-gradient-to-r from-white to-blue-50 dark:from-neutral-900 dark:to-neutral-800 min-h-[80px] border-b border-theme-border transition-colors duration-200">
      <div className="flex items-center">
        {/* Menu Toggle Button */}
        <Tooltip content={showMenuType ? t('collapse_menu', 'Collapse Menu') : t('expand_menu', 'Expand Menu')}>
          <Button
            className="mr-2 md:mr-3 text-theme-muted-foreground hover:text-theme-primary p-2 rounded hover:bg-theme-muted transition-colors"
            onClick={onHandleShowMenu}
            icon={showMenuType ? <IconMenuFold /> : <IconMenuUnfold />}
            type="text"
            size="large"
          />
        </Tooltip>

        <Link href="/" className="flex items-center">
          <Image
            src="/logo-nav-black.png"
            alt="logo"
            width={150}
            height={40}
            className="dark:invert hidden md:block transition-all duration-200"
          />
          <Image
            src="/logo-nav-black.png"
            alt="logo"
            width={100}
            height={30}
            className="dark:invert md:hidden transition-all duration-200"
          />
        </Link>
      </div>

      {/* Desktop Search Bar */}
      <div className="hidden md:flex items-center flex-1 max-w-2xl mx-8 h-12">
        {showSearch ? (
          <Search onClose={() => setShowSearch(false)} />
        ) : (
          <Button
            className="w-full h-12 text-theme-muted-foreground rounded-2xl border-2 border-dashed border-theme-border hover:border-theme-primary transition-all bg-theme-card shadow-sm hover:shadow-md"
            onClick={() => setShowSearch(true)}
          >
            <div className="flex items-center justify-center text-theme-muted-foreground">
              <i className="iconfont icon-search mr-2 text-lg"></i>
            <span>搜索网站...</span>
            </div>
          </Button>
        )}
      </div>

      {/* Mobile Search Overlay */}
      {showSearch && (
        <div className="md:hidden fixed inset-0 bg-theme-background z-50 p-4">
          <Search onClose={() => setShowSearch(false)} />
        </div>
      )}

      {/* Desktop Actions */}
      <div className="hidden md:flex items-center space-x-4">
        <Tooltip content={t('recommend_site')}>
          <Link
            href="/recommend"
            className="text-2xl text-theme-muted-foreground hover:text-theme-primary transition-colors duration-200 flex items-center justify-center w-10 h-10 rounded-full hover:bg-theme-muted"
          >
            <IconPlusCircle />
          </Link>
        </Tooltip>

        <Tooltip content="搜索网站">
          <button
            className="text-2xl cursor-pointer text-theme-muted-foreground hover:text-theme-primary transition-colors duration-200 flex items-center justify-center w-10 h-10 rounded-full hover:bg-theme-muted"
            onClick={() => setShowSearch(!showSearch)}
          >
            <i className="iconfont icon-search"></i>
          </button>
        </Tooltip>
        {/* Language Switcher */}
        {/** @ts-ignore */}
        <ReactIf condition={isFeatureEnabled('lang_switch')} >
          <div className="ml-1">
            <LanguageSwitcher />
          </div>
        </ReactIf>
        <div className="ml-1">
          <ThemeToggle />
        </div>

        {/* User Avatar */}
        <div className="ml-3">
          <UserAvatar />
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      <div className="md:hidden flex items-center">
        <Dropdown droplist={mobileDropdownMenu} trigger="click" position="br">
          <Button
            className="text-theme-muted-foreground hover:text-theme-primary p-2 rounded hover:bg-theme-muted transition-colors"
            icon={<IconMenu />}
            type="text"
            size="large"
          />
        </Dropdown>
      </div>
    </header>
  );
}
