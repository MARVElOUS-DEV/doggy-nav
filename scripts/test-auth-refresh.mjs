import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import test from 'node:test';

export function testAuthRefresh(sessionUrl, requestName) {
  async function setup(t, responses) {
    const timers = new Map();
    const listeners = new Map();
    const storage = new Map();
    const calls = [];
    const recoveryDelays = [];
    let timerId = 0;
    t.mock.method(globalThis, 'clearTimeout', (id) => timers.delete(id));
    t.mock.method(globalThis, 'setTimeout', (fn, delay) => {
      recoveryDelays.push(delay);
      queueMicrotask(fn);
      return ++timerId;
    });
    const originals = new Map();
    function setGlobal(name, value) {
      originals.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
      Object.defineProperty(globalThis, name, { configurable: true, value });
    }
    setGlobal('window', {
      setTimeout: (fn, delay) => {
        const id = ++timerId;
        timers.set(id, { fn, delay });
        return id;
      },
      clearTimeout: (id) => timers.delete(id),
      addEventListener: (name, fn) => listeners.set(name, fn),
      removeEventListener: (name) => listeners.delete(name),
      localStorage: {
        getItem: (key) => storage.get(key) ?? null,
        setItem: (key, value) => storage.set(key, value),
        removeItem: (key) => storage.delete(key),
      },
    });
    setGlobal('document', {
      visibilityState: 'visible',
      addEventListener: (name, fn) => listeners.set(name, fn),
    });
    setGlobal('navigator', { onLine: true });
    t.after(() => {
      for (const [name, descriptor] of originals) {
        if (descriptor) Object.defineProperty(globalThis, name, descriptor);
        else delete globalThis[name];
      }
    });
    t.mock.method(globalThis, 'fetch', async (url, options) => {
      calls.push({ url, options });
      const response = responses.shift();
      assert.ok(response, `unexpected request to ${url}`);
      if (response instanceof Error) throw response;
      return { ok: response.status === 200, json: async () => response.body, ...response };
    });
    let source = await readFile(sessionUrl, 'utf8');
    source = source.replace(
      "'./authSessionRefresh'",
      JSON.stringify(new URL('authSessionRefresh.ts', sessionUrl).href)
    );
    const code = stripTypeScriptTypes(source);
    const session = await import(
      `data:text/javascript;base64,${Buffer.from(code).toString('base64')}#${Math.random()}`
    );
    return { session, request: session[requestName], timers, calls, listeners, recoveryDelays };
  }

  test('anonymous and invalid sessions stop timers and online/focus retries', async (t) => {
    const state = await setup(t, [{ status: 401 }]);
    state.session.startProactiveAuthRefresh();
    state.session.setAccessExpEpochMs(Date.now() - 1000);
    await assert.rejects(state.request(), /refresh_invalid/);
    assert.equal(state.timers.size, 0);
    state.listeners.get('online')?.();
    state.listeners.get('focus')?.();
    state.listeners.get('visibilitychange')?.();
    await Promise.resolve();
    assert.equal(state.calls.length, 1);
    assert.equal(state.timers.size, 0);
  });

  test('anonymous bootstrap does not schedule a refresh retry', async (t) => {
    const state = await setup(t, [{ status: 401 }]);
    await assert.rejects(state.request(), /refresh_invalid/);
    assert.equal(state.calls.length, 1);
    assert.equal(state.timers.size, 0);
  });

  if (requestName === 'requestCrossTabRefresh') {
    test('a terminal result from another tab cancels this tab’s retry timers', async (t) => {
      const state = await setup(t, []);
      state.session.setAccessExpEpochMs(Date.now() - 1000);
      window.localStorage.setItem(
        'auth_refresh_inflight',
        JSON.stringify({ owner: 'another-tab', expiresAt: Date.now() + 30_000 })
      );
      const pending = assert.rejects(state.request(), /refresh_invalid/);
      state.listeners.get('storage')({
        key: 'auth_refresh_result',
        newValue: JSON.stringify({ kind: 'refresh', ok: false, invalid: true }),
      });
      await pending;
      assert.equal(state.calls.length, 0);
      assert.equal(state.timers.size, 0);
    });
  }

  test('a definitive 401 cancels an existing transient retry', async (t) => {
    const state = await setup(t, [{ status: 503 }, { status: 401 }]);
    await assert.rejects(state.request(), /refresh_failed/);
    assert.equal(state.timers.size, 1);
    await assert.rejects(state.request(), /refresh_invalid/);
    assert.equal(state.timers.size, 0);
  });

  for (const response of [{ status: 503 }, new Error('network offline')]) {
    test(`temporary ${response.status || 'network'} failures retain backoff`, async (t) => {
      const state = await setup(t, [response]);
      await assert.rejects(state.request(), /refresh_failed/);
      assert.deepEqual(
        [...state.timers.values()].map((timer) => timer.delay),
        [10_000]
      );
    });
  }

  test('409 recovery waits for the winning response to install its cookies', async (t) => {
    const oldExp = Date.now() - 1000;
    const newExp = Date.now() + 900_000;
    const state = await setup(t, [
      { status: 409 },
      { status: 200, body: { code: 1, data: { authenticated: false } } },
      { status: 200, body: { code: 1, data: { authenticated: true, accessExp: oldExp } } },
      { status: 200, body: { code: 1, data: { authenticated: true, accessExp: newExp } } },
    ]);
    state.session.setAccessExpEpochMs(oldExp);
    await state.request();
    assert.deepEqual(
      state.calls.map((call) => call.url),
      ['/api/auth/refresh', '/api/auth/me', '/api/auth/me', '/api/auth/me']
    );
    assert.deepEqual(state.recoveryDelays, [150, 350]);
    assert.equal(state.timers.size, 1);
    assert.ok([...state.timers.values()][0].delay > 10_000);
    if (requestName === 'requestAdminRefresh') {
      assert.ok(state.calls.every((call) => call.options.headers['X-App-Source'] === 'admin'));
    }
  });

  test('409 recovery is bounded and remains retryable if cookies never arrive', async (t) => {
    const state = await setup(t, [
      { status: 409 },
      ...Array.from({ length: 5 }, () => ({
        status: 200,
        body: { code: 1, data: { authenticated: false } },
      })),
    ]);
    await assert.rejects(state.request(), /refresh_failed/);
    assert.equal(state.calls.length, 6);
    assert.deepEqual(state.recoveryDelays, [150, 350, 750, 1500]);
    assert.deepEqual(
      [...state.timers.values()].map((timer) => timer.delay),
      [10_000]
    );
  });
}
