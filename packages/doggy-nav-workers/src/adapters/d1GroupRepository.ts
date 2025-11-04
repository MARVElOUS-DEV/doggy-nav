import type { Group } from 'doggy-nav-core';
import type { GroupRepository, GroupListOptions } from 'doggy-nav-core';

function rowToGroup(row: any): Group {
  return {
    id: String(row.id),
    slug: row.slug,
    displayName: row.display_name,
    description: row.description ?? '',
    createdAt: row.created_at ?? undefined,
    updatedAt: row.updated_at ?? undefined,
  };
}

export class D1GroupRepository implements GroupRepository {
  constructor(private readonly db: D1Database) {}

  async getById(id: string): Promise<Group | null> {
    const stmt = this.db.prepare(
      `SELECT id, slug, display_name, description, created_at, updated_at FROM groups WHERE id = ? LIMIT 1`
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

    const result = await this.db
      .prepare(
        `SELECT id, slug, display_name, description, created_at, updated_at
        FROM groups ${where}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?`
      )
      .bind(...params, pageSize, offset)
      .all<any>();
    const rows = (result?.results ?? []) as any[];

    const countRow = await this.db
      .prepare(`SELECT COUNT(1) as cnt FROM groups ${where}`)
      .bind(...params)
      .first<{ cnt: number }>();

    const total = Number(countRow?.cnt || 0);
    return {
      data: rows.map(rowToGroup),
      total,
      pageNumber: Math.ceil(total / pageSize),
    };
  }

  async create(data: { slug: string; displayName: string; description?: string }): Promise<Group> {
    const id = (globalThis.crypto?.randomUUID?.() as string) || cryptoRandomId();
    await this.db
      .prepare(`INSERT INTO groups (id, slug, display_name, description) VALUES (?, ?, ?, ?)`)
      .bind(id, data.slug, data.displayName, data.description ?? '')
      .run();
    return (await this.getById(id))!;
  }

  async update(
    id: string,
    patch: Partial<{ slug: string; displayName: string; description: string }>
  ): Promise<Group | null> {
    const fields: string[] = [];
    const params: any[] = [];
    if (patch.slug !== undefined) {
      fields.push('slug = ?');
      params.push(patch.slug);
    }
    if (patch.displayName !== undefined) {
      fields.push('display_name = ?');
      params.push(patch.displayName);
    }
    if (patch.description !== undefined) {
      fields.push('description = ?');
      params.push(patch.description);
    }
    if (!fields.length) return this.getById(id);
    fields.push("updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')");
    await this.db
      .prepare(`UPDATE groups SET ${fields.join(', ')} WHERE id = ?`)
      .bind(...params, id)
      .run();
    return this.getById(id);
  }

  async delete(id: string): Promise<boolean> {
    const res = await this.db.prepare(`DELETE FROM groups WHERE id = ?`).bind(id).run();
    return (res.meta?.rows_written ?? 0) > 0;
  }

  async setGroupUsers(groupId: string, userIds: string[]): Promise<void> {
    // Remove existing memberships for this group
    await this.db.prepare('DELETE FROM user_groups WHERE group_id = ?').bind(groupId).run();
    if (!userIds?.length) return;
    const stmt = this.db.prepare('INSERT INTO user_groups (user_id, group_id) VALUES (?, ?)');
    for (const uid of userIds) {
      await stmt.bind(uid, groupId).run();
    }
  }
}

export default D1GroupRepository;

function cryptoRandomId() {
  // UUID-like random id; D1 also has randomblob approach, but generate in app for simplicity
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}
