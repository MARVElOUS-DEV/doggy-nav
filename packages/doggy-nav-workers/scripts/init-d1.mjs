#!/usr/bin/env node
// Initializes local D1 by applying migrations. Designed to be safe in postinstall.
// - Skips in CI
// - Skips if wrangler is not available

import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function log(msg) {
  console.log(`[workers:init-d1] ${msg}`);
}

function warn(msg) {
  console.warn(`[workers:init-d1] ${msg}`);
}

function hasWrangler() {
  const res = spawnSync('wrangler', ['--version'], { stdio: 'pipe' });
  return res.status === 0;
}

function applyMigrations() {
  const args = ['d1', 'migrations', 'apply', 'DB'];
  const res = spawnSync('wrangler', args, {
    cwd: __dirname + '/..',
    stdio: 'inherit',
    env: process.env,
  });
  return res.status === 0;
}

async function main() {
  try {
    if (process.env.CI === 'true' || process.env.CI === '1') {
      return log('CI detected, skipping D1 init.');
    }

    if (!hasWrangler()) {
      return warn('wrangler not found in PATH; skipping D1 init.');
    }

    log('Applying D1 migrations for binding "DB" (local)…');
    const ok = applyMigrations();
    if (ok) {
      log('D1 migrations applied successfully.');
    } else {
      warn('Failed to apply D1 migrations (see output above). Skipping.');
    }
  } catch (err) {
    warn(`Unexpected error during D1 init: ${err?.message || err}`);
  }
}

main();
