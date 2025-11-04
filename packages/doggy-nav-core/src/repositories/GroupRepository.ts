import type { Group } from '../types/types';
import type { PageResult } from '../dto/pagination';

export interface GroupListOptions {
  pageSize: number;
  pageNumber: number;
  filter?: {
    slugs?: string[];
  };
}

export interface GroupRepository {
  getById(id: string): Promise<Group | null>;
  getBySlug(slug: string): Promise<Group | null>;
  list(options: GroupListOptions): Promise<PageResult<Group>>;
  create(input: { slug: string; displayName: string; description?: string }): Promise<Group>;
  update(
    id: string,
    patch: Partial<{ slug: string; displayName: string; description: string }>
  ): Promise<Group | null>;
  delete(id: string): Promise<boolean>;
  setGroupUsers(groupId: string, userIds: string[]): Promise<void>;
}
