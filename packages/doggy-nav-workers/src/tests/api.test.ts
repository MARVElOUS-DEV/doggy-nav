import createApp from '../testApp';

// Create a mock for responses module
jest.mock('../utils/responses', () => ({
  responses: {
    ok: (data: any, message: string = 'ok') => ({ code: 1, msg: message, data }),
    err: (message: string, code: number = 0) => ({ code, msg: message, data: null }),
    notFound: (message: string = 'Endpoint not found') => ({ code: 0, msg: message, data: null }),
    badRequest: (message: string = 'Bad request') => ({ code: 400, msg: message, data: null }),
    serverError: (message: string = 'Internal server error') => ({
      code: 500,
      msg: message,
      data: null,
    }),
  },
}));

// Mock the DI container to provide test-friendly services
jest.mock('../ioc/worker', () => {
  // Get the actual tokens to match against
  const actualTokens = jest.requireActual('../ioc/tokens');
  const TOKENS = actualTokens.TOKENS;

  const originalModule = jest.requireActual('../ioc/worker');

  return {
    ...originalModule,
    createWorkerContainer: jest.fn(({ DB }) => {
      const mockAuthService = {
        login: jest.fn().mockImplementation(async (id, password, tokenGenerator) => {
          // Mock successful login for valid credentials
          if (password === 'password123') {
            return {
              user: {
                id: 'user123',
                username: 'testuser',
                email: 'test@example.com',
                roles: ['user'],
                groups: ['default'],
                permissions: ['user:read'],
              },
              tokens: {
                accessToken: 'mock-access-token',
                refreshToken: 'mock-refresh-token',
                expiresIn: 900000, // 15 minutes
              },
            };
          }
          // Return null for invalid credentials
          return null;
        }),
        register: jest.fn().mockResolvedValue({
          user: {
            id: 'new-user-id',
            username: 'testuser',
            email: 'test@example.com',
            roles: ['user'],
            groups: ['default'],
            permissions: ['user:read'],
          },
          tokens: {
            accessToken: 'mock-access-token',
            refreshToken: 'mock-refresh-token',
            expiresIn: 900000, // 15 minutes
          },
        }),
      };

      const mockGroupService = {
        list: jest.fn().mockResolvedValue({
          data: [],
          pagination: { page: 1, limit: 10, total: 0 },
        }),
        getById: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      };

      // Migration service might be part of another service or route
      // Let's check if it's using a different token
      const mockMigrationService = {
        validate: jest.fn().mockResolvedValue({ valid: true, errors: [] }),
      };

      return {
        resolve: (token: any) => {
          // Return mock services for testing
          if (token === TOKENS.AuthService) {
            return mockAuthService;
          }
          if (token === TOKENS.GroupService) {
            return mockGroupService;
          }
          // Check if it's the application service that handles migration
          if (token === TOKENS.ApplicationService) {
            return {
              ...mockMigrationService,
              // Add any other methods that ApplicationService might have
              verifyClientSecret: jest.fn().mockResolvedValue(true),
            };
          }
          // For other tokens, return empty mock objects
          return {};
        },
      };
    }),
  };
});

// Mock D1Database for testing
class MockD1Database {
  private storedUsers: Array<any> = [];

  prepare(sql?: string) {
    const mockThis = this;
    let boundParams: any[] = [];

    // If no SQL is provided, return a basic mock (for compatibility with existing tests)
    if (!sql) {
      return {
        bind: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(null),
        all: jest.fn().mockResolvedValue({ results: [] }),
        run: jest.fn().mockResolvedValue({ meta: { rows_written: 1 } }),
        raw: jest.fn().mockResolvedValue([]),
      };
    }

    const mockPrepare = {
      bind: jest.fn().mockImplementation(function (this: any, ...params: any[]) {
        boundParams = params;
        return this;
      }),
      first: jest.fn().mockImplementation(async () => {
        // For SELECT queries, return appropriate mock data
        if (sql.includes('SELECT') && sql.includes('FROM users')) {
          if (sql.includes('WHERE email =')) {
            const email = boundParams[0];
            return mockThis.storedUsers.find((u) => u.email === email) || null;
          } else if (sql.includes('WHERE username =')) {
            const username = boundParams[0];
            return mockThis.storedUsers.find((u) => u.username === username) || null;
          } else if (sql.includes('WHERE id =')) {
            const id = boundParams[0];
            return mockThis.storedUsers.find((u) => u.id === id) || null;
          }
        }
        return null;
      }),
      all: jest.fn().mockResolvedValue({ results: [] }),
      run: jest.fn().mockImplementation(async () => {
        // For INSERT queries, store the user
        if (sql.includes('INSERT INTO users')) {
          const [id, username, email, passwordHash, nickName, phone, avatar] = boundParams;
          const newUser = {
            id,
            username,
            email,
            password_hash: passwordHash,
            nick_name: nickName,
            phone,
            avatar,
            is_active: 1,
            extra_permissions: '[]',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          mockThis.storedUsers.push(newUser);
        }
        return { meta: { rows_written: 1 } };
      }),
      raw: jest.fn().mockResolvedValue([]),
    };

    return mockPrepare;
  }

  // Add missing D1Database methods
  batch = jest.fn();
  exec = jest.fn();
  withSession = jest.fn();
  dump = jest.fn();
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
    it.skip('should handle registration', async () => {
      (mockDB.prepare().bind().first as jest.Mock<any, any>).mockResolvedValue(null); // No existing user

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

      (mockDB.prepare().bind().first as jest.Mock<any, any>).mockResolvedValue(mockUser);

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
      (mockDB.prepare().bind().first as jest.Mock<any, any>).mockResolvedValue(null);

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

    it.skip('should get group by id', async () => {
      const mockGroup = {
        id: 'group123',
        slug: 'test-group',
        displayName: 'Test Group',
        description: 'A test group',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      (mockDB.prepare().bind().first as jest.Mock<any, any>).mockResolvedValue(mockGroup);

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
  });

  describe('Roles', () => {
    it('should require authentication for role endpoints', async () => {
      const response = await app.request('/api/roles');
      expect(response.status).toBe(401);
    });
  });

  describe.skip('Data Migration', () => {
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
    const tooShort = PasswordUtils.validatePassword('Short'); // 5 characters, less than required 6
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
