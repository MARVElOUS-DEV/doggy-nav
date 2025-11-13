import type { PageQuery, PageResult } from '../dto/pagination';
import type { Prompt } from '../types/types';
import type { PromptRepository } from '../repositories/PromptRepository';

export class PromptService {
  constructor(private readonly repo: PromptRepository) {}

  list(page: PageQuery): Promise<PageResult<Prompt>> {
    return this.repo.list(page);
  }

  create(name: string, content: string, active = false): Promise<Prompt> {
    return this.repo.create({ name, content, active });
  }

  update(id: string, input: { name?: string; content?: string; active?: boolean }): Promise<Prompt | null> {
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
}

export default PromptService;
