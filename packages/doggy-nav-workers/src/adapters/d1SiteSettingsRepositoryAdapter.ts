import type { SiteSettingsRepository, SiteSettingsUpsertInput } from 'doggy-nav-core';
import type { SiteSettings } from 'doggy-nav-core';

export default class D1SiteSettingsRepositoryAdapter implements SiteSettingsRepository {
  constructor(private readonly db: D1Database) {}

  private rowToSettings(row: any): SiteSettings {
    return {
      siteTitle: row.site_title ?? null,
      logoUrl: row.logo_url ?? null,
      seoTitle: row.seo_title ?? null,
      seoDescription: row.seo_description ?? null,
      seoKeywords: (() => {
        try {
          return JSON.parse(row.seo_keywords || '[]');
        } catch {
          return [] as string[];
        }
      })(),
      copyrightText: row.copyright_text ?? null,
      feedbackUrl: row.feedback_url ?? null,
      creatorProfile: (() => {
        try {
          const value = JSON.parse(row.creator_profile || 'null');
          return value && typeof value === 'object' ? value : null;
        } catch {
          return null;
        }
      })(),
      supportSettings: (() => {
        try {
          const value = JSON.parse(row.support_settings || 'null');
          return value && typeof value === 'object' ? value : null;
        } catch {
          return null;
        }
      })(),
      heroSlides: (() => {
        try {
          const value = JSON.parse(row.hero_slides || '[]');
          return Array.isArray(value) ? value : [];
        } catch {
          return [];
        }
      })(),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async get(): Promise<SiteSettings | null> {
    const row = await this.db
      .prepare(`SELECT * FROM site_settings WHERE id = 'default'`)
      .first<any>();
    return row ? this.rowToSettings(row) : null;
  }

  async upsert(input: SiteSettingsUpsertInput): Promise<SiteSettings> {
    const seoKeywords = JSON.stringify(input.seoKeywords || []);
    const creatorProfile = JSON.stringify(input.creatorProfile || null);
    const supportSettings = JSON.stringify(input.supportSettings || null);
    const heroSlides = JSON.stringify(input.heroSlides || []);
    const exists = await this.db
      .prepare(`SELECT id FROM site_settings WHERE id = 'default'`)
      .first<any>();

    if (exists) {
      await this.db
        .prepare(
          `UPDATE site_settings
           SET site_title = ?, logo_url = ?, seo_title = ?, seo_description = ?,
               seo_keywords = ?, copyright_text = ?, feedback_url = ?,
               creator_profile = ?, support_settings = ?, hero_slides = ?,
               updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
           WHERE id = 'default'`
        )
        .bind(
          input.siteTitle ?? null,
          input.logoUrl ?? null,
          input.seoTitle ?? null,
          input.seoDescription ?? null,
          seoKeywords,
          input.copyrightText ?? null,
          input.feedbackUrl ?? null,
          creatorProfile,
          supportSettings,
          heroSlides
        )
        .run();
    } else {
      await this.db
        .prepare(
          `INSERT INTO site_settings (
             id, site_title, logo_url, seo_title, seo_description,
             seo_keywords, copyright_text, feedback_url, creator_profile, support_settings, hero_slides
           ) VALUES ('default',?,?,?,?,?,?,?,?,?,?)`
        )
        .bind(
          input.siteTitle ?? null,
          input.logoUrl ?? null,
          input.seoTitle ?? null,
          input.seoDescription ?? null,
          seoKeywords,
          input.copyrightText ?? null,
          input.feedbackUrl ?? null,
          creatorProfile,
          supportSettings,
          heroSlides
        )
        .run();
    }

    const row = await this.db
      .prepare(`SELECT * FROM site_settings WHERE id = 'default'`)
      .first<any>();
    return this.rowToSettings(row);
  }
}
