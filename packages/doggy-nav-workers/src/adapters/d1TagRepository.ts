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
}
