import type {
  CreatorProfileSettings,
  SiteSettings,
  SupportCurrency,
  SupportSettings,
  SupportTierDefinition,
} from '@/types';

export interface SupportTier {
  id: string;
  label: string;
  description: string;
  amount: number;
  currency: SupportCurrency;
}

export interface ResolvedSupportSettings {
  enabled: boolean;
  creatorLabel: string;
  defaultCurrency: SupportCurrency;
  currencies: SupportCurrency[];
  tiers: Record<SupportCurrency, SupportTier[]>;
}

export const ABOUT_ME_PROFILE_DEFAULTS: Required<CreatorProfileSettings> = {
  name: 'Doggy Nav Creator',
  title: 'Independent builder and curator of useful web tools',
  headline:
    'I built this desktop space to make browsing, collecting, and returning to good tools feel calm and personal.',
  bio: 'I created Doggy Nav as a calm, playful place to discover useful websites, organize favorites, and return to them with less friction.',
  mission:
    'Small support goes straight into hosting, experiments, and new tools for this little corner of the web.',
};

export const SUPPORT_CURRENCY_OPTIONS: Array<{
  id: SupportCurrency;
  label: string;
  locale: string;
}> = [
  { id: 'usd', label: 'USD', locale: 'en-US' },
  { id: 'hkd', label: 'HKD', locale: 'en-HK' },
];

const DEFAULT_SUPPORT_TIER_DEFINITIONS: SupportTierDefinition[] = [
  {
    id: 'espresso',
    label: 'Espresso',
    description: 'A small thank-you for the idea and the craft.',
    amounts: {
      usd: 300,
      hkd: 2500,
    },
  },
  {
    id: 'latte',
    label: 'Latte',
    description: 'A steady boost for more late-night polishing.',
    amounts: {
      usd: 700,
      hkd: 5500,
    },
  },
  {
    id: 'beans',
    label: 'Coffee Beans',
    description: 'A bigger nudge for the next batch of features.',
    amounts: {
      usd: 1500,
      hkd: 12000,
    },
  },
];

const DEFAULT_SUPPORT_SETTINGS: ResolvedSupportSettings = {
  enabled: true,
  creatorLabel: 'Doggy Nav Creator',
  defaultCurrency: 'hkd',
  currencies: SUPPORT_CURRENCY_OPTIONS.map((option) => option.id),
  tiers: {
    usd: DEFAULT_SUPPORT_TIER_DEFINITIONS.map((tier) => ({
      id: tier.id,
      label: tier.label,
      description: tier.description,
      amount: tier.amounts?.usd ?? 0,
      currency: 'usd',
    })),
    hkd: DEFAULT_SUPPORT_TIER_DEFINITIONS.map((tier) => ({
      id: tier.id,
      label: tier.label,
      description: tier.description,
      amount: tier.amounts?.hkd ?? 0,
      currency: 'hkd',
    })),
  },
};

function isSupportCurrency(value: unknown): value is SupportCurrency {
  return SUPPORT_CURRENCY_OPTIONS.some((option) => option.id === value);
}

export function resolveAboutMeProfile(
  settings?: SiteSettings | null
): Required<CreatorProfileSettings> {
  return {
    name: settings?.creatorProfile?.name?.trim() || ABOUT_ME_PROFILE_DEFAULTS.name,
    title: settings?.creatorProfile?.title?.trim() || ABOUT_ME_PROFILE_DEFAULTS.title,
    headline: settings?.creatorProfile?.headline?.trim() || ABOUT_ME_PROFILE_DEFAULTS.headline,
    bio: settings?.creatorProfile?.bio?.trim() || ABOUT_ME_PROFILE_DEFAULTS.bio,
    mission: settings?.creatorProfile?.mission?.trim() || ABOUT_ME_PROFILE_DEFAULTS.mission,
  };
}

function resolveTierDefinitions(
  supportSettings?: SupportSettings | null,
  currencies: SupportCurrency[]
): SupportTierDefinition[] {
  if (!Array.isArray(supportSettings?.tiers) || supportSettings.tiers.length === 0) {
    return DEFAULT_SUPPORT_TIER_DEFINITIONS;
  }

  const tiers = supportSettings.tiers
    .map((tier) => {
      const id = tier.id?.trim();
      const label = tier.label?.trim();
      const description = tier.description?.trim();
      if (!id || !label || !description || !tier.amounts) {
        return null;
      }

      const amounts = currencies.reduce<Partial<Record<SupportCurrency, number>>>(
        (acc, currency) => {
          const amount = tier.amounts?.[currency];
          if (Number.isInteger(amount) && Number(amount) > 0) {
            acc[currency] = Number(amount);
          }
          return acc;
        },
        {}
      );

      if (currencies.some((currency) => !amounts[currency])) {
        return null;
      }

      return {
        id,
        label,
        description,
        amounts,
      } satisfies SupportTierDefinition;
    })
    .filter((tier): tier is SupportTierDefinition => Boolean(tier));

  return tiers.length > 0 ? tiers : DEFAULT_SUPPORT_TIER_DEFINITIONS;
}

export function resolveSupportSettings(settings?: SiteSettings | null): ResolvedSupportSettings {
  const rawSupportSettings = settings?.supportSettings;
  const currencies = Array.from(
    new Set(
      (Array.isArray(rawSupportSettings?.currencies)
        ? rawSupportSettings.currencies
        : DEFAULT_SUPPORT_SETTINGS.currencies
      ).filter((currency): currency is SupportCurrency => isSupportCurrency(currency))
    )
  );
  const effectiveCurrencies =
    currencies.length > 0 ? currencies : [...DEFAULT_SUPPORT_SETTINGS.currencies];
  const defaultCurrency = isSupportCurrency(rawSupportSettings?.defaultCurrency)
    ? rawSupportSettings.defaultCurrency
    : DEFAULT_SUPPORT_SETTINGS.defaultCurrency;
  const effectiveDefaultCurrency = effectiveCurrencies.includes(defaultCurrency)
    ? defaultCurrency
    : effectiveCurrencies[0];
  const tierDefinitions = resolveTierDefinitions(rawSupportSettings, effectiveCurrencies);

  const tiers = SUPPORT_CURRENCY_OPTIONS.reduce<Record<SupportCurrency, SupportTier[]>>(
    (acc, option) => {
      const currency = option.id;
      acc[currency] = tierDefinitions
        .filter(
          (tier) =>
            Number.isInteger(tier.amounts?.[currency]) && Number(tier.amounts?.[currency]) > 0
        )
        .map((tier) => ({
          id: tier.id,
          label: tier.label,
          description: tier.description,
          amount: Number(tier.amounts?.[currency]),
          currency,
        }));
      return acc;
    },
    { usd: [], hkd: [] }
  );

  return {
    enabled: rawSupportSettings?.enabled ?? DEFAULT_SUPPORT_SETTINGS.enabled,
    creatorLabel: rawSupportSettings?.creatorLabel?.trim() || DEFAULT_SUPPORT_SETTINGS.creatorLabel,
    defaultCurrency: effectiveDefaultCurrency,
    currencies: effectiveCurrencies,
    tiers,
  };
}

export function formatSupportAmount(amount: number, currency: SupportCurrency) {
  const locale =
    SUPPORT_CURRENCY_OPTIONS.find((option) => option.id === currency)?.locale || 'en-US';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency.toUpperCase(),
    maximumFractionDigits: 2,
  }).format(amount / 100);
}
