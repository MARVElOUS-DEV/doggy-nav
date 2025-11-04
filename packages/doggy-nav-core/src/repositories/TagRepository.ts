import type { Tag } from '../types/types';
import type { PageQuery, PageResult } from '../dto/pagination';

export interface TagRepository {
  list(page: PageQuery): Promise<PageResult<Tag>>;
}
