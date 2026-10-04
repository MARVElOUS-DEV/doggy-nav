import type { JWTPayload, JWTUtils, TokenPair } from './jwtUtils';

type AppSource = 'main' | 'admin';
type UserPayload = Omit<JWTPayload, 'iat' | 'exp' | 'typ'>;

interface SessionRow {
  id: string;
  user_id: string;
  source: AppSource;
  current_token_hash: string;
  previous_token_hash: string | null;
  rotated_at: string | null;
  expires_at: string;
  revoked_at: string | null;
}

export class RefreshConcurrencyError extends Error {}

async function hashTokenId(tokenId: string): Promise<string> {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(tokenId));
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function issueTrackedTokenPair(
  db: D1Database,
  jwt: JWTUtils,
  payload: UserPayload,
  source: AppSource
): Promise<TokenPair> {
  const sessionId = crypto.randomUUID();
  const tokenId = crypto.randomUUID();
  const tokens = await jwt.generateTokenPair(payload, { sessionId, tokenId, source });
  const now = new Date().toISOString();
  await db
    .prepare(
      `INSERT INTO refresh_sessions
       (id, user_id, source, current_token_hash, expires_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      sessionId,
      payload.userId,
      source,
      await hashTokenId(tokenId),
      new Date(tokens.refreshExpiresAt).toISOString(),
      now,
      now
    )
    .run();
  return tokens;
}

export async function rotateTrackedRefreshToken(
  db: D1Database,
  jwt: JWTUtils,
  rawToken: string,
  payload: UserPayload,
  source: AppSource
): Promise<TokenPair | null> {
  const decoded = await jwt.verifyRefreshToken(rawToken);
  if (!decoded || decoded.userId !== payload.userId || decoded.source !== source) return null;

  const row = await db
    .prepare('SELECT * FROM refresh_sessions WHERE id = ? AND user_id = ?')
    .bind(decoded.sessionId, decoded.userId)
    .first<SessionRow>();
  const now = new Date();
  if (!row || row.revoked_at || new Date(row.expires_at) <= now || row.source !== source)
    return null;

  const presentedHash = await hashTokenId(decoded.tokenId);
  if (presentedHash !== row.current_token_hash) {
    const recentDuplicate =
      presentedHash === row.previous_token_hash &&
      !!row.rotated_at &&
      now.getTime() - new Date(row.rotated_at).getTime() <= 10_000;
    if (recentDuplicate) throw new RefreshConcurrencyError('Refresh already completed');
    await db
      .prepare('UPDATE refresh_sessions SET revoked_at = ?, updated_at = ? WHERE id = ?')
      .bind(now.toISOString(), now.toISOString(), row.id)
      .run();
    return null;
  }

  const newTokenId = crypto.randomUUID();
  const tokens = await jwt.generateTokenPair(payload, {
    sessionId: row.id,
    tokenId: newTokenId,
    source,
  });
  const result = await db
    .prepare(
      `UPDATE refresh_sessions
       SET previous_token_hash = current_token_hash, current_token_hash = ?, rotated_at = ?,
           expires_at = ?, updated_at = ?
       WHERE id = ? AND current_token_hash = ? AND revoked_at IS NULL AND expires_at > ?`
    )
    .bind(
      await hashTokenId(newTokenId),
      now.toISOString(),
      new Date(tokens.refreshExpiresAt).toISOString(),
      now.toISOString(),
      row.id,
      presentedHash,
      now.toISOString()
    )
    .run();
  if (result.meta.changes !== 1) throw new RefreshConcurrencyError('Refresh already completed');
  return tokens;
}

export async function revokeTrackedRefreshToken(
  db: D1Database,
  jwt: JWTUtils,
  rawToken: string
): Promise<void> {
  const decoded = await jwt.verifyRefreshToken(rawToken);
  if (!decoded) return;
  const now = new Date().toISOString();
  await db
    .prepare('UPDATE refresh_sessions SET revoked_at = ?, updated_at = ? WHERE id = ?')
    .bind(now, now, decoded.sessionId)
    .run();
}
