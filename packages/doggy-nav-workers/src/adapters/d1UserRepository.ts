import type { User, UserListOptions } from 'doggy-nav-core';

function rowToUser(row: any): User {
  return {
    id: String(row.id),
    username: row.username,
    email: row.email,
    isActive: Boolean(row.is_active),
    nickName: row.nick_name,
    phone: row.phone,
    extraPermissions: JSON.parse(row.extra_permissions || '[]'),
    lastLoginAt: row.last_login_at ? new Date(row.last_login_at) : null,
    createdAt: row.created_at ? new Date(row.created_at) : undefined,
    updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
    avatar: row.avatar,
  };
}

export class D1UserRepository {
  constructor(private readonly db: D1Database) {}

  async getById(id: string): Promise<User | null> {
    const stmt = this.db.prepare(
      `SELECT id, username, email, is_active, nick_name, phone, extra_permissions,
              last_login_at, created_at, updated_at, avatar
       FROM users WHERE id = ? LIMIT 1`
    );
    const row = await stmt.bind(id).first<any>();
    return row ? rowToUser(row) : null;
  }

  async getByEmail(email: string): Promise<User | null> {
    const stmt = this.db.prepare(
      `SELECT id, username, email, is_active, nick_name, phone, extra_permissions,
              last_login_at, created_at, updated_at, avatar
       FROM users WHERE email = ? LIMIT 1`
    );
    const row = await stmt.bind(email).first<any>();
    return row ? rowToUser(row) : null;
  }

  async getByUsername(username: string): Promise<User | null> {
    const stmt = this.db.prepare(
      `SELECT id, username, email, is_active, nick_name, phone, extra_permissions,
              last_login_at, created_at, updated_at, avatar
       FROM users WHERE username = ? LIMIT 1`
    );
    const row = await stmt.bind(username).first<any>();
    return row ? rowToUser(row) : null;
  }

  async list(options: UserListOptions) {
    const { pageSize, pageNumber, filter } = options;
    const offset = pageSize * pageNumber - pageSize;

    const conds: string[] = [];
    const params: any[] = [];

    if (filter?.emails && filter.emails.length > 0) {
      const placeholders = filter.emails.map(() => '?').join(',');
      conds.push(`email IN (${placeholders})`);
      params.push(...filter.emails);
    }

    if (filter?.usernames && filter.usernames.length > 0) {
      const placeholders = filter.usernames.map(() => '?').join(',');
      conds.push(`username IN (${placeholders})`);
      params.push(...filter.usernames);
    }

    if (filter?.isActive !== undefined) {
      conds.push(`is_active = ?`);
      params.push(filter.isActive ? 1 : 0);
    }

    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

    const rows = await this.db
      .prepare(
        `SELECT id, username, email, is_active, nick_name, phone, extra_permissions,
                last_login_at, created_at, updated_at, avatar
         FROM users ${where}
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?`
      )
      .bind(...params, pageSize, offset)
      .all<any>();

    const countRow = await this.db
      .prepare(`SELECT COUNT(1) as cnt FROM users ${where}`)
      .bind(...params)
      .first<{ cnt: number }>();

    const total = Number(countRow?.cnt || 0);
    return {
      data: (rows?.results || rows as any[]).map(rowToUser),
      total,
      pageNumber: Math.ceil(total / pageSize),
    };
  }

  async create(userData: {
    username: string;
    email: string;
    passwordHash: string;
    nickName?: string;
    phone?: string;
    avatar?: string;
  }): Promise<User> {
    const id = (globalThis.crypto?.randomUUID?.() as string) ||
               (Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2));

    const stmt = this.db.prepare(`
      INSERT INTO users (
        id, username, email, password_hash, nick_name, phone, avatar
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    await stmt.bind(
      id,
      userData.username,
      userData.email,
      userData.passwordHash,
      userData.nickName || '',
      userData.phone || '',
      userData.avatar || null
    ).run();

    return await this.getById(id)!;
  }

  async update(id: string, updates: Partial<{
    username: string;
    email: string;
    passwordHash: string;
    isActive: boolean;
    nickName: string;
    phone: string;
    avatar: string;
    lastLoginAt: Date | null;
    extraPermissions: string[];
  }>): Promise<User | null> {
    const fields: string[] = [];
    const params: any[] = [];

    if (updates.username !== undefined) {
      fields.push('username = ?');
      params.push(updates.username);
    }
    if (updates.email !== undefined) {
      fields.push('email = ?');
      params.push(updates.email);
    }
    if (updates.passwordHash !== undefined) {
      fields.push('password_hash = ?');
      params.push(updates.passwordHash);
    }
    if (updates.isActive !== undefined) {
      fields.push('is_active = ?');
      params.push(updates.isActive ? 1 : 0);
    }
    if (updates.nickName !== undefined) {
      fields.push('nick_name = ?');
      params.push(updates.nickName);
    }
    if (updates.phone !== undefined) {
      fields.push('phone = ?');
      params.push(updates.phone);
    }
    if (updates.avatar !== undefined) {
      fields.push('avatar = ?');
      params.push(updates.avatar);
    }
    if (updates.lastLoginAt !== undefined) {
      fields.push('last_login_at = ?');
      params.push(updates.lastLoginAt ? updates.lastLoginAt.toISOString() : null);
    }
    if (updates.extraPermissions !== undefined) {
      fields.push('extra_permissions = ?');
      params.push(JSON.stringify(updates.extraPermissions));
    }

    if (fields.length === 0) {
      return this.getById(id);
    }

    fields.push('updated_at = strftime(\'%Y-%m-%dT%H:%M:%fZ\', \'now\')');

    const stmt = this.db.prepare(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`
    );

    await stmt.bind(...params, id).run();

    return await this.getById(id);
  }

  async delete(id: string): Promise<boolean> {
    const stmt = this.db.prepare('DELETE FROM users WHERE id = ?');
    const result = await stmt.bind(id).run();

    return result.meta.rows_written > 0;
  }

  async getUserRoles(userId: string): Promise<string[]> {
    const stmt = this.db.prepare(`
      SELECT r.id FROM roles r
      JOIN user_roles ur ON r.id = ur.role_id
      WHERE ur.user_id = ?
    `);
    const rows = await stmt.bind(userId).all<any>();
    return (rows?.results || rows as any[]).map(row => row.id);
  }

  async getUserGroups(userId: string): Promise<string[]> {
    const stmt = this.db.prepare(`
      SELECT g.id FROM groups g
      JOIN user_groups ug ON g.id = ug.group_id
      WHERE ug.user_id = ?
    `);
    const rows = await stmt.bind(userId).all<any>();
    return (rows?.results || rows as any[]).map(row => row.id);
  }

  async setUserRoles(userId: string, roleIds: string[]): Promise<void> {
    // Delete existing roles
    await this.db.prepare('DELETE FROM user_roles WHERE user_id = ?').bind(userId).run();

    // Insert new roles
    if (roleIds.length > 0) {
      const stmt = this.db.prepare('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)');
      for (const roleId of roleIds) {
        await stmt.bind(userId, roleId).run();
      }
    }
  }

  async setUserGroups(userId: string, groupIds: string[]): Promise<void> {
    // Delete existing groups
    await this.db.prepare('DELETE FROM user_groups WHERE user_id = ?').bind(userId).run();

    // Insert new groups
    if (groupIds.length > 0) {
      const stmt = this.db.prepare('INSERT INTO user_groups (user_id, group_id) VALUES (?, ?)');
      for (const groupId of groupIds) {
        await stmt.bind(userId, groupId).run();
      }
    }
  }
}