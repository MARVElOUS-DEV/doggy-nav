import Link from 'next/link';
import { Menu } from '@arco-design/web-react';
import { Category } from '@/types';
import MenuStack from './MenuStack';
import { localCategories, OVERVIEW } from '@/utils/localCategories';
import { categoriesAtom, selectedCategoryAtom, tagsAtom } from '@/store/store';
import { useAtom, useSetAtom } from 'jotai';
import router from 'next/router';
import api from '@/utils/api';
import { useEffect } from 'react';


export default function AppNavMenus({ showMenuType, onShowMenus }: { showMenuType: boolean, onShowMenus: () => void }) {
  const [selectedCategory, setSelectedCategory] = useAtom(selectedCategoryAtom);
  const [categories, setCategories] = useAtom(categoriesAtom);
  const setTags = useSetAtom(tagsAtom);
  const isCollapse = !showMenuType;
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
  }, [selectedCategory]); // eslint-disable-line react-hooks/exhaustive-deps
  const onHandleSubMenuClick = async (category: Category, id: string) => {
    setSelectedCategory(id);
    router.push(category.href?? `/navcontents?category=${id}`);
  };
  return (
    <div className="h-full flex flex-col overflow-hidden bg-gradient-to-b from-blue-50 to-indigo-50 text-gray-800">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-blue-200 flex items-center justify-center">
        <Link href="/" className="flex items-center space-x-3 text-lg font-bold hover:text-blue-600 transition-colors">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-2 rounded-lg shadow-sm">
            <span className="text-white font-bold">DN</span>
          </div>
          {!isCollapse && <span className="text-xl text-gray-800 font-semibold">DoggyNav</span>}
        </Link>
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-4">
        <Menu
          collapse={isCollapse}
          className="border-0 bg-transparent text-gray-700"
          selectedKeys={selectedCategory ? [selectedCategory] : [OVERVIEW.id]}
          // style={{ backgroundColor: 'transparent' }}
        >
          <MenuStack menuList={categories} onHandleSubMenuItemClick={onHandleSubMenuClick} />
        </Menu>
      </div>

      {/* Sidebar Footer */}
      {!isCollapse && (
        <div className="p-4 border-t border-blue-200 text-xs text-gray-500">
          <p className="text-center">© {new Date().getFullYear()} DoggyNav</p>
        </div>
      )}
    </div>
  );
}
