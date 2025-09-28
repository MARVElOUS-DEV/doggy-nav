'use client';

import { useEffect, useState } from 'react';
import { useAtom, useSetAtom, Provider as JotaiProvider } from 'jotai';
import { I18nextProvider } from 'react-i18next';
import { useRouter } from 'next/router';
import AppNavMenus from '../AppNavMenus';
import AppHeader from '../AppHeader';
import Toolbar from '../Toolbar';
import AppLog from '../AppLog';
import api from '@/utils/api';
import i18n from '@/i18n';
import { categoriesAtom, showMenuTypeAtom, showLogAtom, selectedCategoryAtom, tagsAtom, initAuthFromStorageAtom } from '@/store/store';
import { Category } from '@/types';
import { localCategories } from '@/utils/localCategories';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [categories, setCategories] = useAtom(categoriesAtom);
  const [showMenuType, setShowMenuType] = useAtom(showMenuTypeAtom);
  const [showLog, setShowLog] = useAtom(showLogAtom);
  const [selectedCategory, setSelectedCategory] = useAtom(selectedCategoryAtom);
  const setTags = useSetAtom(tagsAtom);
  const [, initAuth] = useAtom(initAuthFromStorageAtom);
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);

  // Initialize auth state from localStorage
  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // Check if screen is mobile/tablet for responsive behavior
  useEffect(() => {
    const checkScreenSize = () => {
      const isMobileScreen = window.innerWidth < 1024; // Tablet width threshold
      setIsMobile(isMobileScreen);

      // Automatically collapse menu on mobile/tablet screens
      if (isMobileScreen) {
        setShowMenuType(false);
      } else {
        // On desktop, restore the menu to open state
        setShowMenuType(true);
      }
    };

    // Check screen size on initial load
    if (typeof window !== 'undefined') {
      checkScreenSize();
    }

    // Add resize listener
    window.addEventListener('resize', checkScreenSize);

    // Clean up listener on unmount
    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, [setShowMenuType]);

  // Fetch categories and tags on layout initialization
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesData = await api.getCategoryList();
        if (Array.isArray(categoriesData)) {
          categoriesData.unshift(...localCategories)
          if (!selectedCategory) {
            setSelectedCategory(categoriesData[0].id);
          }
          setCategories(categoriesData);
        }
      } catch (error) {
        console.error("Failed to fetch categories", error);
      }
    };

    const fetchTags = async () => {
      try {
        const { data } = await api.getTagList();
        const options = data?.map((item) => {
          item.value = item.name;
          item.label = item.name;
          return item;
        }) || [];
        setTags(options);
      } catch (error) {
        console.error("Failed to fetch tags", error);
      }
    };
    if (!selectedCategory) {
      fetchCategories();
      fetchTags();
    }
  }, [setCategories, setSelectedCategory, selectedCategory, setTags]);


  const toggleMenu = () => {
    // Only allow manual toggle on desktop, not on mobile/tablet
    if (!isMobile) {
      setShowMenuType((prev) => !prev);
    } else {
      // On mobile, always collapse the menu when the toggle button is clicked
      setShowMenuType(false);
    }
  };

  const handleSubMenuClick = async (category: Category, id: string) => {
    setSelectedCategory(id);
    router.push(category.href?? `/navcontents?category=${id}`);
  };

  return (
    <I18nextProvider i18n={i18n}>
      <JotaiProvider>
        <div className="flex h-screen">
          {/* Sidebar - positioned as flex item */}
          <div
            className="bg-gray-800 text-white transition-all duration-300 flex flex-col overflow-hidden"
            style={{ width: showMenuType ? 220 : 70 }}
          >
            <AppNavMenus
              onHandleSubMenuClick={handleSubMenuClick}
              categories={categories}
              showMenuType={showMenuType}
              onShowMenus={toggleMenu}
            />
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Sticky Header */}
            <div className="sticky top-0 z-30">
              <AppHeader
                onHandleShowPopup={() => {}}
                onHandleShowMenu={toggleMenu}
              />
            </div>

            {/* Scrollable Content Area with Glass Effect */}
            <div className="flex-1 overflow-y-auto bg-white bg-opacity-20 backdrop-filter backdrop-blur-lg backdrop-saturate-150">
              <div className="p-4">
                {children}
              </div>
            </div>
          </div>

          <Toolbar onShowLog={() => setShowLog(true)} />
          <AppLog show={showLog} onCloseLog={() => setShowLog(false)} />
        </div>
      </JotaiProvider>
    </I18nextProvider>
  );
}