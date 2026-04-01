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
