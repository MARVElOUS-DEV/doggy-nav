import type { PromptRepository } from 'doggy-nav-core';
import type { PageQuery, PageResult } from 'doggy-nav-core';
import type { Prompt } from 'doggy-nav-core';
import { newId24 } from '../utils/id';

function rowToPrompt(row: any): Prompt {
  return {
    id: String(row.id),
    name: String(row.name),
    content: String(row.content ?? ''),
    active: Number(row.active ?? 0) === 1,
    createdAt: row.created_at ? String(row.created_at) : undefined,
    updatedAt: row.updated_at ? String(row.updated_at) : undefined,
  };
}

export default class D1PromptRepository implements PromptRepository {
  constructor(private readonly db: D1Database) {}

  async list(page: PageQuery): Promise<PageResult<Prompt>> {
    const pageSize = Math.min(Math.max(Number(page.pageSize) || 10, 1), 200);
    const pageNumber = Math.max(Number(page.pageNumber) || 1, 1);
    const offset = (pageNumber - 1) * pageSize;

    const listRs = await this.db
      .prepare(`SELECT id, name, content, active, created_at, updated_at FROM prompts ORDER BY created_at DESC LIMIT ? OFFSET ?`)
      .bind(pageSize, offset)
      .all<any>();
    const countRs = await this.db.prepare(`SELECT COUNT(1) as cnt FROM prompts`).all<any>();
    const total = Number((countRs.results?.[0]?.cnt as number) || 0);
    const rows: any[] = listRs.results || [];
    return { data: rows.map(rowToPrompt), total, pageNumber: Math.ceil(total / pageSize) };
  }

  async getById(id: string): Promise<Prompt | null> {
    const row = await this.db
      .prepare(`SELECT id, name, content, active, created_at, updated_at FROM prompts WHERE id = ? LIMIT 1`)
      .bind(id)
      .first<any>();
    return row ? rowToPrompt(row) : null;
  }

  async create(input: { name: string; content: string; active?: boolean }): Promise<Prompt> {
    const id = newId24();
    const active = input.active ? 1 : 0;
    if (active === 1) {
      await this.db.prepare(`UPDATE prompts SET active = 0`).run();
    }
    await this.db
      .prepare(
        `INSERT INTO prompts (id, name, content, active, created_at, updated_at) VALUES (?, ?, ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now'))`
      )
      .bind(id, input.name, input.content, active)
      .run();
    return (await this.getById(id))!;
  }

  async update(
    id: string,
    input: { name?: string; content?: string; active?: boolean }
  ): Promise<Prompt | null> {
    const current = await this.getById(id);
    if (!current) return null;
    const name = input.name ?? current.name;
    const content = input.content ?? current.content;
    const active = input.active === undefined ? (current.active ? 1 : 0) : input.active ? 1 : 0;
    if (active === 1) {
      await this.db.prepare(`UPDATE prompts SET active = 0`).run();
    }
    await this.db
      .prepare(
        `UPDATE prompts SET name = ?, content = ?, active = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?`
      )
      .bind(name, content, active, id)
      .run();
    return this.getById(id);
  }

  async delete(id: string): Promise<boolean> {
    const res = await this.db.prepare(`DELETE FROM prompts WHERE id = ?`).bind(id).run();
    return (res.meta?.rows_written ?? 0) > 0;
  }

  async getActive(): Promise<Prompt | null> {
    const row = await this.db
      .prepare(`SELECT id, name, content, active, created_at, updated_at FROM prompts WHERE active = 1 LIMIT 1`)
      .first<any>();
    return row ? rowToPrompt(row) : null;
  }

  async setActive(id: string): Promise<Prompt | null> {
    await this.db.prepare(`UPDATE prompts SET active = 0`).run();
    await this.db
      .prepare(
        `UPDATE prompts SET active = 1, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?`
      )
      .bind(id)
      .run();
    return this.getById(id);
  }
}
