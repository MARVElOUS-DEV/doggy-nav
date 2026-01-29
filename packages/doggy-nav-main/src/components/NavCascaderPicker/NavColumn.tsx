import React, { useMemo } from 'react';
import { IconLink } from '@arco-design/web-react/icon';
import type { NavItem } from '@/types';
import type { NavColumnProps } from './types';
import SearchInput from './SearchInput';

const filterNavs = (navs: NavItem[], search: string): NavItem[] => {
  if (!search.trim()) return navs;
  const lowerSearch = search.toLowerCase();
  return navs.filter(
    (nav) =>
      nav.name.toLowerCase().includes(lowerSearch) ||
      nav.href?.toLowerCase().includes(lowerSearch) ||
      nav.desc?.toLowerCase().includes(lowerSearch)
  );
};

const NavColumn: React.FC<NavColumnProps> = ({
  navItems,
  selectedId,
  onSelect,
  searchValue,
  onSearchChange,
  loading,
  categoryName,
}) => {
  const filteredNavs = useMemo(() => filterNavs(navItems, searchValue), [navItems, searchValue]);

  return (
    <div className="flex flex-col h-full">
      <div className="p-2 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <SearchInput value={searchValue} onChange={onSearchChange} placeholder="Search navs..." />
        {categoryName && (
          <div
            className="text-xs mt-1.5 truncate"
            style={{ color: 'var(--color-muted-foreground)' }}
          >
            in <span className="font-medium">{categoryName}</span>
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-1.5">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div
              className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }}
            />
          </div>
        ) : navItems.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center h-32 text-sm"
            style={{ color: 'var(--color-muted-foreground)' }}
          >
            <IconLink className="text-2xl mb-2 opacity-40" />
            <span>Select a category</span>
          </div>
        ) : filteredNavs.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center h-32 text-sm"
            style={{ color: 'var(--color-muted-foreground)' }}
          >
            <IconLink className="text-2xl mb-2 opacity-40" />
            <span>No navs found</span>
          </div>
        ) : (
          filteredNavs.map((nav) => {
            const isSelected = selectedId === nav.id;
            return (
              <div
                key={nav.id}
                className={`flex items-center gap-3 px-3 py-2 cursor-pointer rounded-lg transition-all ${
                  isSelected
                    ? 'bg-blue-500/90 text-white shadow-sm'
                    : 'hover:bg-black/5 dark:hover:bg-white/10'
                }`}
                onClick={() => onSelect(nav)}
              >
                {nav.logo ? (
                  <img
                    src={nav.logo}
                    alt=""
                    className="w-7 h-7 rounded-lg flex-shrink-0 object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div
                    className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center"
                    style={{ backgroundColor: 'var(--color-muted)' }}
                  >
                    <IconLink
                      className="text-sm"
                      style={{ color: 'var(--color-muted-foreground)' }}
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{nav.name}</div>
                  {nav.desc && (
                    <div
                      className="text-xs truncate"
                      style={{ color: isSelected ? 'rgba(255,255,255,0.8)' : 'var(--color-muted-foreground)' }}
                    >
                      {nav.desc}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default NavColumn;
