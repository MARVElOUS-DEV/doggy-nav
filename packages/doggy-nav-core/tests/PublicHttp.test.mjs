import assert from 'node:assert/strict';
import { test } from 'node:test';
import { assertPublicHttpUrl, isPublicIp, requestPublicHttp } from '../dist/security/publicHttp.js';
import { createPublicLookup, requestPublicHttpNode } from '../dist/security/publicHttpNode.js';
import { requestPublicHttpEdge } from '../dist/security/publicHttpEdge.js';

test('rejects internal targets and alternate IP spellings before network access', async () => {
  for (const url of [
    'file:///etc/passwd',
    'ftp://example.com/',
    'http://user:pass@example.com/',
    'http://localhost/',
    'http://localhost./',
    'http://service.internal/',
    'http://127.1/',
    'http://2130706433/',
    'http://0x7f000001/',
    'http://10.0.0.1/',
    'http://169.254.169.254/latest/meta-data/',
    'http://172.16.0.1/',
    'http://192.168.1.1/',
    'http://100.64.0.1/',
    'http://[::1]/',
    'http://[::ffff:127.0.0.1]/',
    'http://[fc00::1]/',
    'http://[fe80::1]/',
    'http://[64:ff9b::7f00:1]/',
    'http://[2002:7f00:1::]/',
  ]) {
    assert.throws(() => assertPublicHttpUrl(url), { name: 'UnsafePublicUrlError' }, url);
    await assert.rejects(requestPublicHttpNode(url), { name: 'UnsafePublicUrlError' });
  }
  assert.equal(isPublicIp('8.8.8.8'), true);
  assert.equal(isPublicIp('2606:4700:4700::1111'), true);
  assert.equal(assertPublicHttpUrl('https://example.com/a').hostname, 'example.com');
});

test('rejects a redirect into internal space without requesting it', async () => {
  const requested = [];
  await assert.rejects(
    requestPublicHttp('https://example.com/', async (url) => {
      requested.push(url.href);
      return { status: 302, body: '', location: 'http://169.254.169.254/' };
    }),
    { name: 'UnsafePublicUrlError' }
  );
  assert.deepEqual(requested, ['https://example.com/']);
});

test('follows public relative redirects and bounds redirect loops', async () => {
  let calls = 0;
  const result = await requestPublicHttp('https://example.com/', async (url) => {
    calls++;
    return url.pathname === '/'
      ? { status: 302, location: '/next', body: '' }
      : { status: 200, body: 'ok' };
  });
  assert.equal(result.body, 'ok');
  assert.equal(calls, 2);
  await assert.rejects(
    requestPublicHttp('https://example.com/', async () => ({
      status: 302,
      body: '',
      location: '/',
    })),
    /Too many redirects/
  );
});

test('applies a caller host allowlist to redirected destinations', async () => {
  let calls = 0;
  await assert.rejects(
    requestPublicHttp(
      'https://example.com/',
      async () => {
        calls++;
        return { status: 302, location: 'https://other.example.net/', body: '' };
      },
      { allowUrl: (url) => url.hostname === 'example.com' }
    ),
    { name: 'UnsafePublicUrlError' }
  );
  assert.equal(calls, 1);
});

test('socket DNS lookup rejects mixed public/private answers and checks every lookup', async () => {
  let answers = [{ address: '8.8.8.8', family: 4 }];
  let resolutions = 0;
  const lookup = createPublicLookup((_hostname, _options, callback) => {
    resolutions++;
    callback(null, answers);
  });
  const resolve = (options = {}) =>
    new Promise((accept, reject) => {
      lookup('example.com', options, (err, address, family) =>
        err ? reject(err) : accept({ address, family })
      );
    });
  assert.deepEqual(await resolve(), { address: '8.8.8.8', family: 4 });
  answers = [...answers, { address: '::1', family: 6 }];
  await assert.rejects(resolve(), { name: 'UnsafePublicUrlError' });
  answers = [{ address: '10.0.0.1', family: 4 }];
  await assert.rejects(resolve(), { name: 'UnsafePublicUrlError' });
  assert.equal(resolutions, 3);
});

test('edge transport fails closed on private DNS answers', async () => {
  const requests = [];
  await assert.rejects(
    requestPublicHttpEdge('https://example.com/', {}, async (url) => {
      requests.push(String(url));
      return Response.json({ Status: 0, Answer: [{ type: 1, data: '127.0.0.1' }] });
    }),
    { name: 'UnsafePublicUrlError' }
  );
  assert(requests.every((url) => url.startsWith('https://cloudflare-dns.com/dns-query?')));
});

test('edge transport disables automatic redirects and limits response bodies', async () => {
  await assert.rejects(
    requestPublicHttpEdge('https://8.8.8.8/', { maxBytes: 3 }, async (_url, init) => {
      assert.equal(init.redirect, 'manual');
      return new Response('too large');
    }),
    /size limit/
  );
});
