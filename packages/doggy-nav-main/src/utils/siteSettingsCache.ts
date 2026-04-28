import type { SiteSettings } from '@/types';

const STORAGE_KEY = 'doggy-nav:public-site-settings:v2';

let siteSettingsCache: SiteSettings | null | undefined;

export function readCachedSiteSettings(): SiteSettings | null | undefined {
  if (siteSettingsCache !== undefined) {
    return siteSettingsCache;
  }

  if (typeof window === 'undefined') {
    return siteSettingsCache;
  }

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return undefined;
    }
    siteSettingsCache = JSON.parse(raw) as SiteSettings | null;
    return siteSettingsCache;
  } catch {
    return undefined;
  }
}

export function writeCachedSiteSettings(settings: SiteSettings | null) {
  siteSettingsCache = settings;

  if (typeof window === 'undefined') {
    return;
  }

  try {
    if (settings) {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } else {
      window.sessionStorage.setItem(STORAGE_KEY, 'null');
    }
  } catch {}
}
