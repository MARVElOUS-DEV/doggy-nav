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
    await app.httpRequest().post('/api/auth/login')
      .set('X-App-Source', 'main')
      .expect(200);
  });
});
