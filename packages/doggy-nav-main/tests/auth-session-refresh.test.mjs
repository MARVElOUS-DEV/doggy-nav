import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getAuthSessionRevision,
  publishAuthSessionRefresh,
  subscribeToAuthSessionRefresh,
} from '../src/utils/authSessionRefresh.ts';

test('publishes session revisions to active subscribers', () => {
  const initialRevision = getAuthSessionRevision();
  let notifications = 0;
  const unsubscribe = subscribeToAuthSessionRefresh(() => {
    notifications += 1;
  });

  publishAuthSessionRefresh();

  assert.equal(getAuthSessionRevision(), initialRevision + 1);
  assert.equal(notifications, 1);

  unsubscribe();
  publishAuthSessionRefresh();

  assert.equal(getAuthSessionRevision(), initialRevision + 2);
  assert.equal(notifications, 1);
});
