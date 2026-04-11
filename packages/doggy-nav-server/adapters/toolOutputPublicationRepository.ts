import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import type {
  PublishedToolOutputReadResult,
  ToolOutputPublicationRepository,
  ToolOutputPublicationUpsertInput,
} from 'doggy-nav-core';
import type { ToolOutputPublication } from 'doggy-nav-core';
import { decryptToolOutput, encryptToolOutput } from '../app/utils/toolOutputCrypto';

function toISO(value: any): string | undefined {
  if (!value) return undefined;
  try {
    return new Date(value).toISOString();
  } catch {
    return undefined;
  }
}

function mapMetadata(doc: any): ToolOutputPublication {
  return {
    toolId: doc.toolId,
    enabled: !!doc.enabled,
    publishId: String(doc.publishId),
    basicAuthUsername: doc.basicAuthUsername,
    hasPassword: !!doc.basicAuthPasswordHash,
    direction: doc.direction,
    contentType: doc.contentType,
    createdAt: toISO(doc.createdAt),
    updatedAt: toISO(doc.updatedAt),
  };
}

export class MongooseToolOutputPublicationRepository implements ToolOutputPublicationRepository {
  constructor(private readonly ctx: any) {}

  private get model() {
    return this.ctx.model.ToolOutputPublication;
  }

  private get encryptionKey(): string {
    return this.ctx.app.config.toolOutput?.encryptionKey || '';
  }

  async getByUserAndTool(userId: string, toolId: string): Promise<ToolOutputPublication | null> {
    const doc = await this.model.findOne({ userId, toolId }).lean();
    return doc ? mapMetadata(doc) : null;
  }

  async upsertByUserAndTool(
    userId: string,
    input: ToolOutputPublicationUpsertInput
  ): Promise<ToolOutputPublication> {
    let doc = await this.model.findOne({ userId, toolId: input.toolId });
    const encrypted = encryptToolOutput(String(input.output), this.encryptionKey);
    const passwordHash = input.basicAuthPassword
      ? await bcrypt.hash(String(input.basicAuthPassword), 12)
      : doc?.basicAuthPasswordHash;

    if (!passwordHash) {
      throw new Error('Basic Auth password is required');
    }

    const payload = {
      toolId: input.toolId,
      userId,
      publishId: doc?.publishId || randomBytes(18).toString('hex'),
      enabled: !!input.enabled,
      direction: input.direction,
      contentType: input.contentType,
      encryptedOutput: encrypted.encryptedOutput,
      encryptionIv: encrypted.encryptionIv,
      encryptionTag: encrypted.encryptionTag,
      basicAuthUsername: input.basicAuthUsername,
      basicAuthPasswordHash: passwordHash,
    };

    if (!doc) {
      doc = new this.model(payload);
    } else {
      Object.assign(doc, payload);
    }

    await doc.save();
    return mapMetadata(doc);
  }

  async deleteByUserAndTool(userId: string, toolId: string): Promise<{ ok: boolean }> {
    const res = await this.model.deleteOne({ userId, toolId });
    return { ok: !!res.deletedCount };
  }

  async readPublishedWithBasicAuth(
    publishId: string,
    username: string,
    password: string
  ): Promise<PublishedToolOutputReadResult> {
    const doc = await this.model.findOne({ publishId, enabled: true }).lean();
    if (!doc) return { kind: 'not_found' };
    if (String(doc.basicAuthUsername) !== String(username)) {
      return { kind: 'unauthorized' };
    }

    const matches = await bcrypt.compare(String(password), String(doc.basicAuthPasswordHash));
    if (!matches) return { kind: 'unauthorized' };

    const output = decryptToolOutput(
      {
        encryptedOutput: doc.encryptedOutput,
        encryptionIv: doc.encryptionIv,
        encryptionTag: doc.encryptionTag,
      },
      this.encryptionKey
    );

    return {
      kind: 'ok',
      data: {
        toolId: doc.toolId,
        publishId: doc.publishId,
        userId: doc.userId?.toString?.() ?? String(doc.userId),
        direction: doc.direction,
        contentType: doc.contentType,
        output,
      },
    };
  }
}

export default MongooseToolOutputPublicationRepository;
