import type { PageQuery, PageResult } from '../dto/pagination';
import type { NavItem, FavoriteUnionItem } from '../domain/types';
import type { FavoriteRepository } from '../repositories/FavoriteRepository';

function normalizePage(page: PageQuery) {
  const pageSize = Math.min(Math.max(Number(page.pageSize) || 10, 1), 100);
  const pageNumber = Math.max(Number(page.pageNumber) || 1, 1);
  return { pageSize, pageNumber };
}

export class FavoriteService {
  constructor(private readonly repo: FavoriteRepository) {}

  async list(userId: string, page: PageQuery): Promise<PageResult<NavItem>> {
    const { pageSize, pageNumber } = normalizePage(page);
    return this.repo.list(userId, { pageSize, pageNumber });
  }

  async structured(userId: string): Promise<{ data: FavoriteUnionItem[] }> {
    const union = await this.repo.structured(userId);
    return { data: union };
  }
 
  async check(userId: string, navId: string): Promise<{ isFavorite: boolean }> {
    const ok = await this.repo.check(userId, navId);
    return { isFavorite: ok };
  }

  async count(userId: string): Promise<{ count: number }> {
    const n = await this.repo.count(userId);
    return { count: n };
  }
}

export default FavoriteService;
