import Link from 'next/link';
import Image from 'next/image';
import { Languages, Palette, Search as SearchIcon } from 'lucide-react';
import { Tooltip, Button, Dropdown, Menu } from '@arco-design/web-react';
import Search from '../Search';
import LanguageSwitcher from '../LanguageSwitcher';
import ThemeToggle from '../Buttons/ThemeToggle';
import UserAvatar from '../Avatar';
import { useTranslation } from 'react-i18next';
import {
  IconPlusCircle,
  IconMenuFold,
  IconMenuUnfold,
  IconMenu,
} from '@arco-design/web-react/icon';
import { isFeatureEnabled } from '@/config/featureFlags';
import ReactIf from '../ReactIf';
import { useRouter } from 'next/router';
import { useAtom } from 'jotai';
import { searchModalOpenAtom } from '@/store/store';
import { useSiteSettings } from '@/context/SiteSettingsContext';
import { useEffect, useState } from 'react';

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
  const [showSearch, setShowSearch] = useAtom(searchModalOpenAtom);
  const router = useRouter();
  const { siteSettings, resolvedSiteSettings } = useSiteSettings();
  const [logoLoadFailed, setLogoLoadFailed] = useState(false);

  useEffect(() => {
    setLogoLoadFailed(false);
  }, [siteSettings?.logoUrl]);

  useEffect(() => {
    const openSearch = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setShowSearch(true);
      }
    };

    document.addEventListener('keydown', openSearch);
    return () => document.removeEventListener('keydown', openSearch);
  }, [setShowSearch]);

  const hasCustomLogo = Boolean(siteSettings?.logoUrl) && !logoLoadFailed;
  const showCustomTitle = Boolean(siteSettings?.siteTitle?.trim());

  const renderFallbackLogo = () => (
    <>
      <Image
        src="/logo-nav-black.png"
        alt={resolvedSiteSettings.siteTitle}
        width={150}
        height={40}
        priority
        className="dark:hidden hidden lg:block transition-all duration-200 h-12"
      />
      <Image
        src="/logo-nav-black.png"
        alt={resolvedSiteSettings.siteTitle}
        width={100}
        height={30}
        priority
        className="dark:hidden lg:hidden transition-all duration-200"
      />
      <Image
        src="/logo-nav-white.png"
        alt={resolvedSiteSettings.siteTitle}
        width={150}
        height={40}
        priority
        className="hidden dark:lg:block transition-all duration-200 h-12"
      />
      <Image
        src="/logo-nav-white.png"
        alt={resolvedSiteSettings.siteTitle}
        width={100}
        height={30}
        priority
        className="dark:block hidden lg:hidden transition-all duration-200"
      />
    </>
  );

  const mobileDropdownMenu = (
    <Menu onClickMenuItem={(key) => key !== 'theme'}>
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
          <div className="flex items-center justify-between gap-3 py-1">
            <div className="flex items-center min-w-0">
              <Languages className="text-lg mr-3 text-theme-muted-foreground" size={18} />
              <span className="text-theme-foreground">{t('language')}</span>
            </div>
            <LanguageSwitcher variant="compact" />
          </div>
        </Menu.Item>
      )}
      <Menu.Item key="theme">
        <div className="flex items-center justify-between gap-3 py-1">
          <div className="flex items-center min-w-0">
            <Palette className="text-lg mr-3 text-theme-muted-foreground" size={18} />
            <span className="text-theme-foreground">{t('theme')}</span>
          </div>
          <ThemeToggle variant="compact" />
        </div>
      </Menu.Item>
      <UserAvatar asMenuItems />
    </Menu>
  );

  return (
    <>
      <header className="app-header flex justify-between items-center glass-medium shadow-lg p-4 w-full sticky top-0 z-50 min-h-[80px] border-b border-theme-border">
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
            {hasCustomLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={siteSettings?.logoUrl || ''}
                alt={resolvedSiteSettings.siteTitle}
                className="h-10 w-auto max-w-[150px] object-contain transition-all duration-200 lg:h-12"
                onError={() => setLogoLoadFailed(true)}
              />
            ) : (
              renderFallbackLogo()
            )}
            {showCustomTitle ? (
              <span className="ml-3 hidden text-lg font-semibold tracking-tight text-theme-foreground sm:inline-block">
                {resolvedSiteSettings.siteTitle}
              </span>
            ) : null}
          </Link>
        </div>

        <div className="hidden lg:block flex-1" />

        {/* Desktop Actions */}
        <div className="hidden lg:flex items-center space-x-2">
          <Tooltip content={t('search_shortcut_tooltip')}>
            <Button
              aria-label={t('search_shortcut_tooltip')}
              className="app-header-action cursor-pointer !flex h-10 min-w-14 items-center justify-center px-2"
              onClick={() => setShowSearch(true)}
            >
              <kbd className="pointer-events-none flex items-center gap-1 font-sans text-xs font-semibold text-theme-muted-foreground">
                <span className="text-base leading-none">⌘</span>
                <span>K</span>
              </kbd>
            </Button>
          </Tooltip>

          <Tooltip content={t('recommend_site')}>
            <Link
              href="/recommend"
              className="app-header-action text-2xl !flex items-center justify-center w-8 h-8 mr-0"
            >
              <IconPlusCircle style={{ width: 20, height: 20 }} />
            </Link>
          </Tooltip>

          {/* Language Switcher */}
          {/** @ts-ignore */}
          <ReactIf condition={isFeatureEnabled('lang_switch')}>
            <LanguageSwitcher />
          </ReactIf>

          <Tooltip content={t('open_theme_settings')}>
            <div className="mr-1">
              <ThemeToggle />
            </div>
          </Tooltip>

          {/* User Avatar */}
          <UserAvatar />
        </div>

        {/* Mobile Dropdown Menu (actions) */}
        <div className="lg:hidden flex items-center">
          <Dropdown
            droplist={mobileDropdownMenu}
            trigger="click"
            position="br"
            unmountOnExit={false}
          >
            <Button
              className="app-header-action p-2"
              icon={<IconMenu />}
              type="text"
              size="large"
            />
          </Dropdown>
        </div>
      </header>

      {showSearch && <Search onClose={() => setShowSearch(false)} />}
    </>
  );
}
