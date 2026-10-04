import assert from 'assert';
import * as jwt from 'jsonwebtoken';
import AuthController from '../../../app/controller/auth';
import UserService from '../../../app/service/User';
import { setAuthCookies, clearAuthCookies } from '../../../app/utils/authCookie';

async function expectReject(promise: Promise<unknown>, message: RegExp) {
  await promise.then(
    () => {
      throw new Error('Expected a rejection');
    },
    (error) => assert(message.test(error.message))
  );
}

function fixture(source: 'main' | 'admin' = 'main') {
  const jar = new Map<string, string>();
  const cookies: Array<{ name: string; value: string; options: any }> = [];
  let session: any;
  let failure: 'query' | 'update' | null = null;
  const user = { _id: '507f1f77bcf86cd799439011', username: 'user', roles: [], groups: [] };
  const ctx: any = {
    app: {
      jwt,
      config: {
        jwt: { secret: 'shared-test-key', accessExpiresIn: '15m', refreshExpiresIn: '7d' },
      },
    },
    state: {},
    path: '/api/auth/refresh',
    get: (header: string) => (header === 'X-App-Source' ? source : ''),
    host: 'localhost',
    request: { header: { host: 'localhost' } },
    logger: { error() {}, debug() {} },
    cookies: {
      set(name: string, value: string, options: any) {
        cookies.push({ name, value, options });
        const key = `${name}:${options.path}`;
        if (value) jar.set(key, value);
        else jar.delete(key);
      },
      get(name: string) {
        for (const [key, value] of jar) {
          if (key.startsWith(`${name}:`) && ctx.path.startsWith(key.slice(name.length + 1))) {
            return value;
          }
        }
      },
    },
    model: {
      RefreshSession: {
        async create(doc: any) {
          session = { ...doc, revokedAt: null };
        },
        findOne() {
          return {
            async lean() {
              if (failure === 'query') throw new Error('database unavailable');
              return { ...session };
            },
          };
        },
        async updateOne(filter: any, update: any) {
          if (failure === 'update') throw new Error('database unavailable');
          if (filter.currentTokenHash && filter.currentTokenHash !== session.currentTokenHash) {
            return { modifiedCount: 0 };
          }
          Object.assign(session, update.$set);
          return { modifiedCount: 1 };
        },
      },
    },
  };
  const service = new UserService(ctx);
  service.getAuthUserForTokens = async () => user;
  ctx.service = { user: service };
  const controller = new AuthController(ctx);
  return {
    ctx,
    cookies,
    jar,
    service,
    controller,
    user,
    fail: (mode) => {
      failure = mode;
    },
  };
}

describe('refresh authentication responses without external storage', () => {
  for (const source of ['main', 'admin'] as const) {
    it(`revokes the browser refresh session on ${source} logout and removes both cookie paths`, async () => {
      const f = fixture(source);
      const tokens = await f.service.generateTokens(f.user, source);
      setAuthCookies(f.ctx, tokens);
      assert(
        f.cookies.some(
          (cookie) => cookie.value === tokens.refreshToken && cookie.options.path === '/api/auth'
        )
      );
      assert(
        f.cookies.some((cookie) => !cookie.value && cookie.options.path === '/api/auth/refresh')
      );
      f.ctx.path = '/api/auth/logout';
      await f.controller.logout();
      assert.strictEqual(f.ctx.status, 204);
      assert.strictEqual(f.jar.size, 0);
      await expectReject(f.service.rotateRefreshToken(tokens.refreshToken, source), /unavailable/);
    });
  }

  for (const failure of ['query', 'update'] as const) {
    it(`preserves cookies on a transient ${failure} failure and allows a retry`, async () => {
      const f = fixture();
      setAuthCookies(f.ctx, await f.service.generateTokens(f.user, 'main'));
      const previousCookies = [...f.jar];
      f.cookies.length = 0;
      f.fail(failure);
      await f.controller.refresh();
      assert.strictEqual(f.ctx.status, 503);
      assert.strictEqual(f.cookies.length, 0);
      assert.deepStrictEqual([...f.jar], previousCookies);
      f.fail(null);
      await f.controller.refresh();
      assert.strictEqual(f.ctx.body.code, 1);
    });
  }

  it('clears malformed refresh credentials with 401', async () => {
    const f = fixture();
    setAuthCookies(f.ctx, { accessToken: 'access', refreshToken: 'malformed' });
    await f.controller.refresh();
    assert.strictEqual(f.ctx.status, 401);
    assert.strictEqual(f.jar.size, 0);
  });

  it('returns 409 without clearing credentials on a concurrent rotation', async () => {
    const f = fixture();
    const original = await f.service.generateTokens(f.user, 'main');
    setAuthCookies(f.ctx, original);
    await f.service.rotateRefreshToken(original.refreshToken, 'main');
    f.cookies.length = 0;
    await f.controller.refresh();
    assert.strictEqual(f.ctx.status, 409);
    assert.strictEqual(f.cookies.length, 0);
  });

  it('does not report successful logout when revocation storage fails', async () => {
    const f = fixture();
    setAuthCookies(f.ctx, await f.service.generateTokens(f.user, 'main'));
    f.fail('update');
    await expectReject(f.controller.logout(), /database unavailable/);
    assert.notStrictEqual(f.ctx.status, 204);
    assert(f.jar.size > 0);
  });

  it('cleans up a legacy narrow cookie during credential clearing', () => {
    const f = fixture();
    f.ctx.cookies.set('refresh_token_main', 'legacy', { path: '/api/auth/refresh' });
    clearAuthCookies(f.ctx);
    assert.strictEqual(f.jar.size, 0);
  });
});
