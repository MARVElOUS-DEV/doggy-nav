import { app } from 'egg-mock/bootstrap';

const RUN = String(process.env.RUN_CONTRACT || '').toLowerCase();
const ENABLED = RUN === '1' || RUN === 'true' || RUN === 'yes';

describe('contract: POST /api/translate', () => {
  it('returns stable envelope when enabled', async function () {
    if (!ENABLED) return this.skip();
    const res = await app
      .httpRequest()
      .post('/api/translate')
      .set('X-App-Source', 'main')
      .send({ text: 'hello', sourceLang: 'en', targetLang: 'zh-CN' })
      .expect(200);

    const body = res.body;
    if (typeof body !== 'object' || body === null) throw new Error('response not object');
    // For translate controller, response is raw payload without {code/msg}; we only check that fields exist
    if (!('translatedText' in body) || !('sourceLang' in body) || !('targetLang' in body)) {
      throw new Error('missing translatedText/sourceLang/targetLang');
    }
  });
});
