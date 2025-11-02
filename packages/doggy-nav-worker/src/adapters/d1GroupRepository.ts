import type { Group } from 'doggy-nav-core';
import type { GroupRepository, GroupListOptions } from 'doggy-nav-core';

function rowToGroup(row: any): Group {
  return {
    id: String(row.id),
    slug: row.slug,
    displayName: row.displayName,
    description: row.description ?? '',
    createdAt: row.createdAt ?? undefined,
    updatedAt: row.updatedAt ?? undefined,
  };
}

export class D1GroupRepository implements GroupRepository {
  constructor(private readonly db: D1Database) {}

  async getById(id: string): Promise<Group | null> {
    const stmt = this.db.prepare(
      `SELECT id, slug, displayName, description, createdAt, updatedAt FROM groups WHERE id = ? LIMIT 1`
    );
    const row = await stmt.bind(id).first<any>();
    return row ? rowToGroup(row) : null;
  }

  async list(options: GroupListOptions) {
    const { pageSize, pageNumber, filter } = options;
    const offset = pageSize * pageNumber - pageSize;

    const conds: string[] = [];
    const params: any[] = [];

    if (filter?.slugs && filter.slugs.length > 0) {
      const placeholders = filter.slugs.map(() => '?').join(',');
      conds.push(`slug IN (${placeholders})`);
      params.push(...filter.slugs);
    } else if (filter?.slugs && filter.slugs.length === 0) {
      // Empty result when user has no groups
      return { data: [], total: 0, pageNumber: 0 };
    }

    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

    const rows = await this.db
      .prepare(
        `SELECT id, slug, displayName, description, createdAt, updatedAt
         FROM groups ${where}
         ORDER BY rowid DESC
         LIMIT ? OFFSET ?`
      )
      .bind(...params, pageSize, offset)
      .all<any>();

    const countRow = await this.db
      .prepare(`SELECT COUNT(1) as cnt FROM groups ${where}`)
      .bind(...params)
      .first<{ cnt: number }>();

    const total = Number(countRow?.cnt || 0);
    return {
      data: (rows?.results || rows as any[]).map(rowToGroup),
      total,
      pageNumber: Math.ceil(total / pageSize),
    };
  }
}

export default D1GroupRepository;
