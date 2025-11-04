#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import bcrypt from 'bcryptjs';
import * as Core from 'doggy-nav-core';

const WORKER_DIR = new URL('..', import.meta.url).pathname;
const USE_REMOTE =
  process.argv.includes('--remote') || process.env.D1_REMOTE === '1' || process.env.REMOTE === '1';
const FORCE = process.argv.includes('--force') || process.env.FORCE === '1';

const DEFAULT_ADMIN = {
  username: process.env.ADMIN_USERNAME || 'admin',
  email: process.env.ADMIN_EMAIL || 'admin@doggy-nav.cn',
  password: process.env.ADMIN_PASSWORD || 'Admin123',
  nickName: process.env.ADMIN_NICKNAME || 'Administrator',
};

// roles/categories defaults now come from doggy-nav-core

function log(msg) {
  console.log(`[d1:seed] ${msg}`);
}
function warn(msg) {
  console.warn(`[d1:seed] ${msg}`);
}
function err(msg) {
  console.error(`[d1:seed] ${msg}`);
}

function hasWrangler() {
  const r = spawnSync('wrangler', ['--version'], { stdio: 'pipe' });
  return r.status === 0;
}

function execSql(sql, { json = false } = {}) {
  const args = ['d1', 'execute', 'DB'];
  if (USE_REMOTE) args.push('--remote');
  args.push('--command', sql);
  if (json) args.push('--json');
  const r = spawnSync('wrangler', args, { cwd: WORKER_DIR, encoding: 'utf8' });
  if (r.status !== 0) {
    throw new Error(r.stderr || 'wrangler d1 execute failed');
  }
  return json ? JSON.parse(r.stdout || '{}') : r.stdout;
}

function execFile(filePath) {
  const args = ['d1', 'execute', 'DB'];
  if (USE_REMOTE) args.push('--remote');
  args.push('--file', filePath);
  const r = spawnSync('wrangler', args, { cwd: WORKER_DIR, encoding: 'utf8' });
  if (r.status !== 0) {
    throw new Error(r.stderr || `wrangler d1 execute --file failed: ${filePath}`);
  }
  return r.stdout;
}

function escapeSql(s) {
  return String(s).replaceAll("'", "''");
}

// --- meta helpers (idempotency markers) ---
function ensureSystemMetaTable() {
  execSql(
    `CREATE TABLE IF NOT EXISTS system_meta (
      meta_key TEXT PRIMARY KEY,
      meta_value TEXT NOT NULL,
      created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
      updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    )`
  );
}

function getMeta(key) {
  const out = execSql(
    `SELECT meta_value FROM system_meta WHERE meta_key='${escapeSql(key)}' LIMIT 1`,
    { json: true }
  );
  return out?.[0]?.results?.[0]?.meta_value ?? null;
}

function setMeta(key, value) {
  execSql(
    `INSERT INTO system_meta (meta_key, meta_value) VALUES ('${escapeSql(key)}','${escapeSql(value)}')
    ON CONFLICT(meta_key) DO UPDATE SET meta_value=excluded.meta_value, updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now')`
  );
}

function hasMeta(key) {
  return getMeta(key) !== null;
}

async function ensureRole(role) {
  const permissionsJson = JSON.stringify(role.permissions || []);
  execSql(
    `INSERT OR IGNORE INTO roles (slug, display_name, description, permissions, is_system) VALUES (
      '${escapeSql(role.slug)}', '${escapeSql(role.displayName)}', '', '${escapeSql(permissionsJson)}', ${role.isSystem ? 1 : 0}
    )`
  );
  const out = execSql(`SELECT id FROM roles WHERE slug='${escapeSql(role.slug)}' LIMIT 1`, {
    json: true,
  });
  const id = out?.[0]?.results?.[0]?.id;
  if (!id) throw new Error(`failed to get role id for ${role.slug}`);
  return id;
}

