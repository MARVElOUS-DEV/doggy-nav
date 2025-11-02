import { app } from 'egg-mock/bootstrap';

const RUN = String(process.env.RUN_CONTRACT || '').toLowerCase();
const ENABLED = RUN === '1' || RUN === 'true' || RUN === 'yes';

describe('contract: GET /api/url-checker/status', () => {
  it('returns stable envelope when enabled', async function () {
    if (!ENABLED) return this.skip();
    const res = await app
      .httpRequest()
      .get('/api/url-checker/status')
      .set('X-App-Source', 'admin')
      .expect(200);

    const body = res.body;
    if (typeof body !== 'object' || body === null) throw new Error('response not object');
    if (!('code' in body) || !('msg' in body) || !('data' in body)) {
      throw new Error('missing envelope fields code/msg/data');
    }
  });
});
