import { app } from 'egg-mock/bootstrap';

describe('test/app/controller/user.test.ts', () => {
  it('should login Ok /', async () => {
    app.mockService('user', 'login', () => {
      return {
        name: 'testName',
      };
    });
    return await app.httpRequest().post('/api/login').expect(200)
      .expect({ code: 1, msg: 'ok', data: { name: 'testName' } });
  });
});
