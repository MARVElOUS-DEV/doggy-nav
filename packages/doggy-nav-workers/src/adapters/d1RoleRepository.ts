import type { Role } from 'doggy-nav-core';
import { newId24 } from '../utils/id';

function rowToRole(row: any): Role {
  return {
    id: String(row.id),
    slug: row.slug,
    displayName: row.display_name,
    description: row.description ?? '',
    permissions: JSON.parse(row.permissions || '[]'),
    isSystem: Boolean(row.is_system),
  } as Role;
}

export class D1RoleRepository {
  constructor(private readonly db: D1Database) {}

  async getById(id: string): Promise<Role | null> {
    const stmt = this.db.prepare(
      `SELECT id, slug, display_name, description, permissions, is_system, created_at, updated_at
      FROM roles WHERE id = ? LIMIT 1`
    );
    const row = await stmt.bind(id).first<any>();
    return row ? rowToRole(row) : null;
  }

  async getBySlug(slug: string): Promise<Role | null> {
    const stmt = this.db.prepare(
      `SELECT id, slug, display_name, description, permissions, is_system, created_at, updated_at
       FROM roles WHERE slug = ? LIMIT 1`
    );
    const row = await stmt.bind(slug).first<any>();
    return row ? rowToRole(row) : null;
  }

  async list(options: any) {
    const pageSize = Number(options?.pageSize ?? options?.page?.pageSize ?? 50);
    const pageNumber = Number(options?.pageNumber ?? options?.page?.pageNumber ?? 1);
    const offset = pageSize * pageNumber - pageSize;
    const filter = options?.filter || {};

    const conds: string[] = [];
    const params: any[] = [];

    if (filter?.slugs && filter.slugs.length > 0) {
      const placeholders = filter.slugs.map(() => '?').join(',');
      conds.push(`slug IN (${placeholders})`);
      params.push(...filter.slugs);
    }

    // optional isSystem filter
    if (filter?.isSystem !== undefined) {
      conds.push(`is_system = ?`);
      params.push(filter.isSystem ? 1 : 0);
    }

    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

    const result = await this.db
      .prepare(
        `SELECT id, slug, display_name, description, permissions, is_system, created_at, updated_at
         FROM roles ${where}
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?`
      )
      .bind(...params, pageSize, offset)
      .all<any>();
    const rows = (result?.results ?? []) as any[];

    const countRow = await this.db
      .prepare(`SELECT COUNT(1) as cnt FROM roles ${where}`)
      .bind(...params)
      .first<{ cnt: number }>();

    const total = Number(countRow?.cnt || 0);
    return {
      data: rows.map(rowToRole),
      total,
      pageNumber: Math.ceil(total / pageSize),
    };
  }

  async create(roleData: {
    slug: string;
    displayName: string;
    description?: string;
    permissions?: string[];
    isSystem?: boolean;
  }): Promise<Role> {
    const id = newId24();

    const stmt = this.db.prepare(`
      INSERT INTO roles (
        id, slug, display_name, description, permissions, is_system
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);

    await stmt
      .bind(
        id,
        roleData.slug,
        roleData.displayName,
        roleData.description || '',
        JSON.stringify(roleData.permissions || []),
        roleData.isSystem ? 1 : 0
      )
      .run();

    return (await this.getById(id))!;
  }

  async update(
    id: string,
    updates: Partial<{
      slug: string;
      displayName: string;
      description: string;
      permissions: string[];
      isSystem: boolean;
    }>
  ): Promise<Role | null> {
    const fields: string[] = [];
    const params: any[] = [];

    if (updates.slug !== undefined) {
      fields.push('slug = ?');
      params.push(updates.slug);
    }
    if (updates.displayName !== undefined) {
      fields.push('display_name = ?');
      params.push(updates.displayName);
    }
    if (updates.description !== undefined) {
      fields.push('description = ?');
      params.push(updates.description);
    }
    if (updates.permissions !== undefined) {
      fields.push('permissions = ?');
      params.push(JSON.stringify(updates.permissions));
    }
    if (updates.isSystem !== undefined) {
      fields.push('is_system = ?');
      params.push(updates.isSystem ? 1 : 0);
    }

    if (fields.length === 0) {
      return this.getById(id);
    }

    fields.push("updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')");

    const stmt = this.db.prepare(`UPDATE roles SET ${fields.join(', ')} WHERE id = ?`);

    await stmt.bind(...params, id).run();

    return await this.getById(id);
  }

  async delete(id: string): Promise<boolean> {
    const stmt = this.db.prepare('DELETE FROM roles WHERE id = ?');
    const result = await stmt.bind(id).run();

    return result.meta.rows_written > 0;
  }

  async getRolePermissions(roleId: string): Promise<string[]> {
    const stmt = this.db.prepare('SELECT permissions FROM roles WHERE id = ?');
    const row = await stmt.bind(roleId).first<any>();
    return row ? JSON.parse(row.permissions || '[]') : [];
  }

  async setRolePermissions(roleId: string, permissions: string[]): Promise<void> {
    const stmt = this.db.prepare('UPDATE roles SET permissions = ? WHERE id = ?');
    await stmt.bind(JSON.stringify(permissions), roleId).run();
  }
}
