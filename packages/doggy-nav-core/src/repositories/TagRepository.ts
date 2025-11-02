import type { Tag } from '../domain/types';
import type { PageQuery, PageResult } from '../dto/pagination';

export interface TagRepository {
  list(page: PageQuery): Promise<PageResult<Tag>>;
}
