import type { Category } from '../domain/types';

export interface CategoryListOptions {
  showInMenu?: boolean;
}

export interface CategoryRepository {
  listAll(options?: CategoryListOptions): Promise<Category[]>;
}
