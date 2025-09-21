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
import { categoriesAtom, showMenuTypeAtom, contentMarginLeftAtom, showLogAtom, selectedCategoryAtom, tagsAtom } from '@/store/store';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [categories, setCategories] = useAtom(categoriesAtom);
  const [showMenuType, setShowMenuType] = useAtom(showMenuTypeAtom);
  const [contentMarginLeft, setContentMarginLeft] = useAtom(contentMarginLeftAtom);
  const [showLog, setShowLog] = useAtom(showLogAtom);
  const [selectedCategory, setSelectedCategory] = useAtom(selectedCategoryAtom);
  const [tags, setTags] = useAtom(tagsAtom);

  // Fetch categories and tags on layout initialization
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesData = await api.getCategoryList();
        setCategories(categoriesData);
        // Set the first category as default selected category if none is selected
        if (categoriesData.length && !selectedCategory) {
          setSelectedCategory(categoriesData[0]._id);
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

    fetchCategories();
    fetchTags();
  }, [setCategories, setSelectedCategory, selectedCategory, setTags]);

  useEffect(() => {
    setContentMarginLeft(showMenuType ? '220px' : '70px');
  }, [setContentMarginLeft, showMenuType]);

  const toggleMenu = () => {
    setShowMenuType((prev) => !prev);
  };

  const handleSubMenuClick = async (parentId: string, id: string) => {
    // Set the selected category to trigger data fetch in HomePage
    setSelectedCategory(id);
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