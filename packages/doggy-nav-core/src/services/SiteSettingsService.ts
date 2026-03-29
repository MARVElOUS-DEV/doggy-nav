import type { SiteSettings } from '../types/types';
import type {
  SiteSettingsRepository,
  SiteSettingsUpsertInput,
} from '../repositories/SiteSettingsRepository';

function normalizeText(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  return text ? text : null;
}

function isValidUrlLike(value: string): boolean {
  if (value.startsWith('/')) return true;

  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export class SiteSettingsService {
  constructor(private readonly repo: SiteSettingsRepository) {}

  async get(): Promise<SiteSettings | null> {
    return this.repo.get();
  }

  async update(input: Partial<SiteSettingsUpsertInput>): Promise<SiteSettings> {
    const siteTitle = normalizeText(input.siteTitle);
    const logoUrl = normalizeText(input.logoUrl);
    const seoTitle = normalizeText(input.seoTitle);
    const seoDescription = normalizeText(input.seoDescription);
    const copyrightText = normalizeText(input.copyrightText);
    const feedbackUrl = normalizeText(input.feedbackUrl);

    const rawKeywords = input.seoKeywords as string[] | string | undefined;
    let seoKeywords: string[] = [];
    if (Array.isArray(rawKeywords)) {
      seoKeywords = rawKeywords
        .map((item) => normalizeText(item))
        .filter((item): item is string => Boolean(item));
    } else if (typeof rawKeywords === 'string') {
      seoKeywords = rawKeywords
        .split(',')
        .map((item) => normalizeText(item))
        .filter((item): item is string => Boolean(item));
    }
    seoKeywords = Array.from(new Set(seoKeywords));

    for (const [field, value] of [
      ['logoUrl', logoUrl],
      ['feedbackUrl', feedbackUrl],
    ] as const) {
      if (value && !isValidUrlLike(value)) {
        const err = new Error(`Invalid ${field}`);
        (err as any).name = 'ValidationError';
        throw err;
      }
    }

    return this.repo.upsert({
      siteTitle,
      logoUrl,
      seoTitle,
      seoDescription,
      seoKeywords,
      copyrightText,
      feedbackUrl,
    });
  }
}

export default SiteSettingsService;
