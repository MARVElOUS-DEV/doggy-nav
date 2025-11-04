import type {
  ApplicationRepository,
  ApplicationCreateInput,
  ApplicationUpdateInput,
} from 'doggy-nav-core';
import type { Application } from 'doggy-nav-core';
import type { PageQuery } from 'doggy-nav-core';

export default class D1ApplicationRepositoryAdapter implements ApplicationRepository {
  constructor(private readonly db: D1Database) {}

  private rowToApp(r: any): Application {
    return {
      id: String(r.id),
      name: r.name,
      description: r.description || '',
      clientSecret: r.client_secret,
      isActive: !!r.is_active,
      allowedOrigins: (() => {
        try { return JSON.parse(r.allowed_origins || '[]'); } catch { return []; }
      })(),
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  }

  async create(input: ApplicationCreateInput): Promise<Application> {
    const id = (globalThis.crypto?.randomUUID?.() as string) || Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    const allowed = JSON.stringify(Array.isArray(input.allowedOrigins) ? input.allowedOrigins : []);
    await this.db
      .prepare(
        `INSERT INTO client_applications (id, name, description, client_secret, is_active, allowed_origins)
         VALUES (?, ?, ?, ?, 1, ?)`
      )
      .bind(id, input.name, input.description || '', input.clientSecret, allowed)
      .run();
    const row = await this.db
      .prepare(`SELECT * FROM client_applications WHERE id = ? LIMIT 1`)
      .bind(id)
      .first<any>();
    return this.rowToApp(row);
  }

  async update(id: string, updates: ApplicationUpdateInput): Promise<Application | null> {
    const fields: string[] = [];
    const params: any[] = [];
    if (updates.name !== undefined) { fields.push('name = ?'); params.push(updates.name); }
    if (updates.description !== undefined) { fields.push('description = ?'); params.push(updates.description || ''); }
    if (updates.allowedOrigins !== undefined) { fields.push('allowed_origins = ?'); params.push(JSON.stringify(updates.allowedOrigins || [])); }
    if (updates.isActive !== undefined) { fields.push('is_active = ?'); params.push(updates.isActive ? 1 : 0); }
    if (!fields.length) return this.getById(id);
    fields.push("updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')");
    const res = await this.db.prepare(`UPDATE client_applications SET ${fields.join(', ')} WHERE id = ?`).bind(...params, id).run();
    if ((res.meta?.rows_written ?? 0) === 0) return null;
    return this.getById(id);
  }

  async list(page: PageQuery): Promise<{ applications: Application[]; total: number }> {
    const pageSize = Math.min(Math.max(Number(page.pageSize) || 10, 1), 100);
    const pageNumber = Math.max(Number(page.pageNumber) || 1, 1);
    const offset = (pageNumber - 1) * pageSize;
    const list = await this.db
      .prepare(`SELECT * FROM client_applications ORDER BY created_at DESC LIMIT ? OFFSET ?`)
      .bind(pageSize, offset)
      .all<any>();
    const count = await this.db
      .prepare(`SELECT COUNT(1) as cnt FROM client_applications`)
      .all<any>();
    const total = Number(count.results?.[0]?.cnt || 0);
    const applications = (list.results || []).map((r: any) => this.rowToApp(r));
    return { applications, total };
  }

  async getById(id: string): Promise<Application | null> {
    const row = await this.db
      .prepare(`SELECT * FROM client_applications WHERE id = ? LIMIT 1`)
      .bind(id)
      .first<any>();
    return row ? this.rowToApp(row) : null;
  }

  async getByClientSecret(secret: string): Promise<Application | null> {
    const row = await this.db
      .prepare(`SELECT * FROM client_applications WHERE client_secret = ? LIMIT 1`)
      .bind(secret)
      .first<any>();
    return row ? this.rowToApp(row) : null;
  }

  async setClientSecret(id: string, secret: string): Promise<void> {
    await this.db
      .prepare(`UPDATE client_applications SET client_secret = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?`)
      .bind(secret, id)
      .run();
  }

  async revoke(id: string): Promise<boolean> {
    const res = await this.db
      .prepare(`UPDATE client_applications SET is_active = 0, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?`)
      .bind(id)
      .run();
    return (res.meta?.rows_written ?? 0) > 0;
  }
}
