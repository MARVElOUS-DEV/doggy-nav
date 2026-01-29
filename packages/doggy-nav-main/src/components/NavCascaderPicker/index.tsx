import React, { useState, useCallback, useEffect, useRef } from 'react';
import { IconApps } from '@arco-design/web-react/icon';
import type { Category, NavItem } from '@/types';
import type { NavCascaderPickerProps } from './types';
import CategoryColumn from './CategoryColumn';
import NavColumn from './NavColumn';
import api from '@/utils/api';
import DoggyImage from '../DoggyImage';

const NavCascaderPicker: React.FC<NavCascaderPickerProps> = ({
  onSelect,
  onCancel,
  trigger,
  title = 'Select Navigation',
}) => {
  const [visible, setVisible] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>('');
  const [navItems, setNavItems] = useState<NavItem[]>([]);
  const [navsLoading, setNavsLoading] = useState(false);
  const [selectedNav, setSelectedNav] = useState<NavItem | null>(null);
  const [categorySearch, setCategorySearch] = useState('');
  const [navSearch, setNavSearch] = useState('');

  const navsCacheRef = useRef<Map<string, NavItem[]>>(new Map());
  const modalRef = useRef<HTMLDivElement>(null);

  const fetchCategories = useCallback(async () => {
    setCategoriesLoading(true);
    try {
      const data = await api.getCategoryList();
      const filtered = (data || []).filter((c) => c.showInMenu !== false);
      setCategories(filtered);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  const fetchNavsByCategory = useCallback(async (categoryId: string) => {
    const cached = navsCacheRef.current.get(categoryId);
    if (cached) {
      setNavItems(cached);
      return;
    }

    setNavsLoading(true);
    try {
      const data = await api.findNavByCategory(categoryId);
      const items: NavItem[] = [];
      if (Array.isArray(data)) {
        data.forEach((cat: { list?: NavItem[] }) => {
          if (cat.list && Array.isArray(cat.list)) {
            items.push(...cat.list);
          }
        });
      }
      navsCacheRef.current.set(categoryId, items);
      setNavItems(items);
    } catch (error) {
      console.error('Failed to fetch navs:', error);
      setNavItems([]);
    } finally {
      setNavsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible && categories.length === 0) {
      fetchCategories();
    }
  }, [visible, categories.length, fetchCategories]);

  const handleOpen = useCallback(() => {
    setVisible(true);
  }, []);

  const handleClose = useCallback(() => {
    setVisible(false);
    setSelectedNav(null);
    setCategorySearch('');
    setNavSearch('');
    onCancel?.();
  }, [onCancel]);

  useEffect(() => {
    if (visible) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          handleClose();
        }
      };
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [visible, handleClose]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        handleClose();
      }
    },
    [handleClose]
  );

  const handleCategorySelect = useCallback(
    (category: Category) => {
      setSelectedCategoryId(category.id);
      setSelectedCategoryName(category.name);
      setSelectedNav(null);
      setNavSearch('');
      fetchNavsByCategory(category.id);
    },
    [fetchNavsByCategory]
  );

  const handleNavSelect = useCallback((nav: NavItem) => {
    setSelectedNav(nav);
  }, []);

  const handleConfirm = useCallback(() => {
    if (selectedNav) {
      onSelect(selectedNav);
      setVisible(false);
      setSelectedNav(null);
      setSelectedCategoryId(null);
      setCategorySearch('');
      setNavSearch('');
    }
  }, [selectedNav, onSelect]);

  const triggerElement = trigger || (
    <button
      type="button"
      className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border transition-colors hover:bg-black/5 dark:hover:bg-white/10"
      style={{ borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }}
    >
      <IconApps />
      <span>Browse Navs</span>
    </button>
  );

  return (
    <>
      <span onClick={handleOpen} className="cursor-pointer">
        {triggerElement}
      </span>

      {visible && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
          onClick={handleBackdropClick}
        >
          <div
            ref={modalRef}
            className="w-[680px] max-w-[90vw] rounded-2xl shadow-2xl border backdrop-blur-xl overflow-hidden"
            style={{
              backgroundColor: 'var(--color-card)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-foreground)',
            }}
          >
            {/* Title bar - macOS style */}
            <div
              className="flex items-center justify-between px-4 py-3 border-b"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full bg-red-500 cursor-pointer hover:bg-red-600"
                  onClick={handleClose}
                />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <span
                className="text-sm font-medium"
                style={{ color: 'var(--color-muted-foreground)' }}
              >
                {title}
              </span>
              <div className="w-16" />
            </div>

            {/* Content */}
            <div className="flex h-80" style={{ borderColor: 'var(--color-border)' }}>
              <div className="w-1/2 border-r" style={{ borderColor: 'var(--color-border)' }}>
                <CategoryColumn
                  categories={categories}
                  selectedId={selectedCategoryId}
                  onSelect={handleCategorySelect}
                  searchValue={categorySearch}
                  onSearchChange={setCategorySearch}
                  loading={categoriesLoading}
                />
              </div>
              <div className="w-1/2">
                <NavColumn
                  navItems={navItems}
                  selectedId={selectedNav?.id || null}
                  onSelect={handleNavSelect}
                  searchValue={navSearch}
                  onSearchChange={setNavSearch}
                  loading={navsLoading}
                  categoryName={selectedCategoryName}
                />
              </div>
            </div>

            {/* Selected item preview */}
            {selectedNav && (
              <div
                className="px-4 py-3 border-t"
                style={{
                  borderColor: 'var(--color-border)',
                  backgroundColor: 'var(--color-accent)',
                }}
              >
                <div className="flex items-center gap-3">
                  {selectedNav.logo && (
                    <DoggyImage
                      logo={selectedNav.logo}
                      name={selectedNav.name}
                      className="w-8 h-8 rounded-lg object-cover"
                    />
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{selectedNav.name}</div>
                    <div
                      className="text-xs truncate"
                      style={{ color: 'var(--color-muted-foreground)' }}
                    >
                      {selectedNav.href}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div
              className="flex items-center justify-end gap-2 px-4 py-3 border-t"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-1.5 text-sm rounded-lg border transition-colors hover:bg-black/5 dark:hover:bg-white/10"
                style={{ borderColor: 'var(--color-border)' }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!selectedNav}
                onClick={handleConfirm}
                className="px-4 py-1.5 text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: selectedNav ? 'var(--color-primary)' : 'var(--color-muted)',
                  color: selectedNav ? 'white' : 'var(--color-muted-foreground)',
                }}
              >
                Select
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NavCascaderPicker;
