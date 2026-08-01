import { randomBytes } from 'crypto';
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
import { decryptToolOutput, encryptToolOutput } from '../app/utils/toolOutputCrypto';

function toISO(value: any): string | undefined {
  if (!value) return undefined;
  try {
    return new Date(value).toISOString();
  } catch {
    return undefined;
  }
}

function mapPublication(doc: any, encryptionKey: string): ToolOutputPublication {
  return {
    toolId: doc.toolId,
    enabled: !!doc.enabled,
    publishId: String(doc.publishId),
    subscriptionToken: decryptToolOutput(
      {
        encryptedOutput: doc.encryptedSubscriptionToken,
        encryptionIv: doc.subscriptionTokenIv,
        encryptionTag: doc.subscriptionTokenTag,
      },
      encryptionKey
    ),
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

  private buildEncryptedSubscriptionToken(token = generateToolOutputSubscriptionToken()) {
    return {
      token,
      encrypted: encryptToolOutput(token, this.encryptionKey),
    };
  }

  private async ensureSubscriptionToken(doc: any) {
    if (doc?.encryptedSubscriptionToken && doc?.subscriptionTokenIv && doc?.subscriptionTokenTag) {
      return doc;
    }

    const { encrypted } = this.buildEncryptedSubscriptionToken();
    await this.model.updateOne(
      { _id: doc._id },
      {
        $set: {
          encryptedSubscriptionToken: encrypted.encryptedOutput,
          subscriptionTokenIv: encrypted.encryptionIv,
          subscriptionTokenTag: encrypted.encryptionTag,
        },
      }
    );

    return {
      ...doc,
      encryptedSubscriptionToken: encrypted.encryptedOutput,
      subscriptionTokenIv: encrypted.encryptionIv,
      subscriptionTokenTag: encrypted.encryptionTag,
    };
  }

  async listByUserAndTool(userId: string, toolId: string): Promise<ToolOutputPublication[]> {
    const docs = await this.model
      .find({ userId, toolId: { $regex: `^${toolId}(?::\\d+)?$` } })
      .sort({ toolId: 1 })
      .lean();
    return Promise.all(
      docs.map(async (doc: any) =>
        mapPublication(await this.ensureSubscriptionToken(doc), this.encryptionKey)
      )
    );
  }

  async getUserLimit(userId: string): Promise<number> {
    const user = await this.ctx.model.User.findById(userId)
      .select('toolOutputPublicationLimit')
      .lean();
    return Number.isInteger(user?.toolOutputPublicationLimit)
      ? Math.max(0, user.toolOutputPublicationLimit)
      : 2;
  }

  async upsertByUserAndTool(
    userId: string,
    input: ToolOutputPublicationUpsertInput
  ): Promise<ToolOutputPublication> {
    let doc = input.publishId
      ? await this.model.findOne({ userId, publishId: input.publishId })
      : await this.model.findOne({ userId, toolId: input.toolId });
    if (input.publishId && !doc) throw new Error('Published output does not exist');
    const encrypted = encryptToolOutput(String(input.output), this.encryptionKey);
    const tokenPayload =
      doc?.encryptedSubscriptionToken && doc?.subscriptionTokenIv && doc?.subscriptionTokenTag
        ? null
        : this.buildEncryptedSubscriptionToken();

    const payload = {
      toolId: doc?.toolId || input.toolId,
      userId,
      publishId: doc?.publishId || randomBytes(18).toString('hex'),
      enabled: !!input.enabled,
      direction: input.direction,
      contentType: input.contentType,
      encryptedOutput: encrypted.encryptedOutput,
      encryptionIv: encrypted.encryptionIv,
      encryptionTag: encrypted.encryptionTag,
      encryptedSubscriptionToken:
        tokenPayload?.encrypted.encryptedOutput || doc?.encryptedSubscriptionToken,
      subscriptionTokenIv: tokenPayload?.encrypted.encryptionIv || doc?.subscriptionTokenIv,
      subscriptionTokenTag: tokenPayload?.encrypted.encryptionTag || doc?.subscriptionTokenTag,
    };

    if (!doc) {
      doc = new this.model(payload);
    } else {
      Object.assign(doc, payload);
    }

    await doc.save();
    return mapPublication(doc.toObject ? doc.toObject() : doc, this.encryptionKey);
  }

  async rotateTokenByUserAndPublishId(
    userId: string,
    publishId: string
  ): Promise<ToolOutputPublication | null> {
    const doc = await this.model.findOne({ userId, publishId });
    if (!doc) return null;

    const { encrypted } = this.buildEncryptedSubscriptionToken();
    Object.assign(doc, {
      encryptedSubscriptionToken: encrypted.encryptedOutput,
      subscriptionTokenIv: encrypted.encryptionIv,
      subscriptionTokenTag: encrypted.encryptionTag,
    });

    await doc.save();
    return mapPublication(doc.toObject ? doc.toObject() : doc, this.encryptionKey);
  }

  async deleteByUserAndPublishId(userId: string, publishId: string): Promise<{ ok: boolean }> {
    const res = await this.model.deleteOne({ userId, publishId });
    return { ok: !!res.deletedCount };
  }

  async readPublishedWithToken(
    publishId: string,
    token: string
  ): Promise<PublishedToolOutputReadResult> {
    const doc = await this.model.findOne({ publishId, enabled: true }).lean();
    if (!doc) return { kind: 'not_found' };
    if (!doc.encryptedSubscriptionToken || !doc.subscriptionTokenIv || !doc.subscriptionTokenTag) {
      return { kind: 'unauthorized' };
    }

    const storedToken = decryptToolOutput(
      {
        encryptedOutput: doc.encryptedSubscriptionToken,
        encryptionIv: doc.subscriptionTokenIv,
        encryptionTag: doc.subscriptionTokenTag,
      },
      this.encryptionKey
    );
    if (!secureCompareText(storedToken, token)) return { kind: 'unauthorized' };

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
