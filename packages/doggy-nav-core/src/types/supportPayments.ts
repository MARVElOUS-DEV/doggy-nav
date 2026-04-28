export type SupportPaymentCurrency = 'usd' | 'hkd';

export interface SupportPaymentTierDefinition {
  id: string;
  label: string;
  description: string;
  amounts: Partial<Record<SupportPaymentCurrency, number>>;
}

export interface SupportPaymentTier {
  id: string;
  label: string;
  description: string;
  amount: number;
  currency: SupportPaymentCurrency;
}

export interface SupportPaymentSettings {
  enabled?: boolean | null;
  creatorLabel?: string | null;
  defaultCurrency?: SupportPaymentCurrency | null;
  currencies?: SupportPaymentCurrency[] | null;
  tiers?: SupportPaymentTierDefinition[] | null;
}

export interface ResolvedSupportPaymentSettings {
  enabled: boolean;
  creatorLabel: string;
  defaultCurrency: SupportPaymentCurrency;
  currencies: SupportPaymentCurrency[];
  tiers: SupportPaymentTierDefinition[];
}

export const SUPPORT_PAYMENT_KIND = 'coffee';
export const DEFAULT_SUPPORT_PAYMENT_CURRENCY: SupportPaymentCurrency = 'usd';
export const DEFAULT_SUPPORT_CREATOR_LABEL = 'Doggy Nav Creator';
export const SUPPORT_PAYMENT_CURRENCIES = ['usd', 'hkd'] as const;

const SUPPORT_PAYMENT_TIER_DEFINITIONS: SupportPaymentTierDefinition[] = [
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

export const DEFAULT_SUPPORT_PAYMENT_SETTINGS: ResolvedSupportPaymentSettings = {
  enabled: true,
  creatorLabel: DEFAULT_SUPPORT_CREATOR_LABEL,
  defaultCurrency: DEFAULT_SUPPORT_PAYMENT_CURRENCY,
  currencies: [...SUPPORT_PAYMENT_CURRENCIES],
  tiers: SUPPORT_PAYMENT_TIER_DEFINITIONS.map((tier) => ({
    id: tier.id,
    label: tier.label,
    description: tier.description,
    amounts: { ...tier.amounts },
  })),
};

export function isSupportPaymentCurrency(value: string): value is SupportPaymentCurrency {
  return (SUPPORT_PAYMENT_CURRENCIES as readonly string[]).includes(value);
}

export function resolveSupportPaymentCurrency(
  value?: string | null,
  fallbackCurrency: SupportPaymentCurrency = DEFAULT_SUPPORT_PAYMENT_CURRENCY
): SupportPaymentCurrency | null {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) {
    return fallbackCurrency;
  }

  return isSupportPaymentCurrency(normalized) ? normalized : null;
}

function isPositiveInteger(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) > 0;
}

function cloneTierDefinition(tier: SupportPaymentTierDefinition): SupportPaymentTierDefinition {
  return {
    id: tier.id,
    label: tier.label,
    description: tier.description,
    amounts: { ...tier.amounts },
  };
}

export function resolveSupportPaymentSettings(
  settings?: SupportPaymentSettings | null
): ResolvedSupportPaymentSettings {
  const requestedCurrencies = Array.isArray(settings?.currencies) ? settings?.currencies : [];
  const currencies = Array.from(
    new Set(
      requestedCurrencies.filter((currency): currency is SupportPaymentCurrency =>
        isSupportPaymentCurrency(currency)
      )
    )
  );

  const defaultCurrency = resolveSupportPaymentCurrency(
    settings?.defaultCurrency,
    DEFAULT_SUPPORT_PAYMENT_SETTINGS.defaultCurrency
  );
  const effectiveDefaultCurrency =
    defaultCurrency || DEFAULT_SUPPORT_PAYMENT_SETTINGS.defaultCurrency;
  const effectiveCurrencies =
    currencies.length > 0 ? currencies : [...DEFAULT_SUPPORT_PAYMENT_SETTINGS.currencies];

  if (!effectiveCurrencies.includes(effectiveDefaultCurrency)) {
    effectiveCurrencies.unshift(effectiveDefaultCurrency);
  }

  const requestedTiers = Array.isArray(settings?.tiers) ? settings?.tiers : [];
  const tiers = requestedTiers
    .map((tier) => {
      const id = String(tier?.id || '').trim();
      const label = String(tier?.label || '').trim();
      const description = String(tier?.description || '').trim();
      if (!id || !label || !description || !tier?.amounts || typeof tier.amounts !== 'object') {
        return null;
      }

      const amounts = effectiveCurrencies.reduce<Partial<Record<SupportPaymentCurrency, number>>>(
        (acc, currency) => {
          const amount = tier.amounts?.[currency];
          if (isPositiveInteger(amount)) {
            acc[currency] = amount;
          }
          return acc;
        },
        {}
      );

      if (effectiveCurrencies.some((currency) => !isPositiveInteger(amounts[currency]))) {
        return null;
      }

      return {
        id,
        label,
        description,
        amounts,
      } satisfies SupportPaymentTierDefinition;
    })
    .filter((tier): tier is SupportPaymentTierDefinition => Boolean(tier));

  return {
    enabled: settings?.enabled ?? DEFAULT_SUPPORT_PAYMENT_SETTINGS.enabled,
    creatorLabel:
      (typeof settings?.creatorLabel === 'string' && settings.creatorLabel.trim()) ||
      DEFAULT_SUPPORT_PAYMENT_SETTINGS.creatorLabel,
    defaultCurrency: effectiveDefaultCurrency,
    currencies: effectiveCurrencies,
    tiers:
      tiers.length > 0
        ? tiers
        : DEFAULT_SUPPORT_PAYMENT_SETTINGS.tiers.map((tier) => cloneTierDefinition(tier)),
  };
}

export function getSupportPaymentTiers(
  currency: SupportPaymentCurrency,
  settings?: SupportPaymentSettings | null
): SupportPaymentTier[] {
  return resolveSupportPaymentSettings(settings).tiers.map((tier) => ({
    id: tier.id,
    label: tier.label,
    description: tier.description,
    amount: tier.amounts[currency] as number,
    currency,
  }));
}

export function resolveSupportPaymentTier(
  amount: number,
  currency: SupportPaymentCurrency = DEFAULT_SUPPORT_PAYMENT_CURRENCY,
  settings?: SupportPaymentSettings | null
) {
  return getSupportPaymentTiers(currency, settings).find((tier) => tier.amount === amount) ?? null;
}
