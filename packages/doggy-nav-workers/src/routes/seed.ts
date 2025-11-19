import { Hono } from 'hono';
import bcrypt from 'bcryptjs';
import * as Core from 'doggy-nav-core';

type Env = {
  DB: D1Database;
  SEED_TOKEN?: string;
  ADMIN_USERNAME?: string;
  ADMIN_EMAIL?: string;
  ADMIN_PASSWORD?: string;
  ADMIN_NICKNAME?: string;
};

const seedRoutes = new Hono<{ Bindings: Env }>();

async function ensureSystemMetaTable(db: D1Database) {
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS system_meta (
        meta_key TEXT PRIMARY KEY,
        meta_value TEXT NOT NULL,
        created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
        updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
      )`
    )
    .run();
}

async function hasMeta(db: D1Database, key: string) {
  const row = await db
    .prepare('SELECT meta_value FROM system_meta WHERE meta_key=? LIMIT 1')
    .bind(key)
    .first();
  return !!row;
}

async function setMeta(db: D1Database, key: string, value: string) {
  await db
    .prepare(
      `INSERT INTO system_meta (meta_key, meta_value) VALUES (?,?)
      ON CONFLICT(meta_key) DO UPDATE SET meta_value=excluded.meta_value, updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now')`
    )
    .bind(key, value)
    .run();
}

seedRoutes.post('/defaults', async (c) => {
  const token = c.req.query('token');
  if (!c.env.SEED_TOKEN || token !== c.env.SEED_TOKEN) return c.text('forbidden', 403);

  await ensureSystemMetaTable(c.env.DB);
  if (await hasMeta(c.env.DB, 'seed:defaults')) return c.json({ ok: true, skipped: true });

  const username = c.env.ADMIN_USERNAME || 'admin';
  const email = c.env.ADMIN_EMAIL || 'admin@doggy-nav.cn';
  const plain = c.env.ADMIN_PASSWORD || 'Admin123';
  const nick = c.env.ADMIN_NICKNAME || 'Administrator';
  const hash = await bcrypt.hash(plain, 12);

  const writers: Core.SeedWriters = {
    async ensureRole(r: Core.RoleData): Promise<string> {
      await c.env.DB.prepare(
        'INSERT OR IGNORE INTO roles (slug, display_name, description, permissions, is_system) VALUES (?,?,?,?,?)'
      )
        .bind(r.slug, r.displayName, '', JSON.stringify(r.permissions || []), r.isSystem ? 1 : 0)
        .run();
      const row = await c.env.DB.prepare('SELECT id FROM roles WHERE slug=? LIMIT 1')
        .bind(r.slug)
        .first();
      return String((row as any)?.id);
    },
    async ensureGroup(g: Core.GroupData): Promise<string> {
      await c.env.DB.prepare(
        'INSERT OR IGNORE INTO groups (slug, display_name, description) VALUES (?,?,?)'
      )
        .bind(g.slug, g.displayName, g.description || '')
        .run();
      const row = await c.env.DB.prepare('SELECT id FROM groups WHERE slug=? LIMIT 1')
        .bind(g.slug)
        .first();
      return String((row as any)?.id);
    },
    async ensureUser(u: {
      username: string;
      email: string;
      passwordHash: string;
      nickName?: string;
    }): Promise<string> {
      const ex = await c.env.DB.prepare('SELECT id FROM users WHERE email=? LIMIT 1')
        .bind(u.email)
        .first();
      if (ex?.id) return String(ex.id);
      await c.env.DB.prepare(
        'INSERT INTO users (username, email, password_hash, is_active, nick_name) VALUES (?,?,?,?,?)'
      )
        .bind(u.username, u.email, u.passwordHash, 1, u.nickName || '')
        .run();
      const row = await c.env.DB.prepare('SELECT id FROM users WHERE email=? LIMIT 1')
        .bind(u.email)
        .first();
      return String((row as any)?.id);
    },
    async addUserToRole(uid: string, rid: string): Promise<void> {
      await c.env.DB.prepare('INSERT OR IGNORE INTO user_roles (user_id, role_id) VALUES (?,?)')
        .bind(uid, rid)
        .run();
    },
    async addUserToGroup(uid: string, gid: string): Promise<void> {
      await c.env.DB.prepare('INSERT OR IGNORE INTO user_groups (user_id, group_id) VALUES (?,?)')
        .bind(uid, gid)
        .run();
    },
    async upsertTopCategory(): Promise<string> {
      throw new Error('not used');
    },
    async bookmarkExists(): Promise<boolean> {
      return false;
    },
    async insertBookmark(): Promise<void> {},
  } as any;

  await Core.seedDefaults(writers, { username, email, password: hash, nickName: nick });
  await setMeta(c.env.DB, 'seed:defaults', new Date().toISOString());
  return c.json({ ok: true });
});

