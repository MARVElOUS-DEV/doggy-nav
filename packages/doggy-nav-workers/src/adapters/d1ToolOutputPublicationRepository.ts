import type {
  PublishedToolOutputReadResult,
  ToolOutputPublicationRepository,
  ToolOutputPublicationUpsertInput,
} from 'doggy-nav-core';
import {
  generateToolOutputSubscriptionToken,
  secureCompareText,
  type ToolOutputPublication,
} from 'doggy-nav-core';
import { newId24 } from '../utils/id';
import { decryptToolOutput, encryptToolOutput } from '../utils/toolOutputCrypto';

const LEGACY_BASIC_AUTH_USERNAME = 'subscription-token';
const LEGACY_BASIC_AUTH_PASSWORD_HASH = 'deprecated';

async function rowToPublication(row: any, encryptionKey: string): Promise<ToolOutputPublication> {
  return {
    toolId: row.tool_id,
    enabled: Number(row.enabled) === 1,
    publishId: row.publish_id,
    subscriptionToken: await decryptToolOutput(
      {
        encryptedOutput: row.encrypted_subscription_token,
        encryptionIv: row.subscription_token_iv,
        encryptionTag: row.subscription_token_tag,
      },
      encryptionKey
    ),
    direction: row.direction,
    contentType: row.content_type,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export default class D1ToolOutputPublicationRepository implements ToolOutputPublicationRepository {
  constructor(
    private readonly db: D1Database,
    private readonly encryptionKey: string
  ) {}

  private async buildEncryptedSubscriptionToken(token = generateToolOutputSubscriptionToken()) {
    return {
      token,
      encrypted: await encryptToolOutput(token, this.encryptionKey),
    };
  }

  private async getRowByUserAndTool(userId: string, toolId: string) {
    return this.db
      .prepare(
        `SELECT * FROM tool_output_publications
         WHERE user_id = ? AND tool_id = ?
         LIMIT 1`
      )
      .bind(userId, toolId)
      .first<any>();
  }

  private async getRowByUserAndPublishId(userId: string, publishId: string) {
    return this.db
      .prepare(
        `SELECT * FROM tool_output_publications
         WHERE user_id = ? AND publish_id = ?
         LIMIT 1`
      )
      .bind(userId, publishId)
      .first<any>();
  }

  private async ensureSubscriptionTokenForRow(row: any) {
    if (
      row?.encrypted_subscription_token &&
      row?.subscription_token_iv &&
      row?.subscription_token_tag
    ) {
      return row;
    }

    const { encrypted } = await this.buildEncryptedSubscriptionToken();
    await this.db
      .prepare(
        `UPDATE tool_output_publications
         SET encrypted_subscription_token = ?, subscription_token_iv = ?, subscription_token_tag = ?,
             updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
         WHERE id = ?`
      )
      .bind(encrypted.encryptedOutput, encrypted.encryptionIv, encrypted.encryptionTag, row.id)
      .run();

    return {
      ...row,
      encrypted_subscription_token: encrypted.encryptedOutput,
      subscription_token_iv: encrypted.encryptionIv,
      subscription_token_tag: encrypted.encryptionTag,
    };
  }

  async listByUserAndTool(userId: string, toolId: string): Promise<ToolOutputPublication[]> {
    const rows = await this.db
      .prepare(
        `SELECT * FROM tool_output_publications
         WHERE user_id = ? AND (tool_id = ? OR tool_id GLOB ?)
         ORDER BY tool_id`
      )
      .bind(userId, toolId, `${toolId}:[0-9]*`)
      .all<any>();
    return Promise.all(
      (rows.results || []).map(async (row: any) =>
        rowToPublication(await this.ensureSubscriptionTokenForRow(row), this.encryptionKey)
      )
    );
  }

  async getUserLimit(userId: string): Promise<number> {
    const row = await this.db
      .prepare(`SELECT tool_output_publication_limit AS value FROM users WHERE id = ? LIMIT 1`)
      .bind(userId)
      .first<{ value: number }>();
    return Number.isInteger(row?.value) ? Math.max(0, Number(row?.value)) : 2;
  }

  async upsertByUserAndTool(
    userId: string,
    input: ToolOutputPublicationUpsertInput
  ): Promise<ToolOutputPublication> {
    const existing = input.publishId
      ? await this.getRowByUserAndPublishId(userId, input.publishId)
      : await this.getRowByUserAndTool(userId, input.toolId);
    if (input.publishId && !existing) throw new Error('Published output does not exist');
    const encrypted = await encryptToolOutput(String(input.output), this.encryptionKey);
    const tokenPayload =
      existing?.encrypted_subscription_token &&
      existing?.subscription_token_iv &&
      existing?.subscription_token_tag
        ? null
        : await this.buildEncryptedSubscriptionToken();

    if (existing) {
      await this.db
        .prepare(
          `UPDATE tool_output_publications
           SET enabled = ?, direction = ?, content_type = ?,
               encrypted_output = ?, encryption_iv = ?, encryption_tag = ?,
               encrypted_subscription_token = ?, subscription_token_iv = ?, subscription_token_tag = ?,
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
          tokenPayload?.encrypted.encryptedOutput || existing.encrypted_subscription_token,
          tokenPayload?.encrypted.encryptionIv || existing.subscription_token_iv,
          tokenPayload?.encrypted.encryptionTag || existing.subscription_token_tag,
          existing.id
        )
        .run();
    } else {
      const id = newId24();
      const publishId = `${newId24()}${newId24()}`;
      const generatedToken = tokenPayload || (await this.buildEncryptedSubscriptionToken());
      await this.db
        .prepare(
          `INSERT INTO tool_output_publications (
             id, tool_id, user_id, publish_id, enabled, direction, content_type,
             encrypted_output, encryption_iv, encryption_tag,
             basic_auth_username, basic_auth_password_hash,
             encrypted_subscription_token, subscription_token_iv, subscription_token_tag
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
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
          LEGACY_BASIC_AUTH_USERNAME,
          LEGACY_BASIC_AUTH_PASSWORD_HASH,
          generatedToken.encrypted.encryptedOutput,
          generatedToken.encrypted.encryptionIv,
          generatedToken.encrypted.encryptionTag
        )
        .run();
    }

    const row = input.publishId
      ? await this.getRowByUserAndPublishId(userId, input.publishId)
      : await this.getRowByUserAndTool(userId, input.toolId);
    return rowToPublication(row, this.encryptionKey);
  }

  async rotateTokenByUserAndPublishId(
    userId: string,
    publishId: string
  ): Promise<ToolOutputPublication | null> {
    const existing = await this.getRowByUserAndPublishId(userId, publishId);
    if (!existing) return null;

    const { encrypted } = await this.buildEncryptedSubscriptionToken();
    await this.db
      .prepare(
        `UPDATE tool_output_publications
         SET encrypted_subscription_token = ?, subscription_token_iv = ?, subscription_token_tag = ?,
             updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
         WHERE id = ?`
      )
      .bind(encrypted.encryptedOutput, encrypted.encryptionIv, encrypted.encryptionTag, existing.id)
      .run();

    const row = await this.getRowByUserAndPublishId(userId, publishId);
    return row ? rowToPublication(row, this.encryptionKey) : null;
  }

  async deleteByUserAndPublishId(userId: string, publishId: string): Promise<{ ok: boolean }> {
    const result = await this.db
      .prepare(`DELETE FROM tool_output_publications WHERE user_id = ? AND publish_id = ?`)
      .bind(userId, publishId)
      .run();
    return { ok: Number(result.meta?.changes || 0) > 0 };
  }

  async readPublishedWithToken(
    publishId: string,
    token: string
  ): Promise<PublishedToolOutputReadResult> {
    const row = await this.db
      .prepare(
        `SELECT * FROM tool_output_publications
         WHERE publish_id = ? AND enabled = 1
         LIMIT 1`
      )
      .bind(publishId)
      .first<any>();

    if (!row) return { kind: 'not_found' };
    if (
      !row.encrypted_subscription_token ||
      !row.subscription_token_iv ||
      !row.subscription_token_tag
    ) {
      return { kind: 'unauthorized' };
    }

    const storedToken = await decryptToolOutput(
      {
        encryptedOutput: row.encrypted_subscription_token,
        encryptionIv: row.subscription_token_iv,
        encryptionTag: row.subscription_token_tag,
      },
      this.encryptionKey
    );
    if (!secureCompareText(storedToken, token)) return { kind: 'unauthorized' };

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
