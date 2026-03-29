import type { SiteSettingsRepository, SiteSettingsUpsertInput } from 'doggy-nav-core';
import type { SiteSettings } from 'doggy-nav-core';

function toISO(d: any): string | undefined {
  if (!d) return undefined;
  try {
    return new Date(d).toISOString();
  } catch {
    return undefined;
  }
}

function mapDoc(doc: any): SiteSettings {
  return {
    siteTitle: doc.siteTitle ?? null,
    logoUrl: doc.logoUrl ?? null,
    seoTitle: doc.seoTitle ?? null,
    seoDescription: doc.seoDescription ?? null,
    seoKeywords: Array.isArray(doc.seoKeywords) ? doc.seoKeywords : [],
    copyrightText: doc.copyrightText ?? null,
    feedbackUrl: doc.feedbackUrl ?? null,
    createdAt: toISO(doc.createdAt),
    updatedAt: toISO(doc.updatedAt),
  };
}

export class MongooseSiteSettingsRepository implements SiteSettingsRepository {
  constructor(private readonly ctx: any) {}

  private get model() {
    return this.ctx.model.SiteSettings;
  }

  async get(): Promise<SiteSettings | null> {
    const doc = await this.model.findOne({ singletonKey: 'default' }).lean();
    return doc ? mapDoc(doc) : null;
  }

  async upsert(input: SiteSettingsUpsertInput): Promise<SiteSettings> {
    let doc = await this.model.findOne({ singletonKey: 'default' });
    const payload = {
      singletonKey: 'default',
      siteTitle: input.siteTitle ?? null,
      logoUrl: input.logoUrl ?? null,
      seoTitle: input.seoTitle ?? null,
      seoDescription: input.seoDescription ?? null,
      seoKeywords: Array.isArray(input.seoKeywords) ? input.seoKeywords : [],
      copyrightText: input.copyrightText ?? null,
      feedbackUrl: input.feedbackUrl ?? null,
    };

    if (!doc) {
      doc = new this.model(payload);
    } else {
      Object.assign(doc, payload);
    }

    await doc.save();
    return mapDoc(doc);
  }
}

export default MongooseSiteSettingsRepository;
