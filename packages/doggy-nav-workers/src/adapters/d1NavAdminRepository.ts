import {
  type NavAdminRepository,
  type NavAdminCreateInput,
  type NavAdminUpdateInput,
  nowChromeTime,
} from 'doggy-nav-core';
import { newId24 } from '../utils/id';

export default class D1NavAdminRepository implements NavAdminRepository {
  constructor(private readonly db: D1Database) {}

  async create(input: NavAdminCreateInput): Promise<{ id: string }> {
    const id = newId24();
    const createTime = nowChromeTime(); // Chrome-like high-precision epoch ticks
    const vis = (input.audience?.visibility as any) || 'public';
    const tagsJson = JSON.stringify(Array.isArray(input.tags) ? input.tags : []);

    await this.db
      .prepare(
        `INSERT INTO bookmarks (id, category_id, name, href, description, logo, author_name, author_url, create_time, tags, audience_visibility, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        id,
        input.categoryId || null,
        String(input.name),
        String(input.href),
        input.desc || '',
        input.logo || '',
        input.authorName || '',
        input.authorUrl || '',
        createTime,
        tagsJson,
        vis,
        1 // wait for audit by default (server parity)
      )
      .run();

    if (vis === 'restricted') {
      const allowRoles: string[] = Array.isArray(input.audience?.allowRoles)
        ? input.audience!.allowRoles!
        : [];
      const allowGroups: string[] = Array.isArray(input.audience?.allowGroups)
        ? input.audience!.allowGroups!
        : [];
      for (const rid of allowRoles) {
        await this.db
          .prepare(`INSERT INTO bookmark_role_permissions (bookmark_id, role_id) VALUES (?, ?)`)
          .bind(id, rid)
          .run();
      }
      for (const gid of allowGroups) {
        await this.db
          .prepare(`INSERT INTO bookmark_group_permissions (bookmark_id, group_id) VALUES (?, ?)`)
          .bind(id, gid)
          .run();
      }
    }

    return { id };
  }

  async update(id: string, input: NavAdminUpdateInput): Promise<{ id: string } | null> {
    const fields: string[] = [];
    const params: any[] = [];
    if (input.name !== undefined) {
      fields.push('name = ?');
      params.push(String(input.name));
    }
    if (input.href !== undefined) {
      fields.push('href = ?');
      params.push(String(input.href));
    }
    if (input.desc !== undefined) {
      fields.push('description = ?');
      params.push(input.desc || '');
    }
    if (input.logo !== undefined) {
      fields.push('logo = ?');
      params.push(input.logo || '');
    }
    if (input.categoryId !== undefined) {
      fields.push('category_id = ?');
      params.push(input.categoryId || null);
    }
    if (input.authorName !== undefined) {
      fields.push('author_name = ?');
      params.push(input.authorName || '');
    }
    if (input.authorUrl !== undefined) {
      fields.push('author_url = ?');
      params.push(input.authorUrl || '');
    }
    if (input.tags !== undefined) {
      const tagsJson = JSON.stringify(Array.isArray(input.tags) ? input.tags : []);
      fields.push('tags = ?');
      params.push(tagsJson);
    }
    if (fields.length) {
      await this.db
        .prepare(`UPDATE bookmarks SET ${fields.join(', ')} WHERE id = ?`)
        .bind(...params, id)
        .run();
    }
    if (input.audience) {
      await this.db
        .prepare('DELETE FROM bookmark_role_permissions WHERE bookmark_id = ?')
        .bind(id)
        .run();
      await this.db
        .prepare('DELETE FROM bookmark_group_permissions WHERE bookmark_id = ?')
        .bind(id)
        .run();
      await this.db
        .prepare(`UPDATE bookmarks SET audience_visibility = ? WHERE id = ?`)
        .bind((input.audience.visibility as any) || 'public', id)
        .run();
      if (input.audience.visibility === 'restricted') {
        const allowRoles: string[] = Array.isArray(input.audience.allowRoles)
          ? input.audience.allowRoles
          : [];
        const allowGroups: string[] = Array.isArray(input.audience.allowGroups)
          ? input.audience.allowGroups
          : [];
        for (const rid of allowRoles) {
          await this.db
            .prepare('INSERT INTO bookmark_role_permissions (bookmark_id, role_id) VALUES (?, ?)')
            .bind(id, rid)
            .run();
        }
        for (const gid of allowGroups) {
          await this.db
            .prepare('INSERT INTO bookmark_group_permissions (bookmark_id, group_id) VALUES (?, ?)')
            .bind(id, gid)
            .run();
        }
      }
    }
    return { id };
  }

  async delete(id: string): Promise<boolean> {
    const res = await this.db.prepare('DELETE FROM bookmarks WHERE id = ?').bind(id).run();
    return (res.meta?.rows_written ?? 0) > 0;
  }

  async setAudit(id: string, status: number, reason?: string): Promise<boolean> {
    const res = await this.db
      .prepare(
        `UPDATE bookmarks SET status = ?, audit_time = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?`
      )
      .bind(status, id)
      .run();
    // reason not stored in schema; ignore
    return (res.meta?.rows_written ?? 0) > 0;
  }
}
