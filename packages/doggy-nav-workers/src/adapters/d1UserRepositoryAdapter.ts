import type {
  UserRepository as CoreUserRepository,
  UserProfile,
  UpdateProfileInput,
  AdminUserListFilter,
  AdminUserListItem,
  AdminGetUserResponse,
  AdminCreateUserInput,
  AdminUpdateUserInput,
  PageQuery,
} from 'doggy-nav-core';
import { PasswordUtils } from '../utils/passwordUtils';
import { newId24 } from '../utils/id';

function toBool(v: any) {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  const s = String(v ?? '').toLowerCase();
  if (s === 'true' || s === '1') return true;
  if (s === 'false' || s === '0') return false;
  return undefined as any;
}

export default class D1UserRepositoryAdapter implements CoreUserRepository {
  constructor(private readonly db: D1Database) {}

  async getProfile(userId: string): Promise<UserProfile> {
    const row = await this.db
      .prepare(
        `SELECT id, username, email, avatar, created_at, updated_at FROM users WHERE id = ? LIMIT 1`
      )
      .bind(userId)
      .first<any>();
    if (!row) throw new Error('User not found');

    const roles = await this.getUserRoleSlugs(userId);
    const groups = await this.getUserGroupSlugs(userId);
    const perms = await this.getUserPermissions(userId);
    return {
      id: String(row.id),
      username: String(row.username),
      email: String(row.email),
      avatar: row.avatar ?? null,
      roles,
      groups,
      permissions: perms,
      createdAt: row.created_at || undefined,
      updatedAt: row.updated_at || undefined,
    };
  }

