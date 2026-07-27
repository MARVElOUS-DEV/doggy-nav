import type { PageQuery, PageResult } from '../dto/pagination';
import type { AiProvider, AiProviderConfig, AiProviderKind } from '../types/types';

export interface AiProviderCreateInput {
  name: string;
  provider: AiProviderKind;
  baseURL: string;
  model: string;
  apiKey: string;
  active?: boolean;
}

export interface AiProviderUpdateInput {
  name?: string;
  provider?: AiProviderKind;
  baseURL?: string;
  model?: string;
  apiKey?: string;
  active?: boolean;
}

export interface AiProviderRepository {
  list(page: PageQuery): Promise<PageResult<AiProvider>>;
  getById(id: string): Promise<AiProvider | null>;
  create(input: AiProviderCreateInput): Promise<AiProvider>;
  update(id: string, input: AiProviderUpdateInput): Promise<AiProvider | null>;
  delete(id: string): Promise<boolean>;
  setActive(id: string): Promise<AiProvider | null>;
  getConfigById(id: string): Promise<AiProviderConfig | null>;
  getActiveConfig(): Promise<AiProviderConfig | null>;
}

export default AiProviderRepository;
