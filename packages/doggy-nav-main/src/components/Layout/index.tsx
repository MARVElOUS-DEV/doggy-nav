import { useEffect, useState } from 'react';
import { useAtom } from 'jotai';
import { I18nextProvider } from 'react-i18next';
import AppNavMenus from '../AppNavMenus';
import AppHeader from '../AppHeader';
import i18n from '@/i18n';
import { ConfigProvider, Drawer } from '@arco-design/web-react';
import {
  showMenuTypeAtom,
  initAuthFromServerAtom,
  mobileAtom,
  manualCollapseAtom,
  themeAtom,
} from '@/store/store';
import { useSetAtom } from 'jotai';
import RightSideToolbar from '../RightSideToolbar';
import LightbulbRope from '../LightbulbRope';
import router from 'next/router';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [showMenuType, setShowMenuType] = useAtom(showMenuTypeAtom);
  const initAuth = useSetAtom(initAuthFromServerAtom);
  const [isMobile, setIsMobile] = useAtom(mobileAtom);
  const [manualCollapse, setManualCollapse] = useAtom(manualCollapseAtom);
  const [theme] = useAtom(themeAtom);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Initialize auth state from server session
  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedManualCollapse = localStorage.getItem('manualCollapse');
      if (savedManualCollapse !== null) {
        setManualCollapse(savedManualCollapse === 'true');
      }
    }
  }, [setManualCollapse]);

  useEffect(() => {
    if (typeof window !== 'undefined' && manualCollapse !== null) {
      localStorage.setItem('manualCollapse', manualCollapse.toString());
    }
  }, [manualCollapse]);

  //Check if screen is mobile/tablet for responsive behavior
  useEffect(() => {
    const checkScreenSize = () => {
      const isMobileScreen = window.innerWidth < 1024; // Tablet width threshold
      setIsMobile(isMobileScreen);

      // Only auto-set menu state if no manual action has been taken
      // or if switching to mobile (always collapse on mobile)
      if (isMobileScreen) {
        setShowMenuType(false);
        setManualCollapse(null);
        setMobileMenuOpen(false);
      } else if (manualCollapse === null) {
        setShowMenuType(true);
      } else {
        setShowMenuType(manualCollapse);
      }
    };

    if (typeof window !== 'undefined') {
      checkScreenSize();
    }
    window.addEventListener('resize', checkScreenSize);

    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, [manualCollapse, setIsMobile, setShowMenuType, setManualCollapse]); // Include dependencies

  // Close mobile drawer on route change
  useEffect(() => {
    const handleRoute = () => setMobileMenuOpen(false);
    router.events?.on('routeChangeComplete', handleRoute);
    return () => {
      router.events?.off('routeChangeComplete', handleRoute);
    };
  }, []);

  const toggleMenu = () => {
    // Only allow manual toggle on desktop, not on mobile/tablet
    if (!isMobile) {
      const newState = !showMenuType;
      setShowMenuType(newState);
      setManualCollapse(newState);
    } else {
      setShowMenuType(false);
    }
  };

  return (
    <I18nextProvider i18n={i18n}>
      <ConfigProvider componentConfig={{ Menu: { theme } }}>
        <div className="flex h-screen">
          {/* Sidebar (desktop only) */}
          {!isMobile && (
            <div
              className="bg-theme-background transition-all duration-300 flex flex-col overflow-hidden border-r border-theme-border"
              style={{ width: showMenuType ? 220 : 70 }}
            >
              <AppNavMenus showMenuType={showMenuType} onShowMenus={toggleMenu} />
            </div>
          )}

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Sticky Header */}
            <div className="sticky top-0 z-30">
              <AppHeader
                onHandleShowMenu={toggleMenu}
                showMenuType={showMenuType}
                onOpenMobileMenu={() => setMobileMenuOpen(true)}
              />
            </div>

            {/* Scrollable Content Area with Glass Effect */}
            <div
              id="doggy-content-area"
              className="flex-1 overflow-y-auto glass-light dark:glass-dark"
            >
              <div className="p-4">
                <div className="min-h-screen bg-theme-background transition-colors">{children}</div>
              </div>
            </div>
          </div>

          <RightSideToolbar />
          <LightbulbRope />

          {/* Mobile Menu Drawer */}
          {isMobile && (
            <Drawer
              visible={mobileMenuOpen}
              unmountOnExit
              closeIcon={null}
              placement="left"
              width="100%"
              onCancel={() => setMobileMenuOpen(false)}
            >
              <div className="h-full">
                <AppNavMenus showMenuType={true} />
              </div>
            </Drawer>
          )}
        </div>
      </ConfigProvider>
    </I18nextProvider>
  );
}
