import assert from 'node:assert/strict';
import test from 'node:test';
import { getSafeAuthRedirect } from '../src/utils/authRedirect.ts';

test('keeps internal paths including query strings and hashes', () => {
  assert.equal(getSafeAuthRedirect('/nav/123?tab=reviews#latest'), '/nav/123?tab=reviews#latest');
});

test('uses the first redirect when Next.js provides an array', () => {
  assert.equal(getSafeAuthRedirect(['/timeline?year=2026', '/']), '/timeline?year=2026');
});

test('rejects external and protocol-relative redirects', () => {
  assert.equal(getSafeAuthRedirect('https://example.com'), '/');
  assert.equal(getSafeAuthRedirect('//example.com/path'), '/');
  assert.equal(getSafeAuthRedirect('/\\example.com/path'), '/');
  assert.equal(getSafeAuthRedirect('/%2Fexample.com/path'), '/');
  assert.equal(getSafeAuthRedirect('/%5Cexample.com/path'), '/');
});

test('avoids redirecting back to the login page', () => {
  assert.equal(getSafeAuthRedirect('/login?redirect=/profile'), '/');
  assert.equal(getSafeAuthRedirect('/login/'), '/');
});

test('falls back for missing or malformed redirects', () => {
  assert.equal(getSafeAuthRedirect(undefined), '/');
  assert.equal(getSafeAuthRedirect('not-a-path'), '/');
});
