import type { NavItem } from '../types/types';
import type { PageQuery, PageResult } from '../dto/pagination';

export interface NavListFilter {
  status?: number;
  categoryId?: string;
  name?: string;
  tags?: string[];
  year?: number;
  createTimeStart?: number;
  createTimeEnd?: number;
}

export interface NavListOptions {
  page: PageQuery;
  filter?: NavListFilter;
  userIdForFavorites?: string | null;
}

export interface NavRepository {
  list(options: NavListOptions): Promise<PageResult<NavItem>>;
}
