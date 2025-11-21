#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import * as Core from 'doggy-nav-core';

const WORKER_DIR = new URL('..', import.meta.url).pathname;
const USE_REMOTE =
  process.argv.includes('--remote') || process.env.D1_REMOTE === '1' || process.env.REMOTE === '1';
const FORCE = process.argv.includes('--force') || process.env.FORCE === '1';

function log(msg) {
  console.log(`[d1:seed-categories] ${msg}`);
}
function warn(msg) {
  console.warn(`[d1:seed-categories] ${msg}`);
}
function err(msg) {
  console.error(`[d1:seed-categories] ${msg}`);
}

// time util comes from core when seeding

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

function ensureSchema() {
  try {
    execSql('SELECT 1 FROM categories LIMIT 1');
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
}

// meta helpers for idempotency
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

// Writers adapter for core engine
const writers = {
  ensureRole: async () => {
    throw new Error('not used');
  },
  ensureGroup: async () => {
    throw new Error('not used');
  },
  ensureUser: async () => {
    throw new Error('not used');
  },
  addUserToRole: async () => {},
  addUserToGroup: async () => {},
  upsertTopCategory: async ({ name, description, icon, createAt, parentVirtualId }) => {
    const out = execSql(`SELECT id FROM categories WHERE name='${escapeSql(name)}' LIMIT 1`, {
      json: true,
    });
    let id = out?.[0]?.results?.[0]?.id || null;
    if (!id) {
      execSql(`INSERT INTO categories (name, category_id, description, create_at, only_folder, icon, show_in_menu, audience_visibility)
              VALUES ('${escapeSql(name)}','${escapeSql(parentVirtualId)}','${escapeSql(description || '')}',${createAt},0,'${escapeSql(icon || '')}',1,'public')`);
      const after = execSql(`SELECT id FROM categories WHERE name='${escapeSql(name)}' LIMIT 1`, {
        json: true,
      });
      id = after?.[0]?.results?.[0]?.id || null;
    }
    if (!id) throw new Error('failed to upsert category');
    return id;
  },
  bookmarkExists: async (catId, { name, href }) => {
    const out = execSql(
      `SELECT id FROM bookmarks WHERE category_id='${escapeSql(catId)}' AND name='${escapeSql(name)}' AND href='${escapeSql(href)}' LIMIT 1`,
      { json: true }
    );
    return Boolean(out?.[0]?.results?.[0]?.id);
  },
  insertBookmark: async (catId, { name, href, desc, detail, logo, createTime }) => {
    const detailValue = detail || desc || '';
    execSql(`INSERT INTO bookmarks (id, category_id, name, href, description, detail, logo, author_name, author_url, audit_time, create_time, tags, view_count, star_count, status, is_favorite, url_status)
            VALUES (lower(hex(randomblob(4)) || hex(randomblob(4)) || hex(randomblob(4))),
                    '${escapeSql(catId)}','${escapeSql(name)}','${escapeSql(href)}','${escapeSql(desc || '')}','${escapeSql(detailValue)}','${escapeSql(logo || '')}',
                    '', '', NULL, ${createTime || 0}, '[]', 0, 0, 0, 0, 'unknown')`);
  },
};

function shouldSkip() {
  if (FORCE) return false;
  if (hasMeta('seed:categories')) return true;
  const out = execSql('SELECT COUNT(1) as cnt FROM categories', { json: true });
  const count = Number(out?.[0]?.results?.[0]?.cnt || 0);
  return count > 0;
}

async function seedCategoriesAndWebsites() {
  await Core.seedCategories(writers, { force: FORCE });
}

function main() {
  if (!hasWrangler()) {
    err('wrangler not found. Install @cloudflare/wrangler and retry.');
    process.exit(1);
  }
  ensureSchema();
  ensureSystemMetaTable();

  if (shouldSkip()) {
    warn('Categories already exist. Use --force to attempt idempotent upsert.');
    return;
  }

  log(`Seeding categories & websites ${USE_REMOTE ? '(remote)' : '(local)'}…`);
  seedCategoriesAndWebsites().then(() => setMeta('seed:categories', new Date().toISOString()));
  log('Done.');
}

main();
