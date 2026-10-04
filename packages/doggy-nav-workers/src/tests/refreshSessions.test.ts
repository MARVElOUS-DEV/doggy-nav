import { JWTUtils } from '../utils/jwtUtils';
import {
  issueTrackedTokenPair,
  RefreshConcurrencyError,
  rotateTrackedRefreshToken,
} from '../utils/refreshSessions';

type Row = Record<string, any>;

function createDb() {
  const rows = new Map<string, Row>();
  const db = {
    prepare(sql: string) {
      return {
        bind(...args: any[]) {
          return {
            async first() {
              if (!sql.startsWith('SELECT')) throw new Error(`Unexpected first: ${sql}`);
              const row = rows.get(args[0]);
              return row?.user_id === args[1] ? { ...row } : null;
            },
            async run() {
              if (sql.includes('INSERT INTO refresh_sessions')) {
                rows.set(args[0], {
                  id: args[0],
                  user_id: args[1],
                  source: args[2],
                  current_token_hash: args[3],
                  previous_token_hash: null,
                  rotated_at: null,
                  expires_at: args[4],
                  revoked_at: null,
                  created_at: args[5],
                  updated_at: args[6],
                });
                return { meta: { changes: 1 } };
              }
              const row = rows.get(sql.includes('current_token_hash = ?') ? args[4] : args[2]);
              if (!row) return { meta: { changes: 0 } };
              if (sql.includes('current_token_hash = ?')) {
                if (row.current_token_hash !== args[5] || row.revoked_at) {
                  return { meta: { changes: 0 } };
                }
                row.previous_token_hash = row.current_token_hash;
                row.current_token_hash = args[0];
                row.rotated_at = args[1];
                row.expires_at = args[2];
                row.updated_at = args[3];
              } else {
                row.revoked_at = args[0];
                row.updated_at = args[1];
              }
              return { meta: { changes: 1 } };
            },
          };
        },
      };
    },
  };
  return { db: db as unknown as D1Database, rows };
}

const payload = {
  userId: 'user-1',
  email: 'user@example.com',
  username: 'user',
  roles: ['user'],
  roleIds: ['role-1'],
  groups: ['group'],
  groupIds: ['group-1'],
  permissions: ['nav:read'],
};

describe('tracked refresh sessions', () => {
  it('rotates once and reports a concurrent duplicate without revoking', async () => {
    const { db, rows } = createDb();
    const jwt = new JWTUtils('jwt-secret');
    const original = await issueTrackedTokenPair(db, jwt, payload, 'main');

    await expect(
      rotateTrackedRefreshToken(db, jwt, original.refreshToken, payload, 'main')
    ).resolves.not.toBeNull();
    await expect(
      rotateTrackedRefreshToken(db, jwt, original.refreshToken, payload, 'main')
    ).rejects.toBeInstanceOf(RefreshConcurrencyError);
    expect([...rows.values()][0].revoked_at).toBeNull();
  });

  it('revokes a session when an old refresh token is replayed after the grace window', async () => {
    const { db, rows } = createDb();
    const jwt = new JWTUtils('jwt-secret');
    const original = await issueTrackedTokenPair(db, jwt, payload, 'main');
    await rotateTrackedRefreshToken(db, jwt, original.refreshToken, payload, 'main');
    const row = [...rows.values()][0];
    row.rotated_at = new Date(Date.now() - 11_000).toISOString();

    await expect(
      rotateTrackedRefreshToken(db, jwt, original.refreshToken, payload, 'main')
    ).resolves.toBeNull();
    expect(row.revoked_at).not.toBeNull();
  });
});
