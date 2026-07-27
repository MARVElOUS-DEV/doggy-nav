import type {
  AiProvider,
  AiProviderConfig,
  AiProviderCreateInput,
  AiProviderRepository,
  AiProviderUpdateInput,
  PageQuery,
  PageResult,
} from 'doggy-nav-core';
import { newId24 } from '../utils/id';

function rowToProvider(row: any): AiProvider {
  return {
    id: String(row.id),
    name: String(row.name),
    provider: row.provider || 'openai-compatible',
    baseURL: String(row.base_url || ''),
    model: String(row.model || ''),
    active: Number(row.active || 0) === 1,
    apiKeySet: Boolean(row.api_key),
    createdAt: row.created_at ? String(row.created_at) : undefined,
    updatedAt: row.updated_at ? String(row.updated_at) : undefined,
  };
}

function rowToConfig(row: any): AiProviderConfig {
  return {
    ...rowToProvider(row),
    apiKey: String(row.api_key || ''),
  };
}

export default class D1AiProviderRepository implements AiProviderRepository {
  constructor(private readonly db: D1Database) {}

  async list(page: PageQuery): Promise<PageResult<AiProvider>> {
    const pageSize = Math.min(Math.max(Number(page.pageSize) || 10, 1), 200);
    const pageNumber = Math.max(Number(page.pageNumber) || 1, 1);
    const offset = (pageNumber - 1) * pageSize;

    const listRs = await this.db
      .prepare(
        `SELECT id, name, provider, base_url, model, api_key, active, created_at, updated_at
         FROM ai_providers
         ORDER BY active DESC, created_at DESC
         LIMIT ? OFFSET ?`
      )
      .bind(pageSize, offset)
      .all<any>();
    const countRs = await this.db.prepare(`SELECT COUNT(1) as cnt FROM ai_providers`).all<any>();
    const total = Number(countRs.results?.[0]?.cnt || 0);
    return {
      data: (listRs.results || []).map(rowToProvider),
      total,
      pageNumber: Math.ceil(total / pageSize),
    };
  }

  async getById(id: string): Promise<AiProvider | null> {
    const row = await this.db
      .prepare(
        `SELECT id, name, provider, base_url, model, api_key, active, created_at, updated_at
         FROM ai_providers WHERE id = ? LIMIT 1`
      )
      .bind(id)
      .first<any>();
    return row ? rowToProvider(row) : null;
  }

  async create(input: AiProviderCreateInput): Promise<AiProvider> {
    const id = newId24();
    if (input.active) {
      await this.db.prepare(`UPDATE ai_providers SET active = 0 WHERE active = 1`).run();
    }
    await this.db
      .prepare(
        `INSERT INTO ai_providers (id, name, provider, base_url, model, api_key, active)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        id,
        input.name,
        input.provider,
        input.baseURL,
        input.model,
        input.apiKey,
        input.active ? 1 : 0
      )
      .run();
    return (await this.getById(id))!;
  }

  async update(id: string, input: AiProviderUpdateInput): Promise<AiProvider | null> {
    const current = await this.getById(id);
    if (!current) return null;
    if (input.active === true) {
      await this.db.prepare(`UPDATE ai_providers SET active = 0 WHERE id <> ?`).bind(id).run();
    }

    const fields: string[] = [];
    const params: unknown[] = [];
    if (input.name !== undefined) {
      fields.push('name = ?');
      params.push(input.name);
    }
    if (input.provider !== undefined) {
      fields.push('provider = ?');
      params.push(input.provider);
    }
    if (input.baseURL !== undefined) {
      fields.push('base_url = ?');
      params.push(input.baseURL);
    }
    if (input.model !== undefined) {
      fields.push('model = ?');
      params.push(input.model);
    }
    if (input.apiKey !== undefined) {
      fields.push('api_key = ?');
      params.push(input.apiKey);
    }
    if (input.active !== undefined) {
      fields.push('active = ?');
      params.push(input.active ? 1 : 0);
    }
    if (!fields.length) return current;
    fields.push("updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')");
    await this.db
      .prepare(`UPDATE ai_providers SET ${fields.join(', ')} WHERE id = ?`)
      .bind(...params, id)
      .run();
    return this.getById(id);
  }

  async delete(id: string): Promise<boolean> {
    const res = await this.db.prepare(`DELETE FROM ai_providers WHERE id = ?`).bind(id).run();
    return (res.meta?.rows_written ?? 0) > 0;
  }

  async setActive(id: string): Promise<AiProvider | null> {
    const current = await this.getById(id);
    if (!current) return null;
    await this.db.prepare(`UPDATE ai_providers SET active = 0 WHERE id <> ?`).bind(id).run();
    await this.db.prepare(`UPDATE ai_providers SET active = 1 WHERE id = ?`).bind(id).run();
    return this.getById(id);
  }

  async getConfigById(id: string): Promise<AiProviderConfig | null> {
    const row = await this.db
      .prepare(
        `SELECT id, name, provider, base_url, model, api_key, active, created_at, updated_at
         FROM ai_providers WHERE id = ? LIMIT 1`
      )
      .bind(id)
      .first<any>();
    return row ? rowToConfig(row) : null;
  }

  async getActiveConfig(): Promise<AiProviderConfig | null> {
    const row = await this.db
      .prepare(
        `SELECT id, name, provider, base_url, model, api_key, active, created_at, updated_at
         FROM ai_providers WHERE active = 1 LIMIT 1`
      )
      .first<any>();
    return row ? rowToConfig(row) : null;
  }
}
