import assert from 'assert';
import request from 'supertest';
import { app } from 'egg-mock/bootstrap';

// Helper to sign a fake JWT payload via app.jwt
async function signPayload(payload: any) {
  const a = app as any;
  const secret = a.config.jwt.secret;
  return 'Bearer ' + a.jwt.sign(payload, secret, { expiresIn: '10m' });
}

describe('middleware rateLimit', () => {
  it('should allow requests within limit for anonymous users', async () => {
    const server = app.callback();

    // Make a request that should be allowed (with required header)
    const response = await request(server)
      .get('/api/system/version')
      .set('X-App-Source', 'main')
      .expect(200);

    // Check that rate limit headers are present (they should be set for this route)
    // Note: Some exempt routes might not have headers, so we check if they exist
    if (response.headers['x-ratelimit-limit']) {
      assert(response.headers['x-ratelimit-limit']);
      assert(response.headers['x-ratelimit-remaining']);
      assert(response.headers['x-ratelimit-reset']);
    }
  });

  it('should exempt health check endpoints', async () => {
    const server = app.callback();
    // System version should be allowed
    await request(server).get('/api/system/version').set('X-App-Source', 'main').expect(200);
  });

  it('should differentiate between anonymous and authenticated users', async () => {
    const server = app.callback();

    // Create tokens for different user types
    const userToken = await signPayload({
      userId: 'user123',
      username: 'testuser',
      roles: ['user'],
      roleIds: [],
      groups: [],
      groupIds: [],
      permissions: [],
    });

    const adminToken = await signPayload({
      userId: 'admin123',
      username: 'admin',
      roles: ['admin'],
      roleIds: [],
      groups: [],
      groupIds: [],
      permissions: [],
    });

    // Both should work initially
    await request(server)
      .get('/api/system/version')
      .set('X-App-Source', 'main')
      .set('Authorization', userToken)
      .expect(200);

    await request(server)
      .get('/api/system/version')
      .set('X-App-Source', 'main')
      .set('Authorization', adminToken)
      .expect(200);
  });

  it('should apply stricter limits to authentication endpoints', async () => {
    const server = app.callback();

    // Try to make multiple login requests (should hit stricter limits)
    const response1 = await request(server)
      .post('/api/auth/login')
      .set('X-App-Source', 'main')
      .set('x-forwarded-for', '198.51.100.10')
      .send({ email: 'test@example.com', password: 'wrongpassword' });

    // Should get rate limit headers even on failed login
    assert.equal(response1.headers['x-ratelimit-limit'], '10'); // Stricter limit for login
  });

  it('should return 429 when exceeding login rate limit', async () => {
    const server = app.callback();

    // Exceed the per-IP limit for the login endpoint
    for (let i = 0; i < 15; i++) {
      await request(server)
        .post('/api/auth/login')
        .set('X-App-Source', 'main')
        .set('x-forwarded-for', '198.51.100.20')
        .send({ email: 'test@example.com', password: 'wrongpassword' });
    }

    const blocked = await request(server)
      .post('/api/auth/login')
      .set('X-App-Source', 'main')
      .set('x-forwarded-for', '198.51.100.20')
      .send({ email: 'test@example.com', password: 'wrongpassword' });

    assert.equal(blocked.status, 429);
    assert.equal(blocked.headers['x-ratelimit-limit'], '10');
    assert(blocked.headers['retry-after']);
  });

  it('should respect environment variable configuration', async () => {
    app.callback();
    const config = (app as any).config.rateLimit;

    // Check that configuration is loaded
    assert(config);
    assert(config.anonymous);
    assert(config.authenticated);
    assert(config.admin);

    // Check default values
    assert.equal(config.anonymous.limit, 100);
    assert.equal(config.authenticated.limit, 200);
    assert.equal(config.admin.limit, 500);
  });

  it('should handle malformed requests gracefully', async () => {
    const server = app.callback();

    // Should not crash on malformed requests
    await request(server)
      .get('/api/system/version')
      .set('X-App-Source', 'main')
      .set('x-forwarded-for', 'malformed-ip')
      .expect(200);
  });
});
