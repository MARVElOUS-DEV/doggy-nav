import type { Category, NavItem } from '@/types';

export interface NavCascaderPickerProps {
  onSelect: (nav: NavItem) => void;
  onCancel?: () => void;
  trigger?: React.ReactNode;
  title?: string;
}

export interface CategoryColumnProps {
  categories: Category[];
  selectedId: string | null;
  onSelect: (category: Category) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  loading?: boolean;
}

export interface NavColumnProps {
  navItems: NavItem[];
  selectedId: string | null;
  onSelect: (nav: NavItem) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  loading?: boolean;
  categoryName?: string;
}

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}
