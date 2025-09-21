'use client';

import { useEffect } from 'react';
import { useAtom } from 'jotai';
import { I18nextProvider } from 'react-i18next';
import AppNavMenus from '../AppNavMenus';
import AppHeader from '../AppHeader';
import Toolbar from '../Toolbar';
import AppLog from '../AppLog';
import api from '@/utils/api';
import i18n from '@/i18n';
import { categoriesAtom, showMenuTypeAtom, contentMarginLeftAtom, showLogAtom } from '@/store/store';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [categories, setCategories] = useAtom(categoriesAtom);
  const [showMenuType, setShowMenuType] = useAtom(showMenuTypeAtom);
  const [contentMarginLeft, setContentMarginLeft] = useAtom(contentMarginLeftAtom);
  const [showLog, setShowLog] = useAtom(showLogAtom);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const categoriesData = await api.getCategoryList();
        setCategories(categoriesData);
      } catch (error) {
        console.error("Failed to fetch categories", error);
      }
    };
    fetchData();
  }, [setCategories]);

  useEffect(() => {
    setContentMarginLeft(showMenuType ? '220px' : '70px');
  }, [setContentMarginLeft, showMenuType]);

  const toggleMenu = () => {
    setShowMenuType((prev) => !prev);
  };

  const handleSubMenuClick = async (id: string) => {
    // This is just for the layout, actual navigation would be handled by the page
    console.log('Sub menu clicked:', id);
  };

  return (
    <I18nextProvider i18n={i18n}>
      <div className="flex h-screen">
        {/* Sidebar */}
        <AppNavMenus
          onHandleSubMenuClick={handleSubMenuClick}
          categories={categories}
          showMenuType={showMenuType}
          onShowMenus={toggleMenu}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden" style={{ marginLeft: contentMarginLeft }}>
          {/* Sticky Header */}
          <AppHeader
            onHandleShowPopup={() => {}}
            onHandleShowMenu={toggleMenu}
          />

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
        </div>

        <Toolbar onShowLog={() => setShowLog(true)} />
        <AppLog show={showLog} onCloseLog={() => setShowLog(false)} />
      </div>
    </I18nextProvider>
  );
}