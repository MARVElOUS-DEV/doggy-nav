import React, { useState, useCallback, useEffect, useRef } from 'react';
import { IconApps } from '@arco-design/web-react/icon';
import type { Category, NavItem } from '@/types';
import type { NavCascaderPickerProps } from './types';
import CategoryColumn from './CategoryColumn';
import NavColumn from './NavColumn';
import api from '@/utils/api';
import DoggyImage from '../DoggyImage';
import { Button, Drawer, Modal } from '@arco-design/web-react';

const EMPTY_TAGS: string[] = [];

const NavCascaderPicker: React.FC<NavCascaderPickerProps> = ({
  onSelect,
  onCancel,
  trigger,
  title = 'Select Navigation',
  selectedTags = EMPTY_TAGS,
  getPopupContainer,
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
  const [narrow, setNarrow] = useState(false);

  useEffect(() => {
    const update = () => setNarrow(window.innerWidth < 640);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

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
      const data = await api.findNavByCategory(categoryId, {
        tags: selectedTags,
      });
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
  }, [selectedTags]);

  useEffect(() => {
    navsCacheRef.current.clear();
    setNavItems([]);
    setSelectedNav(null);
  }, [selectedTags]);

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

  const pickerContent = (
    <>
      <div className={`flex ${narrow ? 'h-[55vh] flex-col' : 'h-80'}`}>
        <div className={`${narrow ? 'h-1/2 border-b' : 'w-1/2 border-r'} border-theme-border`}>
          <CategoryColumn categories={categories} selectedId={selectedCategoryId} onSelect={handleCategorySelect} searchValue={categorySearch} onSearchChange={setCategorySearch} loading={categoriesLoading} />
        </div>
        <div className={narrow ? 'h-1/2' : 'w-1/2'}>
          <NavColumn navItems={navItems} selectedId={selectedNav?.id || null} onSelect={handleNavSelect} searchValue={navSearch} onSearchChange={setNavSearch} loading={navsLoading} categoryName={selectedCategoryName} />
        </div>
      </div>
      {selectedNav ? (
        <div className="flex items-center gap-3 border-t border-theme-border bg-theme-muted px-4 py-3">
          {selectedNav.logo ? <DoggyImage logo={selectedNav.logo} name={selectedNav.name} className="h-8 w-8 rounded-lg object-cover" /> : null}
          <div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">{selectedNav.name}</div><div className="truncate text-xs text-theme-muted-foreground">{selectedNav.href}</div></div>
        </div>
      ) : null}
    </>
  );

  return (
    <>
      <span onClick={handleOpen} className="cursor-pointer">
        {triggerElement}
      </span>

      {narrow ? (
        <Drawer visible={visible} title={title} placement="bottom" height="82vh" getPopupContainer={getPopupContainer} onCancel={handleClose} unmountOnExit footer={<div className="flex justify-end gap-2"><Button onClick={handleClose}>Cancel</Button><Button type="primary" disabled={!selectedNav} onClick={handleConfirm}>Select</Button></div>}>{pickerContent}</Drawer>
      ) : (
        <Modal visible={visible} title={title} style={{ width: 680 }} getPopupContainer={getPopupContainer} onCancel={handleClose} onOk={handleConfirm} okButtonProps={{ disabled: !selectedNav }} unmountOnExit>{pickerContent}</Modal>
      )}
    </>
  );
};

export default NavCascaderPicker;
