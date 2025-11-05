#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import readline from 'node:readline';
import bcrypt from 'bcryptjs';

const WORKER_DIR = new URL('..', import.meta.url).pathname;
const USE_REMOTE = process.argv.includes('--remote') || process.env.D1_REMOTE === '1' || process.env.REMOTE === '1';

function log(msg) { console.log(`[d1:reset] ${msg}`); }
function err(msg) { console.error(`[d1:reset] ${msg}`); }

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

function escapeSql(s) { return String(s).replaceAll("'", "''"); }

function ask(q, { silent = false } = {}) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(q, (answer) => {
      rl.close();
      if (silent) {
        process.stdout.write('\x1B[1A');
        process.stdout.write('\x1B[2K');
        process.stdout.write(`${q}${'*'.repeat(answer.length)}\n`);
      }
      resolve(answer);
    });
  });
}

function validatePassword(pw) {
  const errors = [];
  if (pw.length < 6) errors.push('at least 6 chars');
  if (!/(?=.*[a-z])/.test(pw)) errors.push('one lowercase');
  if (!/(?=.*[A-Z])/.test(pw)) errors.push('one uppercase');
  if (!/(?=.*\d)/.test(pw)) errors.push('one number');
  return { valid: errors.length === 0, errors };
}

async function main() {
  if (!hasWrangler()) {
    err('wrangler not found. Install @cloudflare/wrangler and retry.');
    process.exit(1);
  }

  let identifier = process.argv.find((a) => a.startsWith('--email='))?.split('=')[1]
    || process.argv.find((a) => a.startsWith('--username='))?.split('=')[1];
  const useEmail = process.argv.some((a) => a.startsWith('--email='));
  if (!identifier) {
    const mode = (await ask('Reset by email or username? (e/u) ')).trim().toLowerCase() === 'e';
    identifier = (await ask(`Enter ${mode ? 'email' : 'username'}: `)).trim();
  }

  let newPw = process.env.NEW_PASSWORD || process.argv.find((a) => a.startsWith('--new='))?.split('=')[1];
  if (!newPw) {
    newPw = await ask('Enter new password: ', { silent: true });
  }

  const v = validatePassword(newPw);
  if (!v.valid) {
    err(`Password invalid: ${v.errors.join(', ')}`);
    process.exit(1);
  }

  const by = useEmail || /@/.test(identifier) ? 'email' : 'username';
  const q = execSql(`SELECT id FROM users WHERE ${by}='${escapeSql(identifier)}' LIMIT 1`, { json: true });
  const userId = q?.[0]?.results?.[0]?.id;
  if (!userId) {
    err('User not found');
    process.exit(1);
  }

  const hash = await bcrypt.hash(newPw, 12);
  execSql(`UPDATE users SET password_hash='${escapeSql(hash)}' WHERE id='${escapeSql(userId)}'`);
  log('Password reset successfully.');
}

main().catch((e) => { err(e?.stack || e?.message || String(e)); process.exit(1); });
