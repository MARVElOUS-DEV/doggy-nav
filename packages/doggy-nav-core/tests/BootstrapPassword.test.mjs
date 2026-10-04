import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import { requireBootstrapPassword } from '../dist/security/bootstrapPassword.js';

test('requires an explicit strong administrator password', () => {
  for (const password of [
    undefined,
    '',
    'Admin123',
    'admin123',
    'longbutlowercase',
    '123456789012',
  ]) {
    assert.throws(() => requireBootstrapPassword(password), /administrator password/);
  }
  assert.equal(requireBootstrapPassword('LongExamplePassword123'), 'LongExamplePassword123');
});

test('D1 seed CLI fails before invoking Wrangler when no password is configured', () => {
  const env = { ...process.env };
  delete env.ADMIN_PASSWORD;
  const result = spawnSync(
    process.execPath,
    [new URL('../../doggy-nav-workers/scripts/d1-seed-defaults.mjs', import.meta.url).pathname],
    { env, encoding: 'utf8' }
  );
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Configure an administrator password/);
  assert.doesNotMatch(result.stderr, /wrangler d1 execute failed/);
});
