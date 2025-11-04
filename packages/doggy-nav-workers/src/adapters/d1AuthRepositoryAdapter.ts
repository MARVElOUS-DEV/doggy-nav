import type { AuthRepository, AuthUser } from 'doggy-nav-core';
import { PasswordUtils } from '../utils/passwordUtils';

export default class D1AuthRepositoryAdapter implements AuthRepository {
  constructor(private readonly db: D1Database) {}

  async verifyCredentials(identifier: string, password: string): Promise<{ userId: string } | null> {
    const id = String(identifier || '').trim();
    if (!id || !password) return null;
    let row: any | null = null;
    if (id.includes('@')) {
      row = await this.db
        .prepare(`SELECT id, password_hash, is_active FROM users WHERE email = ? LIMIT 1`)
        .bind(id.toLowerCase())
        .first<any>();
    }
    if (!row) {
      row = await this.db
        .prepare(`SELECT id, password_hash, is_active FROM users WHERE username = ? LIMIT 1`)
        .bind(id)
        .first<any>();
    }
    if (!row || !row.password_hash) return null;
    if (!row.is_active) return null;
    const ok = await PasswordUtils.verifyPassword(password, row.password_hash);
    return ok ? { userId: String(row.id) } : null;
  }

  async loadAuthUser(userId: string): Promise<AuthUser> {
    const u = await this.db
      .prepare(`SELECT id, username, email, avatar FROM users WHERE id = ? LIMIT 1`)
      .bind(userId)
      .first<any>();
    if (!u) throw new Error('User not found');
    const rolesRs = await this.db
      .prepare(`SELECT r.slug FROM roles r JOIN user_roles ur ON ur.role_id = r.id WHERE ur.user_id = ?`)
      .bind(userId)
      .all<any>();
    const groupsRs = await this.db
      .prepare(`SELECT g.slug FROM groups g JOIN user_groups ug ON ug.group_id = g.id WHERE ug.user_id = ?`)
      .bind(userId)
      .all<any>();
    const roleSlugs = (rolesRs.results || []).map((r: any) => String(r.slug)).filter(Boolean);
    const groupSlugs = (groupsRs.results || []).map((g: any) => String(g.slug)).filter(Boolean);
    // Aggregate permissions: from roles + user extras
    const permsFromRolesRs = await this.db
      .prepare(`SELECT permissions FROM roles WHERE slug IN (${roleSlugs.map(() => '?').join(',') || "''"})`)
      .bind(...roleSlugs)
      .all<any>();
    const fromRoles: string[] = [];
    for (const r of permsFromRolesRs.results || []) {
      try { fromRoles.push(...(JSON.parse(r.permissions || '[]') as string[])); } catch {}
    }
    const userRow = await this.db
      .prepare(`SELECT extra_permissions FROM users WHERE id = ? LIMIT 1`)
      .bind(userId)
      .first<any>();
    const extras: string[] = (() => { try { return JSON.parse(userRow?.extra_permissions || '[]'); } catch { return []; } })();
    const permissions = Array.from(new Set([...fromRoles, ...extras]));
    return {
      id: String(u.id),
      username: String(u.username),
      email: u.email ?? undefined,
      avatar: u.avatar ?? undefined,
      roles: roleSlugs,
      groups: groupSlugs,
      permissions,
    };
  }

  async recordSuccessfulLogin(userId: string): Promise<void> {
    await this.db
      .prepare(`UPDATE users SET last_login_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?`)
      .bind(userId)
      .run();
  }
}
