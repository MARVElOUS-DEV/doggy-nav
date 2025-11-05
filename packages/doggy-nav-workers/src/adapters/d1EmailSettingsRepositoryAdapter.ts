import type {
  EmailSettingsRepository,
  EmailSettingsUpsertInput,
} from 'doggy-nav-core';
import type { EmailSettings } from 'doggy-nav-core';

export default class D1EmailSettingsRepositoryAdapter implements EmailSettingsRepository {
  constructor(private readonly db: D1Database) {}

  private rowToSettings(row: any): EmailSettings {
    return {
      smtpHost: row.smtp_host,
      smtpPort: Number(row.smtp_port),
      smtpSecure: !!row.smtp_secure,
      smtpUser: row.smtp_user,
      fromName: row.from_name,
      fromAddress: row.from_address,
      replyTo: row.reply_to,
      enableNotifications: !!row.enable_notifications,
      adminEmails: (() => {
        try {
          return JSON.parse(row.admin_emails || '[]');
        } catch {
          return [] as string[];
        }
      })(),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async get(): Promise<EmailSettings | null> {
    const row = await this.db
      .prepare(`SELECT * FROM email_settings WHERE id = 'default'`)
      .first<any>();
    return row ? this.rowToSettings(row) : null;
  }

  async upsert(input: EmailSettingsUpsertInput): Promise<EmailSettings> {
    const adminEmails = JSON.stringify(input.adminEmails || []);
    const exists = await this.db
      .prepare(`SELECT id FROM email_settings WHERE id = 'default'`)
      .first<any>();
    if (exists) {
      await this.db
        .prepare(
          `UPDATE email_settings
           SET smtp_host=?, smtp_port=?, smtp_secure=?, smtp_user=?, smtp_pass=?,
               from_name=?, from_address=?, reply_to=?, enable_notifications=?, admin_emails=?,
               updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
           WHERE id='default'`
        )
        .bind(
          input.smtpHost,
          Number(input.smtpPort || 587),
          input.smtpSecure ? 1 : 0,
          input.smtpUser,
          input.smtpPass,
          input.fromName || 'Doggy Nav',
          input.fromAddress,
          input.replyTo || input.fromAddress,
          input.enableNotifications ? 1 : 0,
          adminEmails
        )
        .run();
    } else {
      await this.db
        .prepare(
          `INSERT INTO email_settings (
              id, smtp_host, smtp_port, smtp_secure, smtp_user, smtp_pass,
              from_name, from_address, reply_to, enable_notifications, admin_emails
           ) VALUES ('default',?,?,?,?,?,?,?,?,?,?)`
        )
        .bind(
          input.smtpHost,
          Number(input.smtpPort || 587),
          input.smtpSecure ? 1 : 0,
          input.smtpUser,
          input.smtpPass,
          input.fromName || 'Doggy Nav',
          input.fromAddress,
          input.replyTo || input.fromAddress,
          input.enableNotifications ? 1 : 0,
          adminEmails
        )
        .run();
    }
    const row = await this.db
      .prepare(`SELECT * FROM email_settings WHERE id = 'default'`)
      .first<any>();
    return this.rowToSettings(row);
  }
}
