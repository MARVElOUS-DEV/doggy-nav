import React, { createContext, useContext } from 'react';
import type { SiteSettings } from '@/types';
import {
  DEFAULT_SITE_SETTINGS,
  resolveSiteSettings,
  type ResolvedSiteSettings,
} from '@/config/siteSettings';

interface SiteSettingsContextValue {
  siteSettings: SiteSettings | null;
  resolvedSiteSettings: ResolvedSiteSettings;
}

const SiteSettingsContext = createContext<SiteSettingsContextValue>({
  siteSettings: null,
  resolvedSiteSettings: DEFAULT_SITE_SETTINGS,
});

export function SiteSettingsProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value?: SiteSettings | null;
}) {
  return (
    <SiteSettingsContext.Provider
      value={{
        siteSettings: value ?? null,
        resolvedSiteSettings: resolveSiteSettings(value ?? null),
      }}
    >
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}
