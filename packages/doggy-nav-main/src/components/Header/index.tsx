import Link from 'next/link';
import Image from 'next/image';
import { Search as SearchIcon } from 'lucide-react';
import { Tooltip, Button, Dropdown, Menu } from '@arco-design/web-react';
import Search from '../Search';
import LanguageSwitcher from '../LanguageSwitcher';
import ThemeToggle from '../Buttons/ThemeToggle';
import UserAvatar from '../Avatar';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import {
  IconPlusCircle,
  IconMenuFold,
  IconMenuUnfold,
  IconMenu,
  IconSearch,
} from '@arco-design/web-react/icon';
import { isFeatureEnabled } from '@/config/featureFlags';
import ReactIf from '../ReactIf';
import { useRouter } from 'next/router';

interface AppHeaderProps {
  onHandleShowMenu: () => void;
  showMenuType?: boolean;
  onOpenMobileMenu?: () => void;
}

export default function AppHeader({
  onHandleShowMenu,
  showMenuType = false,
  onOpenMobileMenu,
}: AppHeaderProps) {
  const { t } = useTranslation('translation');
  const [showSearch, setShowSearch] = useState(false);
  const router = useRouter();

  const mobileDropdownMenu = (
    <Menu>
      <Menu.Item key="search" onClick={() => setShowSearch(!showSearch)}>
        <div className="flex items-center py-1">
          <SearchIcon className="text-lg mr-3 text-theme-muted-foreground" size={18} />
          <span className="text-theme-foreground">{t('search')}</span>
        </div>
      </Menu.Item>
      <Menu.Item key="recommend" onClick={() => router.push('/recommend')}>
        <div className="flex items-center py-1">
          <IconPlusCircle className="text-lg mr-3 text-theme-muted-foreground" />
          <span className="text-theme-foreground">{t('recommend_site')}</span>
        </div>
      </Menu.Item>
      {isFeatureEnabled('lang_switch') && (
        <Menu.Item key="language">
          <div className="flex items-center justify-between py-1">
            <span className="mr-3 text-theme-foreground">{t('language')}</span>
            <LanguageSwitcher />
          </div>
        </Menu.Item>
      )}
      <Menu.Item key="theme">
        <div className="flex items-center justify-between py-1">
          <span className="mr-3 text-theme-foreground">{t('theme')}</span>
          <ThemeToggle />
        </div>
      </Menu.Item>
      <UserAvatar asMenuItems />
    </Menu>
  );

  return (
    <header className="flex justify-between items-center glass-medium shadow-lg p-4 w-full sticky top-0 z-50 min-h-[80px] border-b border-theme-border">
      <div className="flex items-center">
        {/* Menu Toggle Button (desktop only) */}
        <div className="hidden lg:block">
          <Tooltip content={showMenuType ? t('collapse_menu') : t('expand_menu')}>
            <Button
              className="app-header-action mr-2 md:mr-3 p-2"
              onClick={onHandleShowMenu}
              icon={showMenuType ? <IconMenuFold /> : <IconMenuUnfold />}
              type="text"
              size="large"
            />
          </Tooltip>
        </div>

        {/* Mobile: Open full menu drawer on the left */}
        <div className="lg:hidden">
          <Tooltip content={t('expand_menu')}>
            <Button
              className="app-header-action mr-2 p-2"
              onClick={() => onOpenMobileMenu?.()}
              icon={<IconMenuUnfold />}
              type="text"
              size="large"
            />
          </Tooltip>
        </div>

        <Link href="/" className="flex items-center">
          <Image
            src="/logo-nav-black.png"
            alt="logo"
            width={150}
            height={40}
            priority
            className="dark:hidden hidden lg:block transition-all duration-200 h-12"
          />
          <Image
            src="/logo-nav-black.png"
            alt="logo"
            width={100}
            height={30}
            priority
            className="dark:hidden lg:hidden transition-all duration-200"
          />
          <Image
            src="/logo-nav-white.png"
            alt="logo"
            width={150}
            height={40}
            priority
            className="hidden dark:lg:block transition-all duration-200 h-12"
          />
          <Image
            src="/logo-nav-white.png"
            alt="logo"
            width={100}
            height={30}
            priority
            className="dark:block hidden lg:hidden transition-all duration-200"
          />
        </Link>
      </div>

      {/* Desktop Search Bar */}
      <div className="hidden lg:flex items-center flex-1 max-w-2xl mx-8 h-12">
        {showSearch ? (
          <Search onClose={() => setShowSearch(false)} />
        ) : (
          <Button
            className="bg-theme-background header-search-btn w-full h-12 rounded-2xl transition-all shadow-sm hover:shadow-md"
            onClick={() => setShowSearch(true)}
          >
            <div className="flex items-center justify-center">
              <SearchIcon className="mr-2 text-lg" size={18} />
              <span>{t('search_placeholder')}</span>
            </div>
          </Button>
        )}
      </div>

      {/* Mobile Search Overlay */}
      {showSearch && (
        <div className="lg:hidden fixed inset-0 bg-theme-background z-50 p-4">
          <Search onClose={() => setShowSearch(false)} />
        </div>
      )}

      {/* Desktop Actions */}
      <div className="hidden lg:flex items-center space-x-2">
        <Tooltip content={t('recommend_site')}>
          <Link
            href="/recommend"
            className="app-header-action text-2xl !flex items-center justify-center w-8 h-8 mr-0"
          >
            <IconPlusCircle style={{ width: 20, height: 20 }} />
          </Link>
        </Tooltip>

        <Tooltip content={t('search_tooltip')}>
          <Button
            className="app-header-action text-2xl cursor-pointer !flex items-center justify-center w-10 h-10"
            onClick={() => setShowSearch(!showSearch)}
            icon={<IconSearch style={{ height: 20, width: 20 }} />}
          />
        </Tooltip>
        {/* Language Switcher */}
        {/** @ts-ignore */}
        <ReactIf condition={isFeatureEnabled('lang_switch')}>
          <LanguageSwitcher />
        </ReactIf>
        <div className="mr-1">
          <ThemeToggle />
        </div>

        {/* User Avatar */}
        <UserAvatar />
      </div>

      {/* Mobile Dropdown Menu (actions) */}
      <div className="lg:hidden flex items-center">
        <Dropdown droplist={mobileDropdownMenu} trigger="click" position="br">
          <Button className="app-header-action p-2" icon={<IconMenu />} type="text" size="large" />
        </Dropdown>
      </div>
    </header>
  );
}
