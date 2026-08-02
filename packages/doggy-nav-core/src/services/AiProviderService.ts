import type { PageQuery, PageResult } from '../dto/pagination';
import type { AiProvider, AiProviderConfig, AiProviderKind } from '../types/types';
import type {
  AiProviderCreateInput,
  AiProviderRepository,
  AiProviderUpdateInput,
} from '../repositories/AiProviderRepository';
import { AiProviderError } from './AiService';

export const AI_PROVIDER_KINDS: AiProviderKind[] = ['openai-compatible', 'mimo'];

export interface AiProviderFailure {
  id: string;
  name: string;
  provider: string;
  status?: number;
  message: string;
}

function validationError(message: string) {
  const err = new Error(message);
  (err as any).name = 'ValidationError';
  return err;
}

function normalizeProvider(value: unknown): AiProviderKind {
  const provider = String(value || '')
    .trim()
    .toLowerCase();
  if (provider === 'mimo') return 'mimo';
  if (provider === 'openai-compatible' || provider === 'openai' || provider === 'custom') {
    return 'openai-compatible';
  }
  throw validationError('Unsupported AI provider type');
}

function normalizeBaseURL(value: unknown) {
  return String(value || '')
    .trim()
    .replace(/\/+$/, '');
}

function assertRequired(value: unknown, label: string) {
  if (String(value || '').trim() === '') {
    throw validationError(`${label} is required`);
  }
}

export class AiProviderService {
  constructor(private readonly repo: AiProviderRepository) {}

  list(page: PageQuery): Promise<PageResult<AiProvider>> {
    return this.repo.list(page);
  }

  getById(id: string): Promise<AiProvider | null> {
    return this.repo.getById(id);
  }

  create(input: AiProviderCreateInput): Promise<AiProvider> {
    const payload = {
      name: String(input.name || '').trim(),
      provider: normalizeProvider(input.provider),
      baseURL: normalizeBaseURL(input.baseURL),
      model: String(input.model || '').trim(),
      apiKey: String(input.apiKey || '').trim(),
      active: Boolean(input.active),
    };
    assertRequired(payload.name, 'name');
    assertRequired(payload.baseURL, 'baseURL');
    assertRequired(payload.model, 'model');
    assertRequired(payload.apiKey, 'apiKey');
    return this.repo.create(payload);
  }

  update(id: string, input: AiProviderUpdateInput): Promise<AiProvider | null> {
    if (!id) throw validationError('id is required');
    const payload: AiProviderUpdateInput = {};
    if (input.name !== undefined) {
      payload.name = String(input.name || '').trim();
      assertRequired(payload.name, 'name');
    }
    if (input.provider !== undefined) payload.provider = normalizeProvider(input.provider);
    if (input.baseURL !== undefined) {
      payload.baseURL = normalizeBaseURL(input.baseURL);
      assertRequired(payload.baseURL, 'baseURL');
    }
    if (input.model !== undefined) {
      payload.model = String(input.model || '').trim();
      assertRequired(payload.model, 'model');
    }
    if (input.apiKey !== undefined && String(input.apiKey).trim() !== '') {
      payload.apiKey = String(input.apiKey).trim();
    }
    if (input.active !== undefined) payload.active = Boolean(input.active);
    return this.repo.update(id, payload);
  }

  delete(id: string): Promise<boolean> {
    if (!id) throw validationError('id is required');
    return this.repo.delete(id);
  }

  activate(id: string): Promise<AiProvider | null> {
    if (!id) throw validationError('id is required');
    return this.repo.setActive(id);
  }

  getConfigById(id: string): Promise<AiProviderConfig | null> {
    if (!id) throw validationError('id is required');
    return this.repo.getConfigById(id);
  }

  async runWithFailover<T>(
    task: (config: AiProviderConfig) => Promise<T>,
    onExhausted?: (failures: AiProviderFailure[]) => Promise<void>
  ): Promise<T> {
    const configs = await this.repo.listConfigs();
    const activeIndex = configs.findIndex((config) => config.active);
    if (activeIndex < 0) {
      const error = new Error('No active AI provider configured');
      (error as any).status = 503;
      throw error;
    }

    const ordered = [...configs.slice(activeIndex), ...configs.slice(0, activeIndex)];
    const failures: AiProviderFailure[] = [];
    let lastError: AiProviderError | undefined;

    for (const [index, config] of ordered.entries()) {
      if (index > 0 && !(await this.repo.setActive(config.id))) continue;
      try {
        return await task(config);
      } catch (error) {
        if (!(error instanceof AiProviderError)) throw error;
        lastError = error;
        failures.push({
          id: config.id,
          name: config.name,
          provider: error.provider,
          status: error.status,
          message: error.message,
        });
      }
    }

    await onExhausted?.(failures);
    throw lastError!;
  }
}

export default AiProviderService;
