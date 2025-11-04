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
  list(options: GroupListOptions): Promise<PageResult<Group>>;
}
