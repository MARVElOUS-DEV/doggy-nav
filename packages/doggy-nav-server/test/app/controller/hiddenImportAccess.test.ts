import assert from 'assert';
import request from 'supertest';
import { app, mock } from 'egg-mock/bootstrap';

async function signPayload(payload: any) {
  const a = app as any;
  const secret = a.config.jwt.secret;
  return 'Bearer ' + a.jwt.sign(payload, secret, { expiresIn: '10m' });
}

describe('hidden import access control', () => {
  afterEach(() => {
    mock.restore();
  });

  it('exposes hidden-only tags to sysadmin on public tag list route', async () => {
    const server = app.callback();
    const sysadminToken = await signPayload({
      userId: 'u-sysadmin-tags',
      username: 'root',
      roles: [ 'sysadmin' ],
      roleIds: [],
      groups: [],
      groupIds: [],
      permissions: [ '*' ],
    });

    mock(app.model.Category, 'find', () => ({
      select: async () => [ { _id: '507f1f77bcf86cd799439012' } ],
    }));

    mock(app.model.Nav, 'aggregate', async (pipeline: any[]) => {
      const serialized = JSON.stringify(pipeline);
      const isCount = serialized.includes('"$count":"total"');
      const includesVisibilityFilter = serialized.includes('audience.visibility');

      if (includesVisibilityFilter) {
        return isCount ? [ { total: 0 } ] : [];
      }

      return isCount
        ? [ { total: 1 } ]
        : [ { _id: 'hidden-sysadmin-tag', name: 'hidden-sysadmin-tag', count: 1 } ];
    });

    await request(server)
      .get('/api/tag/list')
      .set('X-App-Source', 'admin')
      .expect(200)
      .expect((res) => {
        assert.deepStrictEqual(res.body.data.data, []);
      });

    await request(server)
      .get('/api/tag/list')
      .set('X-App-Source', 'admin')
      .set('Authorization', sysadminToken)
      .expect(200)
      .expect((res) => {
        assert.strictEqual(res.body.data.total, 1);
        assert.deepStrictEqual(res.body.data.data, [
          {
            id: 'hidden-sysadmin-tag',
            name: 'hidden-sysadmin-tag',
            count: 1,
          },
        ]);
      });
  });

  it('blocks admin from creating hidden nav records', async () => {
    const server = app.callback();
    const adminToken = await signPayload({
      userId: 'u-admin',
      username: 'admin',
      roles: [ 'admin' ],
      roleIds: [],
      groups: [],
      groupIds: [],
      permissions: [],
    });

    await request(server)
      .post('/api/nav')
      .set('X-App-Source', 'admin')
      .set('Authorization', adminToken)
      .send({
        name: 'Hidden bookmark',
        href: 'https://example.com',
        audience: { visibility: 'hide' },
      })
      .expect(403);
  });

  it('allows sysadmin to create hidden nav records and keeps them published', async () => {
    const server = app.callback();
    const sysadminToken = await signPayload({
      userId: 'u-sysadmin',
      username: 'root',
      roles: [ 'sysadmin' ],
      roleIds: [],
      groups: [],
      groupIds: [],
      permissions: [ '*' ],
    });

    let createdPayload: any;
    mock(app.model.Nav, 'create', async (payload: any) => {
      createdPayload = payload;
      return {
        _id: '507f1f77bcf86cd799439011',
        ...payload,
        toJSON() {
          return { _id: this._id, ...payload };
        },
      };
    });

    await request(server)
      .post('/api/nav')
      .set('X-App-Source', 'admin')
      .set('Authorization', sysadminToken)
      .send({
        name: 'Hidden bookmark',
        href: 'https://example.com',
        audience: { visibility: 'hide' },
        createTime: 123456789,
      })
      .expect(200);

    assert.strictEqual(createdPayload.status, 0);
    assert.strictEqual(createdPayload.createTime, 123456789);
    assert.deepStrictEqual(createdPayload.audience, { visibility: 'hide' });
  });

  it('blocks admin from creating hidden category records', async () => {
    const server = app.callback();
    const adminToken = await signPayload({
      userId: 'u-admin',
      username: 'admin',
      roles: [ 'admin' ],
      roleIds: [],
      groups: [],
      groupIds: [],
      permissions: [],
    });

    await request(server)
      .post('/api/category')
      .set('X-App-Source', 'admin')
      .set('Authorization', adminToken)
      .send({
        name: 'Hidden folder',
        categoryId: '4bvirtualcb9ff050738cc16',
        audience: { visibility: 'hide' },
      })
      .expect(403);
  });
});
