import { useEffect, useTransition } from 'react';
import { useAtom } from 'jotai';
import { I18nextProvider } from 'react-i18next';
import AppNavMenus from '../AppNavMenus';
import AppHeader from '../AppHeader';
import i18n from '@/i18n';
import { showMenuTypeAtom, initAuthFromStorageAtom, mobileAtom, manualCollapseAtom } from '@/store/store';
import RightSideToolbar from '../RightSideToolbar';
import LightbulbRope from '../LightbulbRope';
import router from 'next/router';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [showMenuType, setShowMenuType] = useAtom(showMenuTypeAtom);
  const [, initAuth] = useAtom(initAuthFromStorageAtom);
  const [isMobile, setIsMobile] = useAtom(mobileAtom);
  const [manualCollapse, setManualCollapse] = useAtom(manualCollapseAtom);
  const [isPending, startTransition] = useTransition()
  
  const handleNavigation = (href) => {
    startTransition(() => {
      router.push(href)
    })
  }
  // Initialize auth state from localStorage
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
      <div className="flex h-screen">
        {/* Sidebar - positioned as flex item */}
        <div
          className="bg-gray-800 text-white transition-all duration-300 flex flex-col overflow-hidden"
          style={{ width: showMenuType ? 220 : 70 }}
        >
          <AppNavMenus
            showMenuType={showMenuType}
            onShowMenus={toggleMenu}
          />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Sticky Header */}
          <div className="sticky top-0 z-30">
            <AppHeader onHandleShowMenu={toggleMenu} showMenuType={showMenuType} />
          </div>

          {/* Scrollable Content Area with Glass Effect */}
          <div id="doggy-content-area" className="flex-1 overflow-y-auto bg-white bg-opacity-20 backdrop-filter backdrop-blur-lg backdrop-saturate-150">
            <div className="p-4">
              {children}
            </div>
          </div>
        </div>

        <RightSideToolbar />
        <LightbulbRope />
      </div>
    </I18nextProvider>
  );
}