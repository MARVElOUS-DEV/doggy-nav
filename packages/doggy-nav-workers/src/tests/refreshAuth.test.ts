import { Hono } from 'hono';
import { authRoutes } from '../routes/auth';
import { JWTUtils } from '../utils/jwtUtils';
import { getUserAccessContext } from '../utils/userContext';
import { clearAuthCookies, setAuthCookies } from '../utils/cookieAuth';
import { issueTrackedTokenPair } from '../utils/refreshSessions';

jest.mock('../utils/userContext', () => ({ getUserAccessContext: jest.fn() }));

type BrowserCookie = { key: string; value: string; path: string };
// jsdom provides a browser-compatible cookie jar without starting a browser.
const { CookieJar } = require('jsdom') as {
  CookieJar: new () => {
    setCookieSync(cookie: string, url: string): void;
    getCookieStringSync(url: string): string;
    getCookiesSync(url: string): BrowserCookie[];
  };
};

function getSetCookies(response: Response): string[] {
  return (response.headers as Headers & { getSetCookie(): string[] }).getSetCookie();
}

function fixture(source: 'main' | 'admin' = 'main') {
  let row: any;
  let failure: 'query' | 'update' | null = null;
  const db = {
    prepare(sql: string) {
      return {
        bind(...args: any[]) {
          return {
            async first() {
              if (failure === 'query') throw new Error('database unavailable');
              return row ? { ...row } : null;
            },
            async run() {
              if (sql.includes('INSERT INTO refresh_sessions')) {
                row = {
                  id: args[0],
                  user_id: args[1],
                  source: args[2],
                  current_token_hash: args[3],
                  expires_at: args[4],
                  revoked_at: null,
                };
              } else {
                if (failure === 'update') throw new Error('database unavailable');
                if (sql.includes('current_token_hash = ?')) {
                  if (row.current_token_hash !== args[5] || row.revoked_at)
                    return { meta: { changes: 0 } };
                  Object.assign(row, {
                    previous_token_hash: row.current_token_hash,
                    current_token_hash: args[0],
                    rotated_at: args[1],
                    expires_at: args[2],
                  });
                } else row.revoked_at = args[0];
              }
              return { meta: { changes: 1 } };
            },
          };
        },
      };
    },
  } as unknown as D1Database;
  const payload = {
    userId: 'user-1',
    email: 'user@example.com',
    username: 'user',
    roles: [],
    roleIds: [],
    groups: [],
    groupIds: [],
    permissions: [],
  };
  jest.mocked(getUserAccessContext).mockResolvedValue({
    user: {
      id: payload.userId,
      email: payload.email,
      username: payload.username,
      isActive: true,
      extraPermissions: [],
    },
    ...payload,
  });
  const jwt = new JWTUtils('shared-test-key');
  const app = new Hono();
  app.route('/api/auth', authRoutes);
  app.post('/issue', async (c) => {
    setAuthCookies(c, await issueTrackedTokenPair(db, jwt, payload, source));
    return c.body(null, 204);
  });
  app.post('/clear', (c) => {
    clearAuthCookies(c);
    return c.body(null, 204);
  });
  const jar = new CookieJar();
  async function request(path: string, body?: any) {
    const url = `http://localhost${path}`;
    const response = await app.request(
      url,
      {
        method: 'POST',
        headers: {
          'X-App-Source': source,
          Cookie: jar.getCookieStringSync(url),
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      },
      { DB: db, JWT_SECRET: 'shared-test-key' }
    );
    for (const cookie of getSetCookies(response)) jar.setCookieSync(cookie, url);
    return response;
  }
  return {
    request,
    jar,
    fail: (mode: typeof failure) => {
      failure = mode;
    },
  };
}

describe('refresh route cookie and storage behavior', () => {
  beforeEach(() => jest.spyOn(console, 'error').mockImplementation(() => {}));
  afterEach(() => jest.restoreAllMocks());

  for (const source of ['main', 'admin'] as const) {
    it(`revokes a copied refresh token after browser ${source} logout`, async () => {
      const f = fixture(source);
      f.jar.setCookieSync(
        `refresh_token_${source}=legacy; Path=/api/auth/refresh`,
        'http://localhost'
      );
      await f.request('/issue');
      const refresh = f.jar
        .getCookiesSync('http://localhost/api/auth/logout')
        .find((cookie) => cookie.key === `refresh_token_${source}`);
      expect(refresh?.path).toBe('/api/auth');
      expect(
        f.jar
          .getCookiesSync('http://localhost/api/auth/refresh')
          .filter((cookie) => cookie.key === `refresh_token_${source}`)
      ).toHaveLength(1);
      expect((await f.request('/api/auth/logout')).status).toBe(204);
      expect(f.jar.getCookieStringSync('http://localhost/api/auth/refresh')).toBe('');
      expect((await f.request('/api/auth/refresh', { refreshToken: refresh!.value })).status).toBe(
        401
      );
    });
  }

  for (const failure of ['query', 'update'] as const) {
    it(`preserves credentials on a ${failure} outage and allows retry`, async () => {
      const f = fixture();
      await f.request('/issue');
      const before = f.jar.getCookieStringSync('http://localhost/api/auth/refresh');
      f.fail(failure);
      const failed = await f.request('/api/auth/refresh');
      expect(failed.status).toBe(503);
      expect(getSetCookies(failed)).toEqual([]);
      expect(f.jar.getCookieStringSync('http://localhost/api/auth/refresh')).toBe(before);
      f.fail(null);
      expect((await f.request('/api/auth/refresh')).status).toBe(200);
    });
  }

  it('clears invalid credentials and returns 401', async () => {
    const f = fixture();
    await f.request('/issue');
    expect((await f.request('/api/auth/refresh', { refreshToken: 'malformed' })).status).toBe(401);
    expect(f.jar.getCookieStringSync('http://localhost/api/auth/refresh')).toBe('');
  });

  it('returns 409 without deleting cookies for a concurrent duplicate', async () => {
    const f = fixture();
    await f.request('/issue');
    const old = f.jar
      .getCookiesSync('http://localhost/api/auth/refresh')
      .find((cookie) => cookie.key === 'refresh_token_main')!.value;
    await f.request('/api/auth/refresh');
    const duplicate = await f.request('/api/auth/refresh', { refreshToken: old });
    expect(duplicate.status).toBe(409);
    expect(getSetCookies(duplicate)).toEqual([]);
  });

  it('removes both legacy and current paths during cookie clearing', async () => {
    const f = fixture();
    await f.request('/issue');
    f.jar.setCookieSync('refresh_token_main=legacy; Path=/api/auth/refresh', 'http://localhost');
    await f.request('/clear');
    expect(f.jar.getCookieStringSync('http://localhost/api/auth/refresh')).toBe('');
  });
});
