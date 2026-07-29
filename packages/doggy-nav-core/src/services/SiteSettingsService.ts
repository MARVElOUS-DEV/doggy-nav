import type { HeroSlideSettings, SiteSettings } from '../types/types';
import type { CreatorProfileSettings } from '../types/types';
import type {
  SiteSettingsRepository,
  SiteSettingsUpsertInput,
} from '../repositories/SiteSettingsRepository';
import {
  DEFAULT_SUPPORT_PAYMENT_CURRENCY,
  isSupportPaymentCurrency,
  type SupportPaymentCurrency,
  type SupportPaymentSettings,
  type SupportPaymentTierDefinition,
} from '../types/supportPayments';

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

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(
      value.map((item) => normalizeText(item)).filter((item): item is string => Boolean(item))
    )
  );
}

function normalizeCreatorProfile(input: unknown): CreatorProfileSettings | null {
  if (!input || typeof input !== 'object') {
    return null;
  }

  const creatorProfile: CreatorProfileSettings = {
    name: normalizeText((input as any).name),
    title: normalizeText((input as any).title),
    headline: normalizeText((input as any).headline),
    bio: normalizeText((input as any).bio),
    mission: normalizeText((input as any).mission),
  };

  return Object.values(creatorProfile).some(Boolean) ? creatorProfile : null;
}

function validationError(message: string): never {
  const err = new Error(message);
  (err as any).name = 'ValidationError';
  throw err;
}

function normalizeHeroSlides(input: unknown): HeroSlideSettings[] {
  if (input === undefined || input === null) return [];
  if (!Array.isArray(input)) validationError('Invalid heroSlides');

  return input.map((slide, index) => {
    if (!slide || typeof slide !== 'object') {
      validationError(`Invalid hero slide at index ${index}`);
    }

    const mediaType = normalizeText((slide as any).mediaType);
    const mediaUrl = normalizeText((slide as any).mediaUrl);
    const ctaLabel = normalizeText((slide as any).ctaLabel);
    const ctaHref = normalizeText((slide as any).ctaHref);
    const order = Number((slide as any).order);

    if (mediaType && mediaType !== 'image' && mediaType !== 'video') {
      validationError(`Invalid hero slide mediaType at index ${index}`);
    }
    if (Boolean(mediaType) !== Boolean(mediaUrl)) {
      validationError(`Hero slide mediaType and mediaUrl must be paired at index ${index}`);
    }
    if (mediaUrl && !isValidUrlLike(mediaUrl)) {
      validationError(`Invalid hero slide mediaUrl at index ${index}`);
    }
    if (Boolean(ctaLabel) !== Boolean(ctaHref)) {
      validationError(`Hero slide CTA label and URL must be paired at index ${index}`);
    }
    if (ctaHref && !isValidUrlLike(ctaHref)) {
      validationError(`Invalid hero slide ctaHref at index ${index}`);
    }
    if (!Number.isInteger(order)) {
      validationError(`Invalid hero slide order at index ${index}`);
    }

    return {
      title: normalizeText((slide as any).title) || '',
      description: normalizeText((slide as any).description) || '',
      ...(mediaType && mediaUrl ? { mediaType: mediaType as 'image' | 'video', mediaUrl } : {}),
      ...(ctaLabel && ctaHref ? { ctaLabel, ctaHref } : {}),
      active: Boolean((slide as any).active),
      order,
    };
  });
}

function parseCurrency(value: unknown, field: string): SupportPaymentCurrency | null {
  const text = normalizeText(value);
  if (!text) return null;
  if (!isSupportPaymentCurrency(text)) {
    const err = new Error(`Invalid ${field}`);
    (err as any).name = 'ValidationError';
    throw err;
  }
  return text;
}

function parseAmount(value: unknown, field: string): number | null {
  if (value === undefined || value === null || value === '') return null;
  const amount = Number(value);
  if (!Number.isInteger(amount) || amount <= 0) {
    const err = new Error(`Invalid ${field}`);
    (err as any).name = 'ValidationError';
    throw err;
  }
  return amount;
}

