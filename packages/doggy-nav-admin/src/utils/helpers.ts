import { CATEGORY_NAME_ZH_MAP } from '@/constants';
import type { CategoryModel } from '@/types/api';
import React from 'react';

export const getCategoryDisplayName = (categoryName?: string | null) => {
  if (!categoryName) return '';
  return CATEGORY_NAME_ZH_MAP[categoryName] || categoryName;
};

type CategoryOption = {
  label: string;
  value: string;
};

type CategoryTreeNode = CategoryModel & {
  key: string;
  children?: CategoryTreeNode[];
};

export const buildCategoryOptions = (
  categoryList: CategoryModel[] = [],
  parentLabels: string[] = [],
): CategoryOption[] => {
  return categoryList.flatMap((item) => {
    const currentLabel = getCategoryDisplayName(item.name);
    const pathLabels = [...parentLabels, currentLabel];
    const children = Array.isArray(item.children)
      ? buildCategoryOptions(item.children, pathLabels)
      : [];

    return [
      {
        label: pathLabels.join(' / '),
        value: item.id,
      },
      ...children,
    ];
  });
};

export const buildCategoryTreeRows = (
  categoryList: CategoryModel[] = [],
): CategoryTreeNode[] => {
  return categoryList.map((item) => ({
    key: item.id,
    ...item,
    children: Array.isArray(item.children)
      ? buildCategoryTreeRows(item.children)
      : [],
  }));
};

export const getIconComponent = (
  iconName: string,
  fontSize = 14,
): React.ReactNode | string | null => {
  try {
    if (!iconName) return null;
    if (iconName.startsWith('type:emoji_')) {
      const emoji = iconName.replace('type:emoji_', '');
      return React.createElement(
        'span',
        { style: { fontSize: `${fontSize}px` } },
        emoji,
      );
    }
    if (iconName.startsWith('type:arco_')) {
      const arcoIconName = iconName.replace('type:arco_', '');
      const IconComponent = React.lazy(() =>
        import('@arco-design/web-react/icon').then((module: any) => {
          if (module[arcoIconName]) {
            return { default: module[arcoIconName] };
          }
          throw new Error(`Icon ${arcoIconName} not found`);
        }),
      );
      return React.createElement(
        React.Suspense,
        {
          fallback: React.createElement(
            'span',
            { style: { fontSize: `${fontSize}px` } },
            '...',
          ),
        },
        React.createElement(IconComponent as any, {
          style: {
            fontSize: `${fontSize}px`,
            width: `${fontSize}px`,
            marginRight: '4px',
          },
        }),
      );
    }
    return React.createElement(
      'span',
      { style: { fontSize: `${fontSize}px` } },
      iconName,
    );
  } catch (error) {
    return null;
  }
};
