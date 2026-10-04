import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import ts from 'typescript';

// Transpile the actual Worker entrypoint without starting Wrangler or contacting R2.
const source = await readFile(new URL('../src/index.ts', import.meta.url), 'utf8');
const output = ts
  .transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  })
  .outputText.replace(
    /from '(hono(?:\/cors)?|doggy-nav-core)'/g,
    (_match, name) => `from '${import.meta.resolve(name)}'`
  );
const { default: app } = await import(
  `data:text/javascript;base64,${Buffer.from(output).toString('base64')}`
);
const secret = 'image-worker-test-secret';
const payload = {
  typ: 'access',
  userId: '507f1f77bcf86cd799439011',
  roles: ['user'],
  exp: Math.floor(Date.now() / 1000) + 60,
};
function sign(claims = payload, key = secret) {
  const body = [{ alg: 'HS256' }, claims]
    .map((v) => Buffer.from(JSON.stringify(v)).toString('base64url'))
    .join('.');
  return `${body}.${createHmac('sha256', key).update(body).digest('base64url')}`;
}
const upload = (token) =>
  app.request(
    'http://localhost/upload',
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    },
    { JWT_SECRET: secret }
  );

test('image upload rejects forged and refresh tokens before accessing storage', async () => {
  const forged = sign().split('.');
  forged[1] = Buffer.from(
    JSON.stringify({ ...payload, userId: 'victim', roles: ['admin'] })
  ).toString('base64url');
  for (const token of [
    forged.join('.'),
    sign(payload, 'attacker-key'),
    sign({ ...payload, typ: 'refresh' }),
    sign({ ...payload, exp: undefined }),
  ]) {
    const response = await upload(token);
    assert.equal(response.status, 401);
  }
});

test('image upload accepts a signed access token and proceeds to storage configuration', async () => {
  assert.equal((await upload(sign())).status, 503);
});
