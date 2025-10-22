import { app } from 'egg-mock/bootstrap';

describe('test/app/controller/user.test.ts', () => {
  it('should login Ok /', async () => {
    app.mockService('user', 'login', () => {
      return {
        token: 'Bearer mock',
        tokens: {
          accessToken: 'mock-access',
        },
        user: { name: 'testName' },
      };
    });
    return await app.httpRequest().post('/api/login')
      .set('X-App-Source', 'main')
      .expect(200)
      .expect({ code: 1, msg: 'ok', data: { token: 'Bearer mock', user: { name: 'testName' } } });
  });
});
