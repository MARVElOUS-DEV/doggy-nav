import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { test } from 'node:test';
import { verifyHs256AccessToken } from '../dist/security/accessToken.js';

const secret = 'test-signing-key';
const user = {
  typ: 'access',
  userId: '507f1f77bcf86cd799439011',
  roles: ['user'],
  exp: Math.floor(Date.now() / 1000) + 60,
};
function sign(payload = user, key = secret, header = { alg: 'HS256', typ: 'JWT' }) {
  const body = [header, payload]
    .map((value) => Buffer.from(JSON.stringify(value)).toString('base64url'))
    .join('.');
  return `${body}.${createHmac('sha256', key).update(body).digest('base64url')}`;
}

test('verifies real access-token signatures and rejects forged admin claims', async () => {
  assert.equal((await verifyHs256AccessToken(sign(), secret))?.userId, user.userId);
  const token = sign().split('.');
  token[1] = Buffer.from(JSON.stringify({ ...user, roles: ['sysadmin'] })).toString('base64url');
  assert.equal(await verifyHs256AccessToken(token.join('.'), secret), null);
  assert.equal(await verifyHs256AccessToken(sign(user, 'attacker-key'), secret), null);
});

test('rejects unsigned, refresh, malformed, expired and unsafe-identity tokens', async () => {
  for (const token of [
    sign(user, secret, { alg: 'none' }),
    sign({ ...user, typ: 'refresh' }),
    sign({ ...user, exp: 1 }),
    sign({ ...user, exp: undefined }),
    sign({ ...user, exp: '9999999999' }),
    sign({ ...user, nbf: user.exp + 60 }),
    sign({ ...user, userId: '../victim' }),
    sign(user, secret, { alg: 'HS256', crit: ['custom'] }),
    'broken.token',
  ])
    assert.equal(await verifyHs256AccessToken(token, secret), null);
  assert.equal(await verifyHs256AccessToken(sign(), ''), null);
});
