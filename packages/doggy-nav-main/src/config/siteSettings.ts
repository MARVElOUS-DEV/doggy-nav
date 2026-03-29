import type { SiteSettings } from '@/types';

export interface ResolvedSiteSettings {
  siteTitle: string;
  seoTitle: string;
  seoDescription: string | null;
  seoKeywords: string[];
  copyrightText: string | null;
  feedbackUrl: string;
}

export const DEFAULT_SITE_SETTINGS: ResolvedSiteSettings = {
  siteTitle: 'Doggy Nav',
  seoTitle: 'Doggy Nav',
  seoDescription: null,
  seoKeywords: [],
  copyrightText: null,
  feedbackUrl: 'https://github.com/MARVElOUS-DEV/doggy-nav',
};

export function resolveSiteSettings(
  settings?: SiteSettings | null
): ResolvedSiteSettings {
  const siteTitle = settings?.siteTitle?.trim() || DEFAULT_SITE_SETTINGS.siteTitle;

  return {
    siteTitle,
    seoTitle: settings?.seoTitle?.trim() || siteTitle,
    seoDescription: settings?.seoDescription?.trim() || DEFAULT_SITE_SETTINGS.seoDescription,
    seoKeywords:
      Array.isArray(settings?.seoKeywords) && settings!.seoKeywords!.length > 0
        ? settings!.seoKeywords!.filter(Boolean)
        : DEFAULT_SITE_SETTINGS.seoKeywords,
    copyrightText:
      settings?.copyrightText?.trim() || DEFAULT_SITE_SETTINGS.copyrightText,
    feedbackUrl: settings?.feedbackUrl?.trim() || DEFAULT_SITE_SETTINGS.feedbackUrl,
  };
}
