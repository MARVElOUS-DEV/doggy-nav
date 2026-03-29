import type { SiteSettings } from '../types/types';

export interface SiteSettingsUpsertInput extends SiteSettings {
  seoKeywords: string[];
}

export interface SiteSettingsRepository {
  get(): Promise<SiteSettings | null>;
  upsert(input: SiteSettingsUpsertInput): Promise<SiteSettings>;
}
