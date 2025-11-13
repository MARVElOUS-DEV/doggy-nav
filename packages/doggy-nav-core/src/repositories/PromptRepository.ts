import type { PageQuery, PageResult } from '../dto/pagination';
import type { Prompt } from '../types/types';

export interface PromptRepository {
  list(page: PageQuery): Promise<PageResult<Prompt>>;
  getById(id: string): Promise<Prompt | null>;
  create(input: { name: string; content: string; active?: boolean }): Promise<Prompt>;
  update(id: string, input: { name?: string; content?: string; active?: boolean }): Promise<Prompt | null>;
  delete(id: string): Promise<boolean>;
  getActive(): Promise<Prompt | null>;
  setActive(id: string): Promise<Prompt | null>;
}

export default PromptRepository;
