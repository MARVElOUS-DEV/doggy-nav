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
    } as any;
  }
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
