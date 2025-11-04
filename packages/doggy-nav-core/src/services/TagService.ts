import type { PageQuery, PageResult } from '../dto/pagination';
import type { Tag } from '../types/types';
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

  async create(name: string): Promise<Tag> {
    const n = String(name || '').trim();
    if (!n) {
      const err = new Error('name required');
      (err as any).name = 'ValidationError';
      throw err;
    }
    const dup = await this.repo.getByName(n);
    if (dup) {
      const err = new Error('Tag already exists');
      (err as any).name = 'ValidationError';
      throw err;
    }
    return this.repo.create(n);
  }

  async update(id: string, name: string): Promise<Tag | null> {
    const n = String(name || '').trim();
    if (!n) {
      const err = new Error('name required');
      (err as any).name = 'ValidationError';
      throw err;
    }
    const dup = await this.repo.getByName(n);
    if (dup && dup.id !== id) {
      const err = new Error('Tag already exists');
      (err as any).name = 'ValidationError';
      throw err;
    }
    return this.repo.update(id, n);
  }

  async delete(id: string): Promise<boolean> {
    return this.repo.delete(id);
  }
}

export default TagService;
