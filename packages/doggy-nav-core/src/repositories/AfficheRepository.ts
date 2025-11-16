import type { PageQuery, PageResult } from '../dto/pagination';
import type { Affiche } from '../types/types';

export interface AfficheRepository {
  list(page: PageQuery, filter?: { active?: boolean }): Promise<PageResult<Affiche>>;
  getById(id: string): Promise<Affiche | null>;
  create(input: {
    text: string;
    linkHref?: string | null;
    linkText?: string | null;
    linkTarget?: string | null;
    active?: boolean;
    order?: number | null;
  }): Promise<Affiche>;
  update(
    id: string,
    patch: {
      text?: string;
      linkHref?: string | null;
      linkText?: string | null;
      linkTarget?: string | null;
      active?: boolean;
      order?: number | null;
    }
  ): Promise<Affiche | null>;
  delete(id: string): Promise<boolean>;
  listActive(): Promise<Affiche[]>;
}

export default AfficheRepository;
