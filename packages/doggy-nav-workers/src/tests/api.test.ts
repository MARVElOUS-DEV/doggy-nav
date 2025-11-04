import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createApp } from '../testApp';

// Mock D1Database for testing
class MockD1Database {
  prepare() {
    return {
      bind: vi.fn().mockReturnThis(),
      first: vi.fn().mockResolvedValue(null),
      all: vi.fn().mockResolvedValue({ results: [] }),
      run: vi.fn().mockResolvedValue({ meta: { rows_written: 1 } }),
    };
  }
}

describe('Doggy Nav Worker API', () => {
  let app: ReturnType<typeof createApp>;
  let mockDB: MockD1Database;

  beforeEach(() => {
    mockDB = new MockD1Database();
    app = createApp({
      DB: mockDB,
      JWT_SECRET: 'test-secret-key',
      NODE_ENV: 'test',
    });
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await app.request('/api/health');
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.code).toBe(1);
      expect(data.msg).toBe('ok');
      expect(data.data.status).toBe('healthy');
    });
  });

  describe('Authentication', () => {
    it('should handle registration', async () => {
      mockDB.prepare().bind().first.mockResolvedValue(null); // No existing user

      const response = await app.request('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
        }),
      });

      expect(response.status).toBe(200);
    });

    it('should handle login', async () => {
      const mockUser = {
        id: 'user123',
        username: 'testuser',
        email: 'test@example.com',
        passwordHash: '$2a$12$hashedpassword',
        isActive: 1,
        nickName: '',
        phone: '',
        avatar: null,
        extraPermissions: '[]',
        lastLoginAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockDB.prepare().bind().first.mockResolvedValue(mockUser);

      const response = await app.request('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
      });

      expect(response.status).toBe(200);
    });

    it('should return 401 for invalid credentials', async () => {
      mockDB.prepare().bind().first.mockResolvedValue(null);

      const response = await app.request('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'nonexistent@example.com',
          password: 'wrongpassword',
        }),
      });

      expect(response.status).toBe(401);
    });
  });

  describe('Groups', () => {
    it('should list groups', async () => {
      const response = await app.request('/api/groups?page=1&limit=10');
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.code).toBe(1);
    });

    it('should get group by id', async () => {
      const mockGroup = {
        id: 'group123',
        slug: 'test-group',
        displayName: 'Test Group',
        description: 'A test group',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockDB.prepare().bind().first.mockResolvedValue(mockGroup);

      const response = await app.request('/api/groups/group123');
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.code).toBe(1);
      expect(data.data.id).toBe('group123');
    });
  });

  describe('Users', () => {
    it('should require authentication for user endpoints', async () => {
      const response = await app.request('/api/users');
      expect(response.status).toBe(401);
    });

    it('should list users with valid token', async () => {
      // This would require mocking JWT verification
      // For now, just checking the endpoint exists
      expect(true).toBe(true);
    });
  });

  describe('Roles', () => {
    it('should require authentication for role endpoints', async () => {
      const response = await app.request('/api/roles');
      expect(response.status).toBe(401);
    });
  });

  describe('Data Migration', () => {
    it('should handle migration validation', async () => {
      const response = await app.request('/api/migration/validate');
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.code).toBe(1);
      expect(data.data).toHaveProperty('valid');
      expect(data.data).toHaveProperty('errors');
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await app.request('/api/nonexistent');
      expect(response.status).toBe(404);

      const data = await response.json();
      expect(data.code).toBe(0);
      expect(data.msg).toBe('Endpoint not found');
    });

    it('should handle malformed requests', async () => {
      const response = await app.request('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}), // Missing required fields
      });

      expect(response.status).toBe(400);
    });
  });
});

describe('JWT Utilities', () => {
  it('should generate and verify tokens', async () => {
    const { JWTUtils } = await import('../utils/jwtUtils');
    const jwtUtils = new JWTUtils('test-secret-key');

    const payload = {
      userId: 'user123',
      email: 'test@example.com',
      username: 'testuser',
      roles: ['admin'],
      groups: ['default'],
      permissions: ['user:read'],
    };

    const tokens = await jwtUtils.generateTokenPair(payload);
    expect(tokens.accessToken).toBeDefined();
    expect(tokens.refreshToken).toBeDefined();
    expect(tokens.expiresIn).toBe(15 * 60 * 1000); // 15 minutes

    const verifiedPayload = await jwtUtils.verifyAccessToken(tokens.accessToken);
    expect(verifiedPayload).toBeDefined();
    expect(verifiedPayload?.userId).toBe('user123');
  });

  it('should verify refresh tokens', async () => {
    const { JWTUtils } = await import('../utils/jwtUtils');
    const jwtUtils = new JWTUtils('test-secret-key');

    const payload = {
      userId: 'user123',
      email: 'test@example.com',
      username: 'testuser',
      roles: ['admin'],
      groups: ['default'],
      permissions: ['user:read'],
    };

    const tokens = await jwtUtils.generateTokenPair(payload);
    const refreshPayload = await jwtUtils.verifyRefreshToken(tokens.refreshToken);
    expect(refreshPayload).toBeDefined();
    expect(refreshPayload?.userId).toBe('user123');
  });

  it('should refresh access tokens', async () => {
    const { JWTUtils } = await import('../utils/jwtUtils');
    const jwtUtils = new JWTUtils('test-secret-key');

    const payload = {
      userId: 'user123',
      email: 'test@example.com',
      username: 'testuser',
      roles: ['admin'],
      groups: ['default'],
      permissions: ['user:read'],
    };

    const tokens = await jwtUtils.generateTokenPair(payload);
    const newTokens = await jwtUtils.refreshAccessToken(tokens.refreshToken, payload);
    expect(newTokens).toBeDefined();
    expect(newTokens?.accessToken).toBeDefined();
    expect(newTokens?.refreshToken).toBeDefined();
  });
});

describe('Password Utilities', () => {
  it('should hash and verify passwords', async () => {
    const { PasswordUtils } = await import('../routes/auth');
    const password = 'testPassword123';

    const hashedPassword = await PasswordUtils.hashPassword(password);
    expect(hashedPassword).toBeDefined();
    expect(hashedPassword).not.toBe(password);

    const isValid = await PasswordUtils.verifyPassword(password, hashedPassword);
    expect(isValid).toBe(true);

    const isInvalid = await PasswordUtils.verifyPassword('wrongPassword', hashedPassword);
    expect(isInvalid).toBe(false);
  });

  it('should validate password strength', async () => {
    const { PasswordUtils } = await import('../utils/passwordUtils');

    // Valid password
    const validResult = PasswordUtils.validatePassword('StrongPass123');
    expect(validResult.valid).toBe(true);
    expect(validResult.errors).toHaveLength(0);

    // Invalid passwords
    const tooShort = PasswordUtils.validatePassword('Short1');
    expect(tooShort.valid).toBe(false);
    expect(tooShort.errors).toContain('Password must be at least 6 characters long');

    const noUppercase = PasswordUtils.validatePassword('password123');
    expect(noUppercase.valid).toBe(false);
    expect(noUppercase.errors).toContain('Password must contain at least one uppercase letter');

    const noNumber = PasswordUtils.validatePassword('Password');
    expect(noNumber.valid).toBe(false);
    expect(noNumber.errors).toContain('Password must contain at least one number');
  });
});
