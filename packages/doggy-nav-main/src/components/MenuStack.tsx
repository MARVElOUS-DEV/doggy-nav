import { Menu } from '@arco-design/web-react';
import { Category } from '@/types';
import { DynamicIcon } from './DoggyImage';
import { selectedCategoryAtom, categoriesAtom, tagsAtom, isAuthenticatedAtom } from '@/store/store';
import api from '@/utils/api';
import { localCategories, OVERVIEW } from '@/utils/localCategories';
import { useAtom, useSetAtom } from 'jotai';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { t } from '@/utils';

// Fallback icon component for items without icons
const FallbackIcon = ({ name, fontSize = 16 }: { name: string; fontSize?: number }) => {
  const firstLetter = name.charAt(0).toUpperCase();
  return (
    <div
      className="inline-flex items-center justify-center rounded bg-primary-200 text-theme-primary font-semibold"
      style={{
        width: fontSize,
        height: fontSize,
        fontSize: fontSize * 0.75,
        minWidth: fontSize,
        minHeight: fontSize,
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
  return (
    <FallbackIcon name={t(category.name, { defaultValue: category.name })} fontSize={fontSize} />
  );
};

const containsCategory = (category: Category, categoryId: string): boolean =>
  category.id === categoryId ||
  !!category.children?.some((child) => containsCategory(child, categoryId));

export default function MenuStack({ collapse }: { collapse: boolean }) {
  const { t } = useTranslation();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useAtom(selectedCategoryAtom);
  const [categories, setCategories] = useAtom(categoriesAtom);
  const setTags = useSetAtom(tagsAtom);
  const [isAuthenticated] = useAtom(isAuthenticatedAtom);
  const [openKeys, setOpenKeys] = useState<string[]>([]);
  // Check if we're on a nav detail page where category will be set by the page itself
  const isNavDetailPage = router.pathname === '/nav/[id]';

  // Sync selected category from URL when router is ready
  useEffect(() => {
    if (!router.isReady) return;
    const urlCategory = router.query.category as string | undefined;
    if (urlCategory) {
      setSelectedCategory(urlCategory);
    }
  }, [router.isReady, router.query.category, setSelectedCategory]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesData = await api.getCategoryList();
        if (Array.isArray(categoriesData)) {
          categoriesData.unshift(...localCategories);
          if (router.isReady && !selectedCategory && !router.query.category && !isNavDetailPage) {
            setSelectedCategory(categoriesData[0].id);
          }
          setCategories(categoriesData);
        }
      } catch (error) {
        console.error('Failed to fetch categories', error);
      }
    };

    const fetchTags = async () => {
      try {
        const { data } = await api.getTagList();
        const options =
          data?.map((item) => {
            item.value = item.name;
            item.label = item.name;
            return item;
          }) || [];
        setTags(options);
      } catch (error) {
        console.error('Failed to fetch tags', error);
      }
    };
    fetchCategories();
    fetchTags();
  }, [isAuthenticated, router.isReady, router.query.category, isNavDetailPage]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeGroupKey = useMemo(() => {
    const activeGroup = categories.find(
      (category) =>
        category.children?.some((child) => containsCategory(child, selectedCategory)) ||
        (category.id === selectedCategory && category.children?.some((child) => child.showInMenu)),
    );
    return activeGroup ? `${activeGroup.id}__group` : '';
  }, [categories, selectedCategory]);

  useEffect(() => {
    if (!collapse) setOpenKeys(activeGroupKey ? [activeGroupKey] : []);
  }, [activeGroupKey, collapse]);

  const onHandleSubMenuClick = (category: Category, id: string) => {
    setSelectedCategory(id);
    void router.push(category.href ?? `/navcontents?category=${id}`);
  };

  const renderMenuItem = (
    category: Category,
    options?: {
      compact?: boolean;
    },
  ) => (
    <Menu.Item
      key={category.id}
      onClick={() => onHandleSubMenuClick(category, category.id)}
      className="transition-all duration-200"
      renderItemInTooltip={() => t(category.name, { defaultValue: category.name })}
    >
      {collapse ? (
        <div className="flex items-center justify-center w-full">
          {renderMenuIcon(category, 16)}
        </div>
      ) : (
        <div
          className={`group flex items-center gap-3 w-full ${
            options?.compact ? 'px-2 py-2' : 'py-2.5'
          }`}
        >
          {renderMenuIcon(category, 16)}
          <span
            className={`group-hover:text-theme-foreground transition-colors ${
              options?.compact
                ? 'text-sm text-theme-muted-foreground'
                : 'font-medium'
            }`}
          >
            {t(category.name, { defaultValue: category.name })}
          </span>
          <div className="ml-auto w-2 h-2 rounded-full bg-theme-primary opacity-0 group-hover:opacity-100 transition-transform group-hover:scale-125"></div>
        </div>
      )}
    </Menu.Item>
  );

  const renderTopLevelNode = (category: Category) => {
    const visibleChildren = (category.children || []).filter((child) => child.showInMenu);
    const hasChildren = visibleChildren.length > 0;

    if (!hasChildren) {
      return renderMenuItem(category);
    }

    return (
      <Menu.SubMenu
        key={`${category.id}__group`}
        className={'doggy-menu transition-all duration-200'}
        title={
          collapse ? (
            <div className="flex items-center justify-center w-full">
              {renderMenuIcon(category, 16)}
            </div>
          ) : (
            <div className="group flex items-center gap-3 w-full py-2.5">
              {renderMenuIcon(category, 16)}
              {category.onlyFolder === true ? (
                <span className="min-w-0 flex-1 font-medium transition-colors group-hover:text-theme-foreground">
                  {t(category.name, { defaultValue: category.name })}
                </span>
              ) : (
                <button
                  type="button"
                  className={`-my-2 min-w-0 flex-1 self-stretch truncate py-2 text-left font-medium transition-colors group-hover:text-theme-foreground ${
                    category.id === selectedCategory ? 'text-theme-primary' : ''
                  }`}
                  onClick={(event) => {
                    event.stopPropagation();
                    onHandleSubMenuClick(category, category.id);
                  }}
                >
                  {t(category.name, { defaultValue: category.name })}
                </button>
              )}
            </div>
          )
        }
      >
        {visibleChildren.map((child) => renderMenuItem(child, { compact: true }))}
      </Menu.SubMenu>
    );
  };

  return (
    <Menu
      collapse={collapse}
      mode={collapse ? 'pop' : 'vertical'}
      className="border-0 bg-transparent "
      selectedKeys={selectedCategory ? [selectedCategory] : [OVERVIEW.id]}
      openKeys={openKeys}
      accordion
      onClickSubMenu={(_, nextOpenKeys) => setOpenKeys(nextOpenKeys)}
      tooltipProps={{ position: 'right' }}
    >
      {categories
        .filter((category) => category.showInMenu)
        .map((category) => renderTopLevelNode(category))}
    </Menu>
  );
}
