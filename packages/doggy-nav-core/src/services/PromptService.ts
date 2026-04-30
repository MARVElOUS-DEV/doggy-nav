import type { PageQuery, PageResult } from '../dto/pagination';
import type { Prompt } from '../types/types';
import type { PromptRepository } from '../repositories/PromptRepository';

export const DEFAULT_PROMPT_CODE = 'global.default';
export const RECOMMENDATION_AUTOFILL_PROMPT_CODE = 'recommendation.autofill.v1';

export class PromptService {
  constructor(private readonly repo: PromptRepository) {}

  list(page: PageQuery): Promise<PageResult<Prompt>> {
    return this.repo.list(page);
  }

  create(name: string, content: string, active = false, code = DEFAULT_PROMPT_CODE): Promise<Prompt> {
    return this.repo.create({ code, name, content, active });
  }

  update(
    id: string,
    input: { code?: string; name?: string; content?: string; active?: boolean }
  ): Promise<Prompt | null> {
    return this.repo.update(id, input);
  }

  delete(id: string): Promise<boolean> {
    return this.repo.delete(id);
  }

  async activate(id: string): Promise<Prompt | null> {
    return this.repo.setActive(id);
  }

  getActive(): Promise<Prompt | null> {
    return this.repo.getActive();
  }

  getActiveByCode(code: string): Promise<Prompt | null> {
    return this.repo.getActiveByCode(code);
  }

  activateForCode(code: string, id: string): Promise<Prompt | null> {
    return this.repo.setActiveForCode(code, id);
  }
}

export default PromptService;
