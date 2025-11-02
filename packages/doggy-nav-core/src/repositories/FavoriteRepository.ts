import type { NavItem, FavoriteUnionItem } from '../domain/types';
import type { PageQuery, PageResult } from '../dto/pagination';

export interface FavoriteRepository {
  list(userId: string, page: PageQuery): Promise<PageResult<NavItem>>;
  check(userId: string, navId: string): Promise<boolean>;
  count(userId: string): Promise<number>;
  structured(userId: string): Promise<FavoriteUnionItem[]>;
}
