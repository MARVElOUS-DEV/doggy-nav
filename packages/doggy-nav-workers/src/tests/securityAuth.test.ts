import { Hono } from 'hono';
import { createAuthMiddleware, publicRoute } from '../middleware/auth';
import { JWTUtils } from '../utils/jwtUtils';
import { getUserAccessContext } from '../utils/userContext';
import { authRoutes } from '../routes/auth';
import seedRoutes from '../routes/seed';
import { D1UserRepository } from '../adapters/d1UserRepository';
import { D1OAuthRepository } from '../adapters/d1OAuthRepository';

jest.mock('../utils/userContext', () => ({ getUserAccessContext: jest.fn() }));

describe('security: authentication and account linking', () => {
  afterEach(() => jest.restoreAllMocks());

  for (const optional of [false, true]) {
    it(`uses the current JWT secret in ${optional ? 'optional' : 'required'} auth`, async () => {
      const user = { id: 'user-1', username: 'user', email: 'user@example.com', isActive: true };
      jest.mocked(getUserAccessContext).mockResolvedValue({
        user,
        roles: [],
        roleIds: [],
        groups: [],
        groupIds: [],
        permissions: [],
      } as any);
      const app = new Hono();
      app.use('*', optional ? publicRoute() : createAuthMiddleware({ required: true }));
      app.get('/', (c) => c.json({ authenticated: !!c.get('user') }));
      const tokens = await new JWTUtils('old-secret').generateTokenPair({
        userId: user.id,
        username: user.username,
        email: user.email,
        roles: [],
        roleIds: [],
        groups: [],
        groupIds: [],
        permissions: [],
      });
      const request = (secret?: string) =>
        app.request(
          'http://localhost/',
          {
            headers: { Authorization: `Bearer ${tokens.accessToken}` },
          },
          { DB: {}, JWT_SECRET: secret }
        );
      expect((await request('old-secret')).status).toBe(200);
      for (const secret of ['new-secret', undefined]) {
        const response = await request(secret);
        if (optional) expect(await response.json()).toEqual({ authenticated: false });
        else expect(response.status).toBe(401);
      }
    });
  }

  for (const verified of [false, true]) {
    it(`refuses automatic linking to an existing email (verified=${verified})`, async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      jest.spyOn(D1OAuthRepository.prototype, 'findByProviderUser').mockResolvedValue(null);
      const getByEmail = jest
        .spyOn(D1UserRepository.prototype, 'getByEmail')
        .mockResolvedValue({ id: 'victim' } as any);
      const createLink = jest.spyOn(D1OAuthRepository.prototype, 'createLink');
      const createUser = jest.spyOn(D1UserRepository.prototype, 'create');
      jest.spyOn(global, 'fetch').mockImplementation(async (input) => {
        const url = String(input);
        if (url.includes('/token')) return Response.json({ access_token: 'provider-token' });
        return Response.json({
          id: 'attacker-provider-id',
          email: 'Victim@Example.com',
          verified_email: verified,
        });
      });
      const app = new Hono();
      app.route('/api/auth', authRoutes);
      const response = await app.request(
        'http://localhost/api/auth/google/callback?code=code&state=state',
        {
          headers: { Cookie: 'oauth_state=state', 'X-App-Source': 'main' },
        },
        {
          DB: {},
          JWT_SECRET: 'secret',
          GOOGLE_CLIENT_ID: 'id',
          GOOGLE_CLIENT_SECRET: 'secret',
          GOOGLE_CALLBACK_URL: 'http://localhost/api/auth/google/callback',
        }
      );
      expect(response.headers.get('location')).toBe('/login?err=oauth');
      expect(getByEmail).toHaveBeenCalledWith('victim@example.com');
      expect(createLink).not.toHaveBeenCalled();
      expect(createUser).not.toHaveBeenCalled();
      expect(response.headers.get('set-cookie') || '').not.toContain('access_token=');
    });
  }

  it('does not issue tokens for an inactive provider-linked user', async () => {
    jest
      .spyOn(D1OAuthRepository.prototype, 'findByProviderUser')
      .mockResolvedValue({ userId: 'inactive' } as any);
    jest
      .spyOn(D1UserRepository.prototype, 'getById')
      .mockResolvedValue({ id: 'inactive', isActive: false } as any);
    jest.mocked(getUserAccessContext).mockResolvedValue(null);
    jest
      .spyOn(global, 'fetch')
      .mockImplementation(async (input) =>
        String(input).includes('/token')
          ? Response.json({ access_token: 'token' })
          : Response.json({ id: 'provider-id', email: 'user@example.com' })
      );
    const app = new Hono();
    app.route('/api/auth', authRoutes);
    const response = await app.request(
      'http://localhost/api/auth/google/callback?code=code&state=state',
      {
        headers: { Cookie: 'oauth_state=state' },
      },
      {
        DB: {},
        JWT_SECRET: 'secret',
        GOOGLE_CLIENT_ID: 'id',
        GOOGLE_CLIENT_SECRET: 'secret',
        GOOGLE_CALLBACK_URL: 'http://localhost/callback',
      }
    );
    expect(response.headers.get('location')).toBe('/login?err=inactive');
    expect(response.headers.get('set-cookie') || '').not.toContain('access_token=');
  });

  for (const password of [undefined, 'weak']) {
    it(`refuses administrator seeding with ${password ? 'a weak' : 'no'} password`, async () => {
      const db = { prepare: jest.fn() };
      const app = new Hono();
      app.route('/api/seed', seedRoutes);
      const response = await app.request(
        'http://localhost/api/seed/defaults?token=seed',
        { method: 'POST' },
        {
          DB: db,
          SEED_TOKEN: 'seed',
          ADMIN_PASSWORD: password,
        }
      );
      expect(response.status).toBe(400);
      expect(db.prepare).not.toHaveBeenCalled();
    });
  }
});
