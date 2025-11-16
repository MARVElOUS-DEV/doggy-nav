import type { PageQuery, PageResult } from '../dto/pagination';
import type { Affiche } from '../types/types';
import type { AfficheRepository } from '../repositories/AfficheRepository';

export class AfficheService {
  constructor(private readonly repo: AfficheRepository) {}

  list(page: PageQuery, filter?: { active?: boolean }): Promise<PageResult<Affiche>> {
    return this.repo.list(page, filter);
  }

  create(input: {
    text: string;
    linkHref?: string | null;
    linkText?: string | null;
    linkTarget?: string | null;
    active?: boolean;
    order?: number | null;
  }): Promise<Affiche> {
    return this.repo.create(input);
  }

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
  ): Promise<Affiche | null> {
    return this.repo.update(id, patch);
  }

  delete(id: string): Promise<boolean> {
    return this.repo.delete(id);
  }

  listActive(): Promise<Affiche[]> {
    return this.repo.listActive();
  }
}

export default AfficheService;
