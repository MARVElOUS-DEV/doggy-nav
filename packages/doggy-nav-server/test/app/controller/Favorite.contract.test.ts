import { app } from 'egg-mock/bootstrap';

const RUN = String(process.env.RUN_CONTRACT || '').toLowerCase();
const ENABLED = RUN === '1' || RUN === 'true' || RUN === 'yes';

// a valid 24-hex ObjectId-like userId for aggregation
const TEST_USER_ID = '507f1f77bcf86cd799439011';

describe('contract: GET /api/favorites/list', () => {
  it('returns stable envelope and page payload when enabled', async function () {
    if (!ENABLED) return this.skip();
    const token = (app as any).jwt.sign({ userId: TEST_USER_ID, roles: ['user'] }, (app as any).config.jwt.secret, { expiresIn: '5m' });
    const res = await app
      .httpRequest()
      .get('/api/favorites/list')
      .set('X-App-Source', 'main')
      .set('Authorization', 'Bearer ' + token)
      .expect(200);

    const body = res.body;
    if (typeof body !== 'object' || body === null) throw new Error('response not object');
    if (!('code' in body) || !('msg' in body) || !('data' in body)) {
      throw new Error('missing envelope fields code/msg/data');
    }

    if (body.code === 1) {
      const payload = body.data;
      if (typeof payload !== 'object' || payload === null) throw new Error('payload not object');
      if (!('data' in payload) || !('total' in payload) || !('pageNumber' in payload)) {
        throw new Error('missing page fields data/total/pageNumber');
      }
    } else {
      if (body.data !== null) throw new Error('data should be null when error');
    }
  });
});
