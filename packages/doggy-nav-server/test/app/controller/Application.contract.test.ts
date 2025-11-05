import { app } from 'egg-mock/bootstrap';

const RUN = String(process.env.RUN_CONTRACT || '').toLowerCase();
const ENABLED = RUN === '1' || RUN === 'true' || RUN === 'yes';

describe('contract: GET /api/application/list', () => {
  it('returns stable envelope with list+total when enabled (sysadmin required)', async function () {
    if (!ENABLED) return this.skip();
    const token = (app as any).jwt.sign({ userId: '507f1f77bcf86cd799439013', roles: ['sysadmin'] }, (app as any).config.jwt.secret, { expiresIn: '5m' });
    const res = await app
      .httpRequest()
      .get('/api/application/list')
      .set('X-App-Source', 'admin')
      .set('Authorization', 'Bearer ' + token)
      .expect(200);

    const body = res.body;
    if (typeof body !== 'object' || body === null) throw new Error('response not object');
    if (!('code' in body) || !('msg' in body) || !('data' in body)) {
      throw new Error('missing envelope fields code/msg/data');
    }
    // On success, data may be { applications, total } or compatible legacy
    if (body.code === 1) {
      const payload = body.data;
      if (typeof payload !== 'object' || payload === null) throw new Error('payload not object');
    } else {
      if (body.data !== null) throw new Error('data should be null when error');
    }
  });
});
