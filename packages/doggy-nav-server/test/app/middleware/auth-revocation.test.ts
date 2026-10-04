import assert from 'assert';
import * as jwt from 'jsonwebtoken';
import auth from '../../../app/middleware/auth';

describe('security: access tokens use current account state', () => {
  function fixture(user: any, tokenClaims: any = {}) {
    const secret = 'test-secret';
    const token = jwt.sign(
      {
        typ: 'access',
        userId: '507f1f77bcf86cd799439011',
        roles: ['sysadmin'],
        permissions: ['*'],
        groups: ['private'],
        ...tokenClaims,
      },
      secret
    );
    const ctx: any = {
      method: 'DELETE',
      url: '/api/user',
      headers: { authorization: `Bearer ${token}` },
      app: { jwt, config: { jwt: { secret } } },
      state: {},
      get: () => 'admin',
      logger: { debug() {} },
      model: {
        User: {
          findOne: (filter: any) => ({
            lean: async () => {
              assert.strictEqual(filter.isActive, true);
              return user?.isActive ? user : null;
            },
          }),
        },
        Role: {
          find: () => ({ lean: async () => [{ _id: 'role-user', slug: 'user', permissions: [] }] }),
        },
        Group: { find: () => ({ lean: async () => [] }) },
      },
    };
    return ctx;
  }

  for (const user of [null, { isActive: false }]) {
    it(`rejects a ${user ? 'disabled' : 'deleted'} account despite a valid signed admin token`, async () => {
      const ctx = fixture(user);
      let reached = false;
      await auth()(ctx, async () => {
        reached = true;
      });
      assert.strictEqual(ctx.status, 401);
      assert.strictEqual(reached, false);
    });
  }

  it('revokes stale roles, permissions and group access immediately', async () => {
    const ctx = fixture({
      _id: '507f1f77bcf86cd799439011',
      username: 'demoted',
      isActive: true,
      roles: ['user'],
      groups: [],
      extraPermissions: [],
    });
    let reached = false;
    await auth()(ctx, async () => {
      reached = true;
    });
    assert.strictEqual(ctx.status, 403);
    assert.strictEqual(reached, false);
    assert.deepStrictEqual(ctx.state.userinfo.roles, ['user']);
    assert.deepStrictEqual(ctx.state.userinfo.permissions, []);
    assert.deepStrictEqual(ctx.state.userinfo.groups, []);
  });

  it('fails closed when current account state cannot be loaded', async () => {
    const ctx = fixture(null);
    ctx.model.User.findOne = () => ({
      lean: async () => {
        throw new Error('database unavailable');
      },
    });
    await auth()(ctx, async () => {
      throw new Error('must not execute handler');
    });
    assert.strictEqual(ctx.status, 401);
  });
});