async function ensureGroup(slug, displayName, description) {
  execSql(
    `INSERT OR IGNORE INTO groups (slug, display_name, description) VALUES (
      '${escapeSql(slug)}','${escapeSql(displayName)}','${escapeSql(description)}'
    )`
  );
  const out = execSql(`SELECT id FROM groups WHERE slug='${escapeSql(slug)}' LIMIT 1`, {
    json: true,
  });
  const id = out?.[0]?.results?.[0]?.id;
  if (!id) throw new Error(`failed to get group id for ${slug}`);
  return id;
}

async function ensureUser({ username, email, passwordHash, nickName }) {
  const existing = execSql(`SELECT id FROM users WHERE email='${escapeSql(email)}' LIMIT 1`, {
    json: true,
  });
  let userId = existing?.[0]?.results?.[0]?.id;
  if (!userId) {
    execSql(
      `INSERT INTO users (username, email, password_hash, is_active, nick_name) VALUES (
        '${escapeSql(username)}','${escapeSql(email)}','${escapeSql(passwordHash)}',1,'${escapeSql(nickName || '')}'
      )`
    );
    const out = execSql(`SELECT id FROM users WHERE email='${escapeSql(email)}' LIMIT 1`, {
      json: true,
    });
    userId = out?.[0]?.results?.[0]?.id;
  }
  if (!userId) throw new Error('failed to create or fetch admin user');
  return userId;
}

function ensureUserRole(userId, roleId) {
  execSql(
    `INSERT OR IGNORE INTO user_roles (user_id, role_id) VALUES ('${escapeSql(userId)}','${escapeSql(roleId)}')`
  );
}

function ensureUserGroup(userId, groupId) {
  execSql(
    `INSERT OR IGNORE INTO user_groups (user_id, group_id) VALUES ('${escapeSql(userId)}','${escapeSql(groupId)}')`
  );
}

async function main() {
  if (!hasWrangler()) {
    err('wrangler not found. Install @cloudflare/wrangler and retry.');
    process.exit(1);
  }

  // Ensure schema exists (apply local SQL files if tables missing)
  try {
    execSql('SELECT 1 FROM roles LIMIT 1');
  } catch {
    log('Schema not found. Applying migrations SQL files locally…');
    execFile('./migrations/001_init.sql');
    execFile('./migrations/002_invite_codes_extension.sql');
    try {
      execFile('./migrations/003_client_applications.sql');
    } catch {}
    try {
      execFile('./migrations/004_email_settings.sql');
    } catch {}
  }

  // Ensure system_meta exists for idempotent seeding markers
  ensureSystemMetaTable();

  if (!FORCE && hasMeta('seed:defaults')) {
    warn('Defaults already seeded. Use --force to re-run.');
    return;
  }

  const passwordHash = await bcrypt.hash(DEFAULT_ADMIN.password, 12);
  const writers = {
    ensureRole,
    ensureGroup: (g) => ensureGroup(g.slug, g.displayName, g.description || ''),
    ensureUser: (u) => ensureUser(u),
    addUserToRole: (uid, rid) => ensureUserRole(uid, rid),
    addUserToGroup: (uid, gid) => ensureUserGroup(uid, gid),
    // Unused by seedDefaults
    upsertTopCategory: async () => {
      throw new Error('not implemented');
    },
    bookmarkExists: async () => false,
    insertBookmark: async () => {
      /* noop */
    },
  };

  log(`Seeding defaults via core ${USE_REMOTE ? '(remote)' : '(local)'}…`);
  await Core.seedDefaults(writers, {
    username: DEFAULT_ADMIN.username,
    email: DEFAULT_ADMIN.email,
    password: passwordHash,
    nickName: DEFAULT_ADMIN.nickName,
  });
  log('Defaults seeded.');

  setMeta('seed:defaults', new Date().toISOString());

  log('Done.');
}

main().catch((e) => {
  err(e?.stack || e?.message || String(e));
  process.exit(1);
});
