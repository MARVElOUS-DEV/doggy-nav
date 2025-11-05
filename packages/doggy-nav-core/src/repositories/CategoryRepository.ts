import type { Category } from '../types/types';

export interface CategoryListOptions {
  showInMenu?: boolean;
}

export interface CategoryRepository {
  listAll(options?: CategoryListOptions): Promise<Category[]>;
}
