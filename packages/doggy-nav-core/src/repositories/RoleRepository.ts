import type { Role } from '../domain/types';
import type { PageQuery, PageResult } from '../dto/pagination';

export interface RoleListOptions {
  page: PageQuery;
  filter?: { slugs?: string[] };
}

export interface RoleRepository {
  list(options: RoleListOptions): Promise<PageResult<Role>>;
}
