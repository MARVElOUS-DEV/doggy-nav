import type { EmailSettings } from '../types/types';
import type {
  EmailSettingsRepository,
  EmailSettingsUpsertInput,
} from '../repositories/EmailSettingsRepository';

export class EmailSettingsService {
  constructor(private readonly repo: EmailSettingsRepository) {}

  async get(): Promise<EmailSettings | null> {
    return this.repo.get();
  }

  async update(input: Partial<EmailSettingsUpsertInput>): Promise<EmailSettings> {
    const required = ['smtpHost', 'smtpUser', 'fromAddress'] as const;
    for (const k of required) {
      if (
        !(k in input) ||
        input[k] === undefined ||
        input[k] === null ||
        String(input[k]).trim() === ''
      ) {
        const err = new Error('Missing required fields: smtpHost, smtpUser, fromAddress');
        (err as any).name = 'ValidationError';
        throw err;
      }
    }
    if (typeof input.smtpPort !== 'number') input.smtpPort = Number(input.smtpPort || 587);
    if (typeof input.smtpSecure !== 'boolean') input.smtpSecure = !!input.smtpSecure;
    if (!Array.isArray(input.adminEmails))
      input.adminEmails = Array.isArray(input.adminEmails) ? input.adminEmails : [];
    if (typeof input.enableNotifications !== 'boolean')
      input.enableNotifications = !!input.enableNotifications;
    if (!input.fromName) input.fromName = 'Doggy Nav';
    if (!input.replyTo) input.replyTo = input.fromAddress as string;
    if (!input.smtpPass || String(input.smtpPass).trim() === '') {
      const err = new Error('Missing required field: smtpPass');
      (err as any).name = 'ValidationError';
      throw err;
    }
    return this.repo.upsert(input as EmailSettingsUpsertInput);
  }
}

export default EmailSettingsService;
