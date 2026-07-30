import * as assert from 'assert';
import { app } from 'egg-mock/bootstrap';

describe('passkey authentication', () => {
  it('issues a discoverable challenge and protects enrollment', async () => {
    const login = await app
      .httpRequest()
      .post('/api/auth/passkey')
      .set('X-App-Source', 'main')
      .expect(200);

    assert.strictEqual(login.body.code, 1);
    assert.ok(login.body.data.challenge);
    assert.strictEqual(login.body.data.allowCredentials, undefined);
    assert.ok(String(login.headers['set-cookie']).includes('passkey_login_challenge='));

    await app.httpRequest().get('/api/user/passkeys').set('X-App-Source', 'main').expect(401);
  });
});
