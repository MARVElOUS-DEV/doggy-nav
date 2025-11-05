import type { EmailSettingsRepository, EmailSettingsUpsertInput } from 'doggy-nav-core';
import type { EmailSettings } from 'doggy-nav-core';

function toISO(d: any): string | undefined {
  if (!d) return undefined;
  try { return new Date(d).toISOString(); } catch { return undefined; }
}

function mapDoc(doc: any): EmailSettings {
  return {
    smtpHost: doc.smtpHost,
    smtpPort: doc.smtpPort,
    smtpSecure: !!doc.smtpSecure,
    smtpUser: doc.smtpUser,
    fromName: doc.fromName,
    fromAddress: doc.fromAddress,
    replyTo: doc.replyTo,
    enableNotifications: !!doc.enableNotifications,
    adminEmails: Array.isArray(doc.adminEmails) ? doc.adminEmails : [],
    createdAt: toISO(doc.createdAt),
    updatedAt: toISO(doc.updatedAt),
  };
}

export class MongooseEmailSettingsRepository implements EmailSettingsRepository {
  constructor(private readonly ctx: any) {}
  private get model() { return this.ctx.model.EmailNotificationSettings; }

  async get(): Promise<EmailSettings | null> {
    const doc = await this.model.findOne().lean();
    return doc ? mapDoc(doc) : null;
  }

  async upsert(input: EmailSettingsUpsertInput): Promise<EmailSettings> {
    let doc = await this.model.findOne();
    const payload: any = {
      smtpHost: input.smtpHost,
      smtpPort: input.smtpPort,
      smtpSecure: !!input.smtpSecure,
      smtpUser: input.smtpUser,
      smtpPass: input.smtpPass,
      fromName: input.fromName,
      fromAddress: input.fromAddress,
      replyTo: input.replyTo,
      enableNotifications: !!input.enableNotifications,
      adminEmails: Array.isArray(input.adminEmails) ? input.adminEmails : [],
      updatedAt: new Date(),
    };
    if (!doc) {
      payload.createdAt = new Date();
      doc = new this.model(payload);
    } else {
      Object.assign(doc, payload);
    }
    await doc.save();
    return mapDoc(doc);
  }
}

export default MongooseEmailSettingsRepository;
