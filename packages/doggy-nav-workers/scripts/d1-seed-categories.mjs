#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import * as Core from 'doggy-nav-core';

const WORKER_DIR = new URL('..', import.meta.url).pathname;
const USE_REMOTE = process.argv.includes('--remote') || process.env.D1_REMOTE === '1' || process.env.REMOTE === '1';
const FORCE = process.argv.includes('--force') || process.env.FORCE === '1';

function log(msg) { console.log(`[d1:seed-categories] ${msg}`); }
function warn(msg) { console.warn(`[d1:seed-categories] ${msg}`); }
function err(msg) { console.error(`[d1:seed-categories] ${msg}`); }

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

function escapeSql(s) { return String(s).replaceAll("'", "''"); }

function ensureSchema() {
  try {
    execSql("SELECT 1 FROM categories LIMIT 1");
  } catch {
    log('Schema not found. Applying migrations SQL files locally…');
    execFile('./migrations/001_init.sql');
    execFile('./migrations/002_invite_codes_extension.sql');
  }
}

// Writers adapter for core engine
const writers = {
  ensureRole: async () => { throw new Error('not used'); },
  ensureGroup: async () => { throw new Error('not used'); },
  ensureUser: async () => { throw new Error('not used'); },
  addUserToRole: async () => {},
  addUserToGroup: async () => {},
  upsertTopCategory: async ({ name, description, icon, createAt, parentVirtualId }) => {
    const out = execSql(`SELECT id FROM categories WHERE name='${escapeSql(name)}' LIMIT 1`, { json: true });
    let id = out?.[0]?.results?.[0]?.id || null;
    if (!id) {
      execSql(`INSERT INTO categories (name, category_id, description, create_at, only_folder, icon, show_in_menu, audience_visibility)
               VALUES ('${escapeSql(name)}','${escapeSql(parentVirtualId)}','${escapeSql(description || '')}',${createAt},0,'${escapeSql(icon || '')}',1,'public')`);
      const after = execSql(`SELECT id FROM categories WHERE name='${escapeSql(name)}' LIMIT 1`, { json: true });
      id = after?.[0]?.results?.[0]?.id || null;
    }
    if (!id) throw new Error('failed to upsert category');
    return id;
  },
  bookmarkExists: async (catId, { name, href }) => {
    const out = execSql(`SELECT id FROM bookmarks WHERE category_id='${escapeSql(catId)}' AND name='${escapeSql(name)}' AND href='${escapeSql(href)}' LIMIT 1`, { json: true });
    return Boolean(out?.[0]?.results?.[0]?.id);
  },
  insertBookmark: async (catId, { name, href, desc, logo, createTime }) => {
    execSql(`INSERT INTO bookmarks (id, category_id, name, href, description, logo, author_name, author_url, audit_time, create_time, tags, view_count, star_count, status, is_favorite, url_status)
             VALUES (lower(hex(randomblob(4)) || hex(randomblob(4)) || hex(randomblob(4))),
                     '${escapeSql(catId)}','${escapeSql(name)}','${escapeSql(href)}','${escapeSql(desc || '')}','${escapeSql(logo || '')}',
                     '', '', NULL, ${createTime || 0}, '[]', 0, 0, 0, 0, 'unknown')`);
  },
};

function shouldSkip() {
  if (FORCE) return false;
  const out = execSql("SELECT COUNT(1) as cnt FROM categories", { json: true });
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

  if (shouldSkip()) {
    warn('Categories already exist. Use --force to attempt idempotent upsert.');
    return;
  }

  log(`Seeding categories & websites ${USE_REMOTE ? '(remote)' : '(local)'}…`);
  seedCategoriesAndWebsites();
  log('Done.');
}

main();
