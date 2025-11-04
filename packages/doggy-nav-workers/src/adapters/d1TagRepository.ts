import type { TagRepository } from 'doggy-nav-core';
import type { PageQuery, PageResult } from 'doggy-nav-core';
import type { Tag } from 'doggy-nav-core';

function rowToTag(row: any): Tag {
  return {
    id: String(row.id),
    name: String(row.name),
    parentName: null,
  };
}

export default class D1TagRepository implements TagRepository {
  constructor(private readonly db: D1Database) {}

  async list(page: PageQuery): Promise<PageResult<Tag>> {
    const pageSize = Math.min(Math.max(Number(page.pageSize) || 10, 1), 200);
    const pageNumber = Math.max(Number(page.pageNumber) || 1, 1);
    const offset = (pageNumber - 1) * pageSize;

    const listRs = await this.db
      .prepare(`SELECT id, name FROM tags ORDER BY created_at DESC LIMIT ? OFFSET ?`)
      .bind(pageSize, offset)
      .all<any>();

    const countRs = await this.db.prepare(`SELECT COUNT(1) as cnt FROM tags`).all<any>();

    const total = Number((countRs.results?.[0]?.cnt as number) || 0);
    const rows: any[] = listRs.results || [];

    return {
      data: rows.map(rowToTag),
      total,
      pageNumber: Math.ceil(total / pageSize),
    };
  }

  async getById(id: string): Promise<Tag | null> {
    const row = await this.db
      .prepare(`SELECT id, name FROM tags WHERE id = ? LIMIT 1`)
      .bind(id)
      .first<any>();
    return row ? rowToTag(row) : null;
  }

  async getByName(name: string): Promise<Tag | null> {
    const row = await this.db
      .prepare(`SELECT id, name FROM tags WHERE name = ? LIMIT 1`)
      .bind(name)
      .first<any>();
    return row ? rowToTag(row) : null;
  }

  private toSlug(s: string): string {
    const base = s
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    return base || 'tag';
  }

  async create(name: string): Promise<Tag> {
    const id = (globalThis.crypto?.randomUUID?.() as string) || Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    const slug = this.toSlug(name);
    await this.db
      .prepare(`INSERT INTO tags (id, name, slug, description) VALUES (?, ?, ?, '')`)
      .bind(id, name, slug)
      .run();
    return (await this.getById(id))!;
  }

  async update(id: string, name: string): Promise<Tag | null> {
    const slug = this.toSlug(name);
    await this.db
      .prepare(
        `UPDATE tags SET name = ?, slug = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?`
      )
      .bind(name, slug, id)
      .run();
    return this.getById(id);
  }

  async delete(id: string): Promise<boolean> {
    const res = await this.db.prepare(`DELETE FROM tags WHERE id = ?`).bind(id).run();
    return (res.meta?.rows_written ?? 0) > 0;
  }
}