seedRoutes.post('/categories', async (c) => {
  const token = c.req.query('token');
  if (!c.env.SEED_TOKEN || token !== c.env.SEED_TOKEN) return c.text('forbidden', 403);

  await ensureSystemMetaTable(c.env.DB);
  if (await hasMeta(c.env.DB, 'seed:categories')) return c.json({ ok: true, skipped: true });

  const writers: Core.SeedWriters = {
    async ensureRole(): Promise<string> {
      throw new Error('not used');
    },
    async ensureGroup(): Promise<string> {
      throw new Error('not used');
    },
    async ensureUser(): Promise<string> {
      throw new Error('not used');
    },
    async addUserToRole(): Promise<void> {},
    async addUserToGroup(): Promise<void> {},
    async upsertTopCategory({
      name,
      description,
      icon,
      createAt,
      parentVirtualId,
    }: Core.CategoryData & { parentVirtualId: string }): Promise<string> {
      const ex = await c.env.DB.prepare('SELECT id FROM categories WHERE name=? LIMIT 1')
        .bind(name)
        .first();
      if (ex?.id) return String(ex.id);
      await c.env.DB.prepare(
        "INSERT INTO categories (name, category_id, description, create_at, only_folder, icon, show_in_menu, audience_visibility) VALUES (?,?,?,?,?,?,?,'public')"
      )
        .bind(name, parentVirtualId, description || '', createAt, 0, icon || '', 1)
        .run();
      const row = await c.env.DB.prepare('SELECT id FROM categories WHERE name=? LIMIT 1')
        .bind(name)
        .first();
      return String((row as any)?.id);
    },
    async bookmarkExists(
      catId: string,
      { name, href }: { name: string; href: string }
    ): Promise<boolean> {
      const ex = await c.env.DB.prepare(
        'SELECT id FROM bookmarks WHERE category_id=? AND name=? AND href=? LIMIT 1'
      )
        .bind(catId, name, href)
        .first();
      return !!ex?.id;
    },
    async insertBookmark(
      catId: string,
      { name, href, desc, detail, logo, createTime }: Core.BookmarkData
    ): Promise<void> {
      const detailValue = detail ?? desc ?? '';
      await c.env.DB.prepare(
        `INSERT INTO bookmarks (id, category_id, name, href, description, detail, logo, author_name, author_url, audit_time, create_time, tags, view_count, star_count, status, is_favorite, url_status)
          VALUES (lower(hex(randomblob(4)) || hex(randomblob(4)) || hex(randomblob(4))), ?, ?, ?, ?, ?, '', '', NULL, ?, '[]', 0, 0, 0, 0, 'unknown')`
      )
        .bind(catId, name, href, desc || '', detailValue, logo || '', createTime || 0)
        .run();
    },
  } as any;

  await Core.seedCategories(writers, { force: false });
  await setMeta(c.env.DB, 'seed:categories', new Date().toISOString());
  return c.json({ ok: true });
});

export default seedRoutes;