  async updateProfile(userId: string, input: UpdateProfileInput): Promise<UserProfile> {
    const fields: string[] = [];
    const params: any[] = [];
    if (input.email !== undefined) {
      fields.push('email = ?');
      params.push(input.email);
    }
    if (input.avatar !== undefined) {
      fields.push('avatar = ?');
      params.push(input.avatar);
    }
    if (fields.length) {
      fields.push("updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')");
      await this.db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).bind(...params, userId).run();
    }
    return this.getProfile(userId);
  }

  async adminList(filter: AdminUserListFilter, page: PageQuery): Promise<{ list: AdminUserListItem[]; total: number }> {
    const pageSize = Math.min(Math.max(Number(page.pageSize ?? 10) || 10, 1), 100);
    const pageNumber = Math.max(Number(page.pageNumber ?? 1) || 1, 1);
    const offset = (pageNumber - 1) * pageSize;

    const conds: string[] = [];
    const params: any[] = [];
    if (filter.email) {
      conds.push('email = ?');
      params.push(String(filter.email));
    }
    if (filter.account) {
      conds.push('username = ?');
      params.push(String(filter.account));
    }
    if (typeof filter.status !== 'undefined') {
      conds.push('is_active = ?');
      params.push(filter.status ? 1 : 0);
    }
    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

    const rows = await this.db
      .prepare(
        `SELECT id, username, email, nick_name, avatar, is_active, created_at, updated_at
         FROM users ${where}
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?`
      )
      .bind(...params, pageSize, offset)
      .all<any>();
    const listRows: any[] = rows.results || [];

    const cnt = await this.db
      .prepare(`SELECT COUNT(1) as cnt FROM users ${where}`)
      .bind(...params)
      .first<{ cnt: number }>();
    const total = Number(cnt?.cnt || 0);

    const data: AdminUserListItem[] = [];
    for (const r of listRows) {
      const id = String(r.id);
      const roles = await this.getUserRoleSlugs(id);
      const role: 'admin' | 'default' = roles.includes('admin') || roles.includes('sysadmin') ? 'admin' : 'default';
      const groupRows = await this.db
        .prepare(`SELECT g.display_name, g.slug FROM groups g JOIN user_groups ug ON ug.group_id = g.id WHERE ug.user_id = ?`)
        .bind(id)
        .all<any>();
      const groups = (groupRows.results || []).map((g: any) => g.display_name || g.slug).filter(Boolean);
      data.push({
        id,
        account: String(r.username),
        nickName: r.nick_name || r.username,
        avatar: r.avatar || '',
        email: r.email,
        role,
        groups,
        status: r.is_active ? 1 : 0,
        createdAt: r.created_at || undefined,
        updatedAt: r.updated_at || undefined,
      });
    }
    return { list: data, total };
  }

  async adminGetOne(id: string): Promise<AdminGetUserResponse | null> {
    const r = await this.db
      .prepare(
        `SELECT id, username, email, nick_name, phone, is_active FROM users WHERE id = ? LIMIT 1`
      )
      .bind(id)
      .first<any>();
    if (!r) return null;
    const rolesIdsRs = await this.db
      .prepare(`SELECT role_id FROM user_roles WHERE user_id = ?`)
      .bind(id)
      .all<any>();
    const rolesIds = (rolesIdsRs.results || []).map((x: any) => String(x.role_id));
    const groupsIdsRs = await this.db
      .prepare(`SELECT group_id FROM user_groups WHERE user_id = ?`)
      .bind(id)
      .all<any>();
    const groupsIds = (groupsIdsRs.results || []).map((x: any) => String(x.group_id));

    const roleSlugs = await this.getUserRoleSlugs(id);
    const role: 'admin' | 'default' = roleSlugs.includes('admin') || roleSlugs.includes('sysadmin') ? 'admin' : 'default';
    return {
      id: String(r.id),
      account: String(r.username),
      nickName: r.nick_name || r.username,
      email: String(r.email),
      phone: r.phone || '',
      status: !!r.is_active,
      role,
      roles: rolesIds,
      groups: groupsIds,
    };
  }

  async adminCreate(input: AdminCreateUserInput): Promise<{ id: string }> {
    const id = newId24();
    const passwordHash = await PasswordUtils.hashPassword(input.password);
    await this.db
      .prepare(
        `INSERT INTO users (id, username, email, password_hash, nick_name, phone, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(id, input.account, input.email, passwordHash, input.nickName || '', input.phone || '', input.status ? 1 : 0)
      .run();

    if (Array.isArray(input.roles)) {
      const stmt = this.db.prepare('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)');
      for (const rid of input.roles) {
        await stmt.bind(id, rid).run();
      }
    }
    if (Array.isArray(input.groups)) {
      const stmt = this.db.prepare('INSERT INTO user_groups (user_id, group_id) VALUES (?, ?)');
      for (const gid of input.groups) {
        await stmt.bind(id, gid).run();
      }
    }
    return { id };
  }

  async adminUpdate(id: string, input: AdminUpdateUserInput): Promise<boolean> {
    const fields: string[] = [];
    const params: any[] = [];
    if (input.account !== undefined) { fields.push('username = ?'); params.push(input.account); }
    if (input.email !== undefined) { fields.push('email = ?'); params.push(input.email); }
    if (input.password !== undefined) {
      const hash = await PasswordUtils.hashPassword(input.password);
      fields.push('password_hash = ?'); params.push(hash);
    }
    if (input.status !== undefined) { fields.push('is_active = ?'); params.push(input.status ? 1 : 0); }
    if (input.nickName !== undefined) { fields.push('nick_name = ?'); params.push(input.nickName ?? ''); }
    if (input.phone !== undefined) { fields.push('phone = ?'); params.push(input.phone ?? ''); }
    if (fields.length) {
      fields.push("updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')");
      await this.db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).bind(...params, id).run();
    }
    if (input.roles) {
      await this.db.prepare('DELETE FROM user_roles WHERE user_id = ?').bind(id).run();
      const stmt = this.db.prepare('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)');
      for (const rid of input.roles) { await stmt.bind(id, rid).run(); }
    }
    if (input.groups) {
      await this.db.prepare('DELETE FROM user_groups WHERE user_id = ?').bind(id).run();
      const stmt = this.db.prepare('INSERT INTO user_groups (user_id, group_id) VALUES (?, ?)');
      for (const gid of input.groups) { await stmt.bind(id, gid).run(); }
    }
    return true;
  }

  async adminDelete(ids: string[]): Promise<boolean> {
    if (!ids.length) return false;
    let ok = true;
    const del = this.db.prepare('DELETE FROM users WHERE id = ?');
    for (const id of ids) {
      const res = await del.bind(id).run();
      ok = ok && (res.meta.rows_written > 0);
    }
    return ok;
  }

  private async getUserRoleSlugs(userId: string): Promise<string[]> {
    const rs = await this.db
      .prepare(`SELECT r.slug FROM roles r JOIN user_roles ur ON ur.role_id = r.id WHERE ur.user_id = ?`)
      .bind(userId)
      .all<any>();
    const rows: any[] = rs.results || [];
    return rows.map((r) => String(r.slug)).filter(Boolean);
  }

  private async getUserGroupSlugs(userId: string): Promise<string[]> {
    const rs = await this.db
      .prepare(`SELECT g.slug FROM groups g JOIN user_groups ug ON ug.group_id = g.id WHERE ug.user_id = ?`)
      .bind(userId)
      .all<any>();
    const rows: any[] = rs.results || [];
    return rows.map((r) => String(r.slug)).filter(Boolean);
  }

  private async getUserPermissions(userId: string): Promise<string[]> {
    const rolePermsRs = await this.db
      .prepare(
        `SELECT r.permissions FROM roles r JOIN user_roles ur ON ur.role_id = r.id WHERE ur.user_id = ?`
      )
      .bind(userId)
      .all<any>();
    const fromRoles: string[] = [];
    for (const r of rolePermsRs.results || []) {
      try { fromRoles.push(...(JSON.parse(r.permissions || '[]') as string[])); } catch {}
    }
    const userRow = await this.db
      .prepare(`SELECT extra_permissions FROM users WHERE id = ? LIMIT 1`)
      .bind(userId)
      .first<any>();
    const extras: string[] = (() => { try { return JSON.parse(userRow?.extra_permissions || '[]'); } catch { return []; } })();
    return Array.from(new Set([...fromRoles, ...extras]));
  }
}
