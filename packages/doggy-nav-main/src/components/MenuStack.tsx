import { Menu } from '@arco-design/web-react';
import { Category } from '@/types';
import { DynamicIcon } from './DoggyImage';
import { selectedCategoryAtom, categoriesAtom, tagsAtom, isAuthenticatedAtom } from '@/store/store';
import api from '@/utils/api';
import { localCategories, OVERVIEW } from '@/utils/localCategories';
import { useAtom, useSetAtom } from 'jotai';
import router from 'next/router';
import { useEffect } from 'react';

// Fallback icon component for items without icons
const FallbackIcon = ({ name, fontSize = 16 }: { name: string; fontSize?: number }) => {
  const firstLetter = name.charAt(0).toUpperCase();
  return (
    <div
      className="inline-flex items-center justify-center rounded bg-primary-200 text-theme-primary font-semibold"
      style={{
        width: fontSize + 4,
        height: fontSize + 4,
        fontSize: fontSize * 0.75,
        minWidth: fontSize + 4,
        minHeight: fontSize + 4
      }}
    >
      {firstLetter}
    </div>
  );
};

// Helper function to render menu icon
const renderMenuIcon = (category: Category, fontSize = 16) => {
  if (category.icon) {
    return <DynamicIcon iconName={category.icon} fontSize={fontSize} />;
  }
  return <FallbackIcon name={category.name} fontSize={fontSize} />;
};


export default function MenuStack({ collapse }: { collapse: boolean }) {
  const [selectedCategory, setSelectedCategory] = useAtom(selectedCategoryAtom);
  const [categories, setCategories] = useAtom(categoriesAtom);
  const setTags = useSetAtom(tagsAtom);
  const [isAuthenticated] = useAtom(isAuthenticatedAtom);
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesData = await api.getCategoryList();
        if (Array.isArray(categoriesData)) {
          categoriesData.unshift(...localCategories);
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
    fetchCategories();
    fetchTags();
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps
  const onHandleSubMenuClick = async (category: Category, id: string) => {
    setSelectedCategory(id);
    router.push(category.href ?? `/navcontents?category=${id}`);
  };
  return (
    <Menu
      collapse={collapse}
      mode={collapse ? "pop" : "vertical"}
      className="border-0 bg-transparent "
      selectedKeys={selectedCategory ? [selectedCategory] : [OVERVIEW.id]}
      tooltipProps={{ position: 'right' }}
    >
      {categories
        .filter(category => category.showInMenu)
        .map((category) => {
          const hasChildren = category.children && category.children.length > 0;

          if (hasChildren) {
            return (
              <Menu.SubMenu
                key={category.id}
                className={"doggy-menu transition-all duration-200 hover:bg-theme-muted hover:shadow-sm"}
                title={
                  collapse ? (
                    // Collapsed mode: only show icon
                    <div className="flex items-center justify-center w-full">
                      {renderMenuIcon(category, 16)}
                    </div>
                  ) : (
                    // Expanded mode: show full content
                    <div className="group flex items-center gap-3 w-full py-2.5">
                      {renderMenuIcon(category, 16)}
                      <span className="group-hover:text-theme-foreground transition-colors font-medium">
                        {category.name}
                      </span>
                      <div className="ml-auto w-2 h-2 rounded-full bg-theme-background opacity-0 group-hover:opacity-100 transition-transform group-hover:scale-125"></div>
                    </div>
                  )
                }
              >
                {category.children
                  ?.filter(child => child.showInMenu)
                  .map((child) => (
                    <Menu.Item
                      key={child.id}
                      onClick={() => onHandleSubMenuClick(child, child.id)}
                    >
                      <div className="group flex items-center gap-3 px-3 py-2.5 -mx-3 transition-all duration-200 hover:bg-theme-muted rounded-xl">
                        {renderMenuIcon(child, 16)}
                        <span className="text-sm text-theme-muted-foreground group-hover:text-theme-foreground transition-colors font-medium">
                          {child.name}
                        </span>
                        <div className="ml-auto w-2 h-2 rounded-full bg-theme-background opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      </div>
                    </Menu.Item>
                  ))}
              </Menu.SubMenu>
            );
          }

          return (
            <Menu.Item
              key={category.id}
              onClick={() => onHandleSubMenuClick(category, category.id)}
              className="transition-all duration-200 hover:bg-theme-muted hover:shadow-sm"
              renderItemInTooltip={() => category.name}
            >
              {collapse ? (
                // Collapsed mode: only show icon
                <div className="flex items-center justify-center w-full">
                  {renderMenuIcon(category, 16)}
                </div>
              ) : (
                // Expanded mode: show full content
                <div className="group flex items-center gap-3 w-full py-2.5">
                  {renderMenuIcon(category, 16)}
                  <span className="group-hover:text-theme-foreground transition-colors font-medium">
                    {category.name}
                  </span>
                  <div className="ml-auto w-2 h-2 rounded-full bg-theme-primary opacity-0 group-hover:opacity-100 transition-transform group-hover:scale-125"></div>
                </div>
              )}
            </Menu.Item>
          );
        })}
    </Menu>
  );
}