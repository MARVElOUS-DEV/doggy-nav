import type { Role } from '../types/types';
import type { PageQuery, PageResult } from '../dto/pagination';

export interface RoleListOptions {
  page: PageQuery;
  filter?: { slugs?: string[] };
}

export interface RoleRepository {
  list(options: RoleListOptions): Promise<PageResult<Role>>;
}