function normalizeSupportTierDefinitions(
  tiers: unknown,
  enabledCurrencies: SupportPaymentCurrency[],
  supportEnabled: boolean
): SupportPaymentTierDefinition[] {
  if (!Array.isArray(tiers)) {
    return [];
  }

  const normalizedTiers = tiers.map((tier, index) => {
    const id = normalizeText((tier as any)?.id);
    const label = normalizeText((tier as any)?.label);
    const description = normalizeText((tier as any)?.description);
    const rawAmounts = (tier as any)?.amounts;

    if (!id || !label || !description || !rawAmounts || typeof rawAmounts !== 'object') {
      const err = new Error(`Invalid support tier at index ${index}`);
      (err as any).name = 'ValidationError';
      throw err;
    }

    const amounts = enabledCurrencies.reduce<Partial<Record<SupportPaymentCurrency, number>>>(
      (acc, currency) => {
        const amount = parseAmount(rawAmounts[currency], `support tier amount for ${currency}`);
        if (amount !== null) {
          acc[currency] = amount;
        }
        return acc;
      },
      {}
    );

    if (supportEnabled && enabledCurrencies.some((currency) => !amounts[currency])) {
      const err = new Error(`Missing support tier amount for enabled currencies in tier ${id}`);
      (err as any).name = 'ValidationError';
      throw err;
    }

    return {
      id,
      label,
      description,
      amounts,
    };
  });

  const ids = normalizedTiers.map((tier) => tier.id);
  if (new Set(ids).size !== ids.length) {
    const err = new Error('Support tier ids must be unique');
    (err as any).name = 'ValidationError';
    throw err;
  }

  return normalizedTiers;
}

function normalizeSupportSettings(input: unknown): SupportPaymentSettings | null {
  if (!input || typeof input !== 'object') {
    return null;
  }

  const supportEnabled = Boolean((input as any).enabled);
  const defaultCurrency =
    parseCurrency((input as any).defaultCurrency, 'support defaultCurrency') ??
    DEFAULT_SUPPORT_PAYMENT_CURRENCY;
  const requestedCurrencies = normalizeStringArray((input as any).currencies);
  const currencies = requestedCurrencies
    .map((currency) => parseCurrency(currency, 'support currency'))
    .filter((currency): currency is SupportPaymentCurrency => Boolean(currency));
  const enabledCurrencies = Array.from(
    new Set(
      (currencies.length > 0 ? currencies : [defaultCurrency]).filter((currency) =>
        isSupportPaymentCurrency(currency)
      )
    )
  );

  if (supportEnabled && enabledCurrencies.length === 0) {
    const err = new Error('At least one support currency must be enabled');
    (err as any).name = 'ValidationError';
    throw err;
  }

  if (!enabledCurrencies.includes(defaultCurrency)) {
    const err = new Error('Support defaultCurrency must be included in support currencies');
    (err as any).name = 'ValidationError';
    throw err;
  }

  const tiers = normalizeSupportTierDefinitions(
    (input as any).tiers,
    enabledCurrencies,
    supportEnabled
  );

  if (supportEnabled && tiers.length === 0) {
    const err = new Error('At least one support tier must be configured');
    (err as any).name = 'ValidationError';
    throw err;
  }

  const supportSettings: SupportPaymentSettings = {
    enabled: supportEnabled,
    creatorLabel: normalizeText((input as any).creatorLabel),
    defaultCurrency,
    currencies: enabledCurrencies,
    tiers,
  };

  return supportSettings;
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
    const creatorProfile = normalizeCreatorProfile(input.creatorProfile);
    const supportSettings = normalizeSupportSettings(input.supportSettings);
    const heroSlides = normalizeHeroSlides(input.heroSlides);

    const rawKeywords = input.seoKeywords as string[] | string | undefined;
    let seoKeywords: string[] = [];
    if (Array.isArray(rawKeywords)) {
      seoKeywords = normalizeStringArray(rawKeywords);
    } else if (typeof rawKeywords === 'string') {
      seoKeywords = normalizeStringArray(rawKeywords.split(','));
    }

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
      creatorProfile,
      supportSettings,
      heroSlides,
    });
  }
}

export default SiteSettingsService;
