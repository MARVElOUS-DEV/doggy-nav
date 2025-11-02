import type { PageQuery, PageResult } from '../dto/pagination';
import type { Tag } from '../domain/types';
import type { TagRepository } from '../repositories/TagRepository';

function normalizePage(page: PageQuery) {
  const pageSize = Math.min(Math.max(Number(page.pageSize) || 10, 1), 200);
  const pageNumber = Math.max(Number(page.pageNumber) || 1, 1);
  return { pageSize, pageNumber };
}

export class TagService {
  constructor(private readonly repo: TagRepository) {}

  async list(page: PageQuery): Promise<PageResult<Tag>> {
    const { pageSize, pageNumber } = normalizePage(page);
    return this.repo.list({ pageSize, pageNumber });
  }
}

export default TagService;
