import { app } from 'egg-mock/bootstrap';

const RUN = String(process.env.RUN_CONTRACT || '').toLowerCase();
const ENABLED = RUN === '1' || RUN === 'true' || RUN === 'yes';

describe('contract: GET /api/invite-codes/list', () => {
  it('returns stable envelope and page payload when enabled', async function () {
    if (!ENABLED) return this.skip();
    const res = await app
      .httpRequest()
      .get('/api/invite-codes/list')
      .set('X-App-Source', 'admin')
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
