import { app } from 'egg-mock/bootstrap';

const RUN = String(process.env.RUN_CONTRACT || '').toLowerCase();
const ENABLED = RUN === '1' || RUN === 'true' || RUN === 'yes';

// a valid 24-hex ObjectId-like userId
const TEST_USER_ID = '507f1f77bcf86cd799439012';

describe('contract: GET /api/user/profile', () => {
  it('returns stable envelope when enabled', async function () {
    if (!ENABLED) return this.skip();
    const token = (app as any).jwt.sign({ userId: TEST_USER_ID, roles: ['user'] }, (app as any).config.jwt.secret, { expiresIn: '5m' });
    const res = await app
      .httpRequest()
      .get('/api/user/profile')
      .set('X-App-Source', 'main')
      .set('Authorization', 'Bearer ' + token)
      .expect(200);

    const body = res.body;
    if (typeof body !== 'object' || body === null) throw new Error('response not object');
    if (!('code' in body) || !('msg' in body) || !('data' in body)) {
      throw new Error('missing envelope fields code/msg/data');
    }

    if (body.code === 1) {
      // success path: data should be an object (profile)
      if (typeof body.data !== 'object' || body.data === null) throw new Error('profile payload not object');
    } else {
      if (body.data !== null) throw new Error('data should be null when error');
    }
  });
});
