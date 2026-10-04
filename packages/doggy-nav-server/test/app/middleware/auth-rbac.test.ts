import assert from 'assert';
import request from 'supertest';
import { app } from 'egg-mock/bootstrap';

// Helper to sign a fake JWT payload via app.jwt
async function signPayload(payload: any) {
  const a = app as any;
  const secret = a.config.jwt.secret;
  return 'Bearer ' + a.jwt.sign({ typ: 'access', ...payload }, secret, { expiresIn: '10m' });
}

describe('middleware auth rbac by source', () => {
  it('rejects tokens that are not explicitly access tokens', async () => {
    const server = app.callback();
    const a = app as any;
    const legacyAccessToken = a.jwt.sign(
      { userId: 'u-legacy', roles: ['user'] },
      a.config.jwt.secret,
      { expiresIn: '10m' }
    );
    const refreshToken = a.jwt.sign(
      { typ: 'refresh', sid: '507f1f77bcf86cd799439011', source: 'main' },
      a.config.jwt.secret,
      { expiresIn: '10m', subject: 'u-refresh', jwtid: 'refresh-jti' }
    );

    await request(server)
      .get('/api/user/profile')
      .set('X-App-Source', 'main')
      .set('Authorization', `Bearer ${legacyAccessToken}`)
      .expect(401);
    await request(server)
      .get('/api/user/profile')
      .set('X-App-Source', 'main')
      .set('Authorization', `Bearer ${refreshToken}`)
      .expect(401);
  });

  it('blocks when X-App-Source header is missing', async () => {
    const server = app.callback();
    await request(server).get('/api/roles').expect(400);
  });

  it('blocks when X-App-Source header is invalid', async () => {
    const server = app.callback();
    await request(server).get('/api/roles').set('X-App-Source', 'foo').expect(400);
  });

  it('optional route in admin requires auth and appropriate role', async () => {
    const server = app.callback();
    // Without auth
    await request(server).get('/api/roles').set('X-App-Source', 'admin').expect(401);

    // With viewer token → 403
    const viewerToken = await signPayload({
      userId: 'u1',
      username: 'v',
      roles: ['viewer'],
      roleIds: [],
      groups: [],
      groupIds: [],
      permissions: [],
    });
    await request(server)
      .get('/api/roles')
      .set('X-App-Source', 'admin')
      .set('Authorization', viewerToken)
      .expect(403);

    // With admin token → 200 (middleware allows; controller may still filter)
    const adminToken = await signPayload({
      userId: 'u2',
      username: 'a',
      roles: ['admin'],
      roleIds: [],
      groups: [],
      groupIds: [],
      permissions: [],
    });
    await request(server)
      .get('/api/roles')
      .set('X-App-Source', 'admin')
      .set('Authorization', adminToken)
      .expect((res) => {
        assert([200, 500].includes(res.status));
      });
  });

  it('PUT /api/nav blocked for viewer in main; allowed for user/admin/sysadmin', async () => {
    const server = app.callback();
    const viewer = await signPayload({
      userId: 'u3',
      username: 'v',
      roles: ['viewer'],
      roleIds: [],
      groups: [],
      groupIds: [],
      permissions: [],
    });
    await request(server)
      .put('/api/nav')
      .set('X-App-Source', 'main')
      .set('Authorization', viewer)
      .send({ id: '000000000000000000000000' })
      .expect(403);

    const user = await signPayload({
      userId: 'u4',
      username: 'u',
      roles: ['user'],
      roleIds: [],
      groups: [],
      groupIds: [],
      permissions: [],
    });
    await request(server)
      .put('/api/nav')
      .set('X-App-Source', 'main')
      .set('Authorization', user)
      .send({ id: '000000000000000000000000' })
      .expect((res) => {
        assert([200, 400, 404, 422].includes(res.status));
      });

    const admin = await signPayload({
      userId: 'u5',
      username: 'a',
      roles: ['admin'],
      roleIds: [],
      groups: [],
      groupIds: [],
      permissions: [],
    });
    await request(server)
      .put('/api/nav')
      .set('X-App-Source', 'main')
      .set('Authorization', admin)
      .send({ id: '000000000000000000000000' })
      .expect((res) => {
        assert([200, 400, 404, 422].includes(res.status));
      });

    const sa = await signPayload({
      userId: 'u6',
      username: 's',
      roles: ['sysadmin'],
      roleIds: [],
      groups: [],
      groupIds: [],
      permissions: ['*'],
    });
    await request(server)
      .put('/api/nav')
      .set('X-App-Source', 'main')
      .set('Authorization', sa)
      .send({ id: '000000000000000000000000' })
      .expect((res) => {
        assert([200, 400, 404, 422].includes(res.status));
      });
  });
});
