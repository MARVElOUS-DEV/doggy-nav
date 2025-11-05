export type OAuthProvider = 'github' | 'google' | 'linuxdo';

export interface OAuthLink {
  id: string;
  userId: string;
  provider: OAuthProvider;
  providerUserId: string;
  accessToken?: string | null;
  refreshToken?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

function rowToLink(row: any): OAuthLink {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    provider: row.provider as OAuthProvider,
    providerUserId: String(row.provider_user_id),
    accessToken: row.access_token,
    refreshToken: row.refresh_token,
    createdAt: row.created_at ? new Date(row.created_at) : undefined,
    updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
  };
}

import { newId24 } from '../utils/id';

export class D1OAuthRepository {
  constructor(private readonly db: D1Database) {}

  async findByProviderUser(
    provider: OAuthProvider,
    providerUserId: string
  ): Promise<OAuthLink | null> {
    const stmt = this.db.prepare(
      `SELECT id, user_id, provider, provider_user_id, access_token, refresh_token, created_at, updated_at
      FROM oauth_providers WHERE provider = ? AND provider_user_id = ? LIMIT 1`
    );
    const row = await stmt.bind(provider, providerUserId).first<any>();
    return row ? rowToLink(row) : null;
  }

  async createLink(params: {
    userId: string;
    provider: OAuthProvider;
    providerUserId: string;
    accessToken?: string | null;
    refreshToken?: string | null;
  }): Promise<OAuthLink> {
    const id = newId24();

    await this.db
      .prepare(
        `INSERT INTO oauth_providers (id, user_id, provider, provider_user_id, access_token, refresh_token)
        VALUES (?, ?, ?, ?, ?, ?)`
      )
      .bind(
        id,
        params.userId,
        params.provider,
        params.providerUserId,
        params.accessToken ?? null,
        params.refreshToken ?? null
      )
      .run();

    const row = await this.db
      .prepare(
        `SELECT id, user_id, provider, provider_user_id, access_token, refresh_token, created_at, updated_at
        FROM oauth_providers WHERE id = ?`
      )
      .bind(id)
      .first<any>();

    return rowToLink(row);
  }

  async updateTokens(
    id: string,
    tokens: { accessToken?: string | null; refreshToken?: string | null }
  ) {
    const fields: string[] = [];
    const params: any[] = [];
    if (tokens.accessToken !== undefined) {
      fields.push('access_token = ?');
      params.push(tokens.accessToken);
    }
    if (tokens.refreshToken !== undefined) {
      fields.push('refresh_token = ?');
      params.push(tokens.refreshToken);
    }
    if (!fields.length) return;
    const sql = `UPDATE oauth_providers SET ${fields.join(', ')} WHERE id = ?`;
    await this.db
      .prepare(sql)
      .bind(...params, id)
      .run();
  }
}
