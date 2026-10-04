import assert from 'node:assert/strict';
import test from 'node:test';
import { restoreAuthSession } from '../src/utils/authBootstrap.ts';

test('refreshes and retries the current-user request during bootstrap', async () => {
  let currentUserCalls = 0;
  let refreshCalls = 0;
  const restored = await restoreAuthSession(
    async () => {
      currentUserCalls += 1;
      return currentUserCalls === 1
        ? { authenticated: false, user: null, accessExp: null }
        : { authenticated: true, user: { id: 'u1' }, accessExp: 123 };
    },
    async () => {
      refreshCalls += 1;
    }
  );

  assert.equal(refreshCalls, 1);
  assert.equal(currentUserCalls, 2);
  assert.equal(restored.authenticated, true);
});

test('keeps an anonymous session when no refresh session exists', async () => {
  let currentUserCalls = 0;
  const restored = await restoreAuthSession(
    async () => {
      currentUserCalls += 1;
      return { authenticated: false, user: null, accessExp: null };
    },
    async () => {
      throw new Error('missing refresh session');
    }
  );

  assert.equal(currentUserCalls, 1);
  assert.equal(restored.authenticated, false);
});
