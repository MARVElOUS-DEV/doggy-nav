import type { Role } from '../types/types';
import type { PageQuery, PageResult } from '../dto/pagination';

export interface RoleListOptions {
  page: PageQuery;
  filter?: { slugs?: string[] };
}

export interface RoleRepository {
  list(options: RoleListOptions): Promise<PageResult<Role>>;
  getById(id: string): Promise<Role | null>;
  getBySlug(slug: string): Promise<Role | null>;
  create(input: {
    slug: string;
    displayName: string;
    description?: string;
    permissions?: string[];
    isSystem?: boolean;
  }): Promise<Role>;
  update(
    id: string,
    updates: Partial<{
      slug: string;
      displayName: string;
      description: string;
      permissions: string[];
      isSystem: boolean;
    }>
  ): Promise<Role | null>;
  delete(id: string): Promise<boolean>;
  getRolePermissions(id: string): Promise<string[]>;
  setRolePermissions(id: string, permissions: string[]): Promise<void>;
}
