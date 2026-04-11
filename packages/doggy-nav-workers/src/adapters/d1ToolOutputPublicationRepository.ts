import bcrypt from 'bcryptjs';
import type {
  PublishedToolOutputReadResult,
  ToolOutputPublicationRepository,
  ToolOutputPublicationUpsertInput,
} from 'doggy-nav-core';
import type { ToolOutputPublication } from 'doggy-nav-core';
import { newId24 } from '../utils/id';
import { decryptToolOutput, encryptToolOutput } from '../utils/toolOutputCrypto';

function rowToPublication(row: any): ToolOutputPublication {
  return {
    toolId: row.tool_id,
    enabled: Number(row.enabled) === 1,
    publishId: row.publish_id,
    basicAuthUsername: row.basic_auth_username,
    hasPassword: !!row.basic_auth_password_hash,
    direction: row.direction,
    contentType: row.content_type,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export default class D1ToolOutputPublicationRepository implements ToolOutputPublicationRepository {
  private schemaReady: Promise<void> | null = null;

  constructor(
    private readonly db: D1Database,
    private readonly encryptionKey: string
  ) {}

  private ensureSchema() {
    if (!this.schemaReady) {
      this.schemaReady = (async () => {
        await this.db
          .prepare(
            `CREATE TABLE IF NOT EXISTS tool_output_publications (
              id TEXT PRIMARY KEY,
              tool_id TEXT NOT NULL,
              user_id TEXT NOT NULL,
              publish_id TEXT NOT NULL UNIQUE,
              enabled INTEGER NOT NULL DEFAULT 0,
              direction TEXT NOT NULL CHECK (direction IN ('yaml-to-json', 'json-to-yaml')),
              content_type TEXT NOT NULL,
              encrypted_output TEXT NOT NULL,
              encryption_iv TEXT NOT NULL,
              encryption_tag TEXT NOT NULL,
              basic_auth_username TEXT NOT NULL,
              basic_auth_password_hash TEXT NOT NULL,
              created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
              updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
              UNIQUE(user_id, tool_id)
            )`
          )
          .run();
        await this.db
          .prepare(
            `CREATE INDEX IF NOT EXISTS idx_tool_output_publications_publish_id
             ON tool_output_publications(publish_id)`
          )
          .run();
        await this.db
          .prepare(
            `CREATE INDEX IF NOT EXISTS idx_tool_output_publications_user_tool
             ON tool_output_publications(user_id, tool_id)`
          )
          .run();
        await this.db
          .prepare(
            `CREATE TRIGGER IF NOT EXISTS update_tool_output_publications_updated_at
             AFTER UPDATE ON tool_output_publications
             FOR EACH ROW
            BEGIN
              UPDATE tool_output_publications
              SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
              WHERE id = NEW.id;
            END`
          )
          .run();
      })();
    }
    return this.schemaReady;
  }

  async getByUserAndTool(userId: string, toolId: string): Promise<ToolOutputPublication | null> {
    await this.ensureSchema();
    const row = await this.db
      .prepare(
        `SELECT * FROM tool_output_publications
         WHERE user_id = ? AND tool_id = ?
         LIMIT 1`
      )
      .bind(userId, toolId)
      .first<any>();

    return row ? rowToPublication(row) : null;
  }

  async upsertByUserAndTool(
    userId: string,
    input: ToolOutputPublicationUpsertInput
  ): Promise<ToolOutputPublication> {
    await this.ensureSchema();
    const existing = await this.db
      .prepare(
        `SELECT * FROM tool_output_publications
         WHERE user_id = ? AND tool_id = ?
         LIMIT 1`
      )
      .bind(userId, input.toolId)
      .first<any>();

    const encrypted = await encryptToolOutput(String(input.output), this.encryptionKey);
    const passwordHash = input.basicAuthPassword
      ? await bcrypt.hash(String(input.basicAuthPassword), 12)
      : existing?.basic_auth_password_hash;

    if (!passwordHash) {
      throw new Error('Basic Auth password is required');
    }

    if (existing) {
      await this.db
        .prepare(
          `UPDATE tool_output_publications
           SET enabled = ?, direction = ?, content_type = ?,
               encrypted_output = ?, encryption_iv = ?, encryption_tag = ?,
               basic_auth_username = ?, basic_auth_password_hash = ?,
               updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
           WHERE id = ?`
        )
        .bind(
          input.enabled ? 1 : 0,
          input.direction,
          input.contentType,
          encrypted.encryptedOutput,
          encrypted.encryptionIv,
          encrypted.encryptionTag,
          input.basicAuthUsername,
          passwordHash,
          existing.id
        )
        .run();
    } else {
      const id = newId24();
      const publishId = `${newId24()}${newId24()}`;
      await this.db
        .prepare(
          `INSERT INTO tool_output_publications (
             id, tool_id, user_id, publish_id, enabled, direction, content_type,
             encrypted_output, encryption_iv, encryption_tag,
             basic_auth_username, basic_auth_password_hash
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          id,
          input.toolId,
          userId,
          publishId,
          input.enabled ? 1 : 0,
          input.direction,
          input.contentType,
          encrypted.encryptedOutput,
          encrypted.encryptionIv,
          encrypted.encryptionTag,
          input.basicAuthUsername,
          passwordHash
        )
        .run();
    }

    const row = await this.db
      .prepare(
        `SELECT * FROM tool_output_publications
         WHERE user_id = ? AND tool_id = ?
         LIMIT 1`
      )
      .bind(userId, input.toolId)
      .first<any>();

    return rowToPublication(row);
  }

  async deleteByUserAndTool(userId: string, toolId: string): Promise<{ ok: boolean }> {
    await this.ensureSchema();
    const result = await this.db
      .prepare(`DELETE FROM tool_output_publications WHERE user_id = ? AND tool_id = ?`)
      .bind(userId, toolId)
      .run();
    return { ok: Number(result.meta?.changes || 0) > 0 };
  }

  async readPublishedWithBasicAuth(
    publishId: string,
    username: string,
    password: string
  ): Promise<PublishedToolOutputReadResult> {
    await this.ensureSchema();
    const row = await this.db
      .prepare(
        `SELECT * FROM tool_output_publications
         WHERE publish_id = ? AND enabled = 1
         LIMIT 1`
      )
      .bind(publishId)
      .first<any>();

    if (!row) return { kind: 'not_found' };
    if (String(row.basic_auth_username) !== String(username)) {
      return { kind: 'unauthorized' };
    }

    const matches = await bcrypt.compare(String(password), String(row.basic_auth_password_hash));
    if (!matches) return { kind: 'unauthorized' };

    const output = await decryptToolOutput(
      {
        encryptedOutput: row.encrypted_output,
        encryptionIv: row.encryption_iv,
        encryptionTag: row.encryption_tag,
      },
      this.encryptionKey
    );

    return {
      kind: 'ok',
      data: {
        toolId: row.tool_id,
        publishId: row.publish_id,
        userId: row.user_id,
        direction: row.direction,
        contentType: row.content_type,
        output,
      },
    };
  }
}
