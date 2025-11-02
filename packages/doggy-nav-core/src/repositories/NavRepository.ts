import type { NavItem } from '../domain/types';
import type { PageQuery, PageResult } from '../dto/pagination';

export interface NavListFilter {
  status?: number;
  categoryId?: string;
  name?: string;
}

export interface NavListOptions {
  page: PageQuery;
  filter?: NavListFilter;
  userIdForFavorites?: string | null;
}

export interface NavRepository {
  list(options: NavListOptions): Promise<PageResult<NavItem>>;
}
