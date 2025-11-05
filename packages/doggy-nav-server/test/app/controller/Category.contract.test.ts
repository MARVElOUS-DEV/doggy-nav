import { app } from 'egg-mock/bootstrap';

// Run these only when RUN_CONTRACT is set (to avoid DB dependency in CI by default)
const RUN = String(process.env.RUN_CONTRACT || '').toLowerCase();
const ENABLED = RUN === '1' || RUN === 'true' || RUN === 'yes';

describe('contract: GET /api/category/list', () => {
  it('returns stable envelope and list payload when enabled', async function () {
    if (!ENABLED) return this.skip();
    const res = await app
      .httpRequest()
      .get('/api/category/list')
      .set('X-App-Source', 'main')
      .expect(200);

    const body = res.body;
    // Envelope shape
    if (typeof body !== 'object' || body === null) throw new Error('response not object');
    if (!('code' in body) || !('msg' in body) || !('data' in body)) {
      throw new Error('missing envelope fields code/msg/data');
    }

    // Payload shape for category list: array tree on success
    if (body.code === 1) {
      if (!Array.isArray(body.data)) throw new Error('data should be an array when success');
    } else {
      // On failure, controllers respond with data: null; keep baseline permissive
      if (body.data !== null) throw new Error('data should be null when error');
    }
  });
});
