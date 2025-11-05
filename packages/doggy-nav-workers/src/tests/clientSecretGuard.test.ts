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

// Mock D1Database for testing
class MockD1Database {
  prepare() {
    return {
      bind: jest.fn().mockReturnThis(),
      first: jest.fn().mockResolvedValue(null),
      all: jest.fn().mockResolvedValue({ results: [] }),
      run: jest.fn().mockResolvedValue({ meta: { rows_written: 1 } }),
      raw: jest.fn().mockResolvedValue([]),
    };
  }

  // Add missing D1Database methods
  batch = jest.fn();
  exec = jest.fn();
  withSession = jest.fn();
  dump = jest.fn();
}

describe('Client Secret Guard (workers)', () => {
  let app: ReturnType<typeof createApp>;
  let mockDB: MockD1Database;

  beforeEach(() => {
    mockDB = new MockD1Database();
    app = createApp({
      DB: mockDB,
      JWT_SECRET: 'test-secret-key',
      NODE_ENV: 'test',
      REQUIRE_CLIENT_SECRET: 'true',
      CLIENT_SECRET_HEADER: 'x-client-secret',
    });
  });

  it('returns 401 when client secret is required but missing', async () => {
    const res = await app.request('/api/groups?page=1&limit=10');
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.code).toBe(0);
  });
});
