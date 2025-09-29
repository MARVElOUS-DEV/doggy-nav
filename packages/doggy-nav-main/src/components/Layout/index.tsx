import { useEffect, useTransition } from 'react';
import { useAtom } from 'jotai';
import { I18nextProvider } from 'react-i18next';
import AppNavMenus from '../AppNavMenus';
import AppHeader from '../AppHeader';
import i18n from '@/i18n';
import { showMenuTypeAtom, initAuthFromStorageAtom, mobileAtom } from '@/store/store';
import RightSideToolbar from '../RightSideToolbar';
import router from 'next/router';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [showMenuType, setShowMenuType] = useAtom(showMenuTypeAtom);
  const [, initAuth] = useAtom(initAuthFromStorageAtom);
  const [isMobile, setIsMobile] = useAtom(mobileAtom);
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

  //Check if screen is mobile/tablet for responsive behavior
  useEffect(() => {
    const checkScreenSize = () => {
      const isMobileScreen = window.innerWidth < 1024; // Tablet width threshold
      setIsMobile(isMobileScreen);
      setShowMenuType(isMobileScreen ? false: true);
    };

    if (typeof window !== 'undefined') {
      checkScreenSize();
    }
    window.addEventListener('resize', checkScreenSize);

    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleMenu = () => {
    // Only allow manual toggle on desktop, not on mobile/tablet
    if (!isMobile) {
      setShowMenuType((prev) => !prev);
    } else {
      // On mobile, always collapse the menu when the toggle button is clicked
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
            <AppHeader onHandleShowMenu={toggleMenu} />
          </div>

          {/* Scrollable Content Area with Glass Effect */}
          <div className="flex-1 overflow-y-auto bg-white bg-opacity-20 backdrop-filter backdrop-blur-lg backdrop-saturate-150">
            <div className="p-4">
              {children}
            </div>
          </div>
        </div>

        <RightSideToolbar />
      </div>
    </I18nextProvider>
  );
}