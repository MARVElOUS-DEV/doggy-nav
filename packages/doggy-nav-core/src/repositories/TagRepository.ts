import type { Tag } from '../types/types';
import type { PageQuery, PageResult } from '../dto/pagination';

export interface TagRepository {
  list(page: PageQuery): Promise<PageResult<Tag>>;
  getById(id: string): Promise<Tag | null>;
  getByName(name: string): Promise<Tag | null>;
  create(name: string): Promise<Tag>;
  update(id: string, name: string): Promise<Tag | null>;
  delete(id: string): Promise<boolean>;
}
