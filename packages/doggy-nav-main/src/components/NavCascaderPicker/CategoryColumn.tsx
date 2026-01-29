import React, { useMemo } from 'react';
import { IconFolder, IconRight } from '@arco-design/web-react/icon';
import type { Category } from '@/types';
import type { CategoryColumnProps } from './types';
import SearchInput from './SearchInput';

const filterCategories = (categories: Category[], search: string): Category[] => {
  if (!search.trim()) return categories;
  const lowerSearch = search.toLowerCase();

  const filterTree = (cats: Category[]): Category[] => {
    return cats.reduce<Category[]>((acc, cat) => {
      const nameMatch = cat.name.toLowerCase().includes(lowerSearch);
      const filteredChildren = cat.children ? filterTree(cat.children) : [];

      if (nameMatch || filteredChildren.length > 0) {
        acc.push({
          ...cat,
          children: filteredChildren.length > 0 ? filteredChildren : cat.children,
        });
      }
      return acc;
    }, []);
  };

  return filterTree(categories);
};

interface CategoryItemProps {
  category: Category;
  level: number;
  selectedId: string | null;
  onSelect: (category: Category) => void;
}

const CategoryItem: React.FC<CategoryItemProps> = ({ category, level, selectedId, onSelect }) => {
  const isSelected = selectedId === category.id;
  const hasChildren = category.children && category.children.length > 0;

  return (
    <>
      <div
        className={`flex items-center gap-2 px-3 py-2 cursor-pointer rounded-lg transition-all ${
          isSelected ? 'bg-blue-500/90 text-white shadow-sm' : 'hover:bg-black/5 dark:hover:bg-white/10'
        }`}
        style={{
          paddingLeft: `${12 + level * 16}px`,
          color: isSelected ? 'white' : 'var(--color-foreground)',
        }}
        onClick={() => onSelect(category)}
      >
        <IconFolder className="flex-shrink-0 text-sm" />
        <span className="flex-1 truncate text-sm">{category.name}</span>
        <IconRight className="flex-shrink-0 text-xs opacity-60" />
      </div>
      {hasChildren &&
        category.children!.map((child) => (
          <CategoryItem
            key={child.id}
            category={child}
            level={level + 1}
            selectedId={selectedId}
            onSelect={onSelect}
          />
        ))}
    </>
  );
};

const CategoryColumn: React.FC<CategoryColumnProps> = ({
  categories,
  selectedId,
  onSelect,
  searchValue,
  onSearchChange,
  loading,
}) => {
  const filteredCategories = useMemo(
    () => filterCategories(categories, searchValue),
    [categories, searchValue]
  );

  return (
    <div className="flex flex-col h-full">
      <div className="p-2 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <SearchInput
          value={searchValue}
          onChange={onSearchChange}
          placeholder="Search categories..."
        />
      </div>
      <div className="flex-1 overflow-y-auto p-1.5">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div
              className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }}
            />
          </div>
        ) : filteredCategories.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center h-32 text-sm"
            style={{ color: 'var(--color-muted-foreground)' }}
          >
            <IconFolder className="text-2xl mb-2 opacity-40" />
            <span>No categories found</span>
          </div>
        ) : (
          filteredCategories.map((category) => (
            <CategoryItem
              key={category.id}
              category={category}
              level={0}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default CategoryColumn;
