import type { EmailSettings } from '../domain/types';

export interface EmailSettingsUpsertInput extends EmailSettings {
  smtpPass: string;
}

export interface EmailSettingsRepository {
  get(): Promise<EmailSettings | null>;
  upsert(input: EmailSettingsUpsertInput): Promise<EmailSettings>;
}
