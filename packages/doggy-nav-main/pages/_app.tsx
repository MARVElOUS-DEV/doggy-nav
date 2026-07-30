import App, { type AppContext } from 'next/app';
import { Provider as JotaiProvider } from 'jotai';
import { useEffect, useState, type ReactElement, type ReactNode } from 'react';
import type { NextPage } from 'next';
import type { AppProps } from 'next/app';
import RootLayout from '@/components/Layout';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { debugHydration } from '@/utils/hydrationDebug';
import i18n from '@/i18n';
import ReactIf from '@/components/ReactIf';
import { useRouter } from 'next/router';
import { startProactiveAuthRefresh } from '@/utils/session';
import { GlobalAppWindowProvider } from '@/store/GlobalAppWindowStore';
import { WindowZProvider } from '@/store/WindowZStore';
import { SiteSettingsProvider } from '@/context/SiteSettingsContext';
import ThemeProvider from '@/theme/ThemeProvider';
import PageLoading from '@/components/PageLoading';
import type { SiteSettings } from '@/types';
import { readCachedSiteSettings, writeCachedSiteSettings } from '@/utils/siteSettingsCache';

import './global.css';

export type NextPageWithLayout<P = Record<string, any>, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement) => ReactNode;
};

debugHydration();

export default function MyApp({
  Component,
  pageProps,
}: {
  Component: NextPageWithLayout;
  pageProps: AppProps['pageProps'] & {
    initialSiteSettings?: SiteSettings | null;
  };
}) {
  const router = useRouter();
  const [routeLoading, setRouteLoading] = useState(false);

  useEffect(() => {
    const start = (url: string) =>
      setRouteLoading(new URL(url, location.href).pathname !== location.pathname);
    const stop = () => setRouteLoading(false);

    router.events.on('routeChangeStart', start);
    router.events.on('routeChangeComplete', stop);
    router.events.on('routeChangeError', stop);

    return () => {
      router.events.off('routeChangeStart', start);
      router.events.off('routeChangeComplete', stop);
      router.events.off('routeChangeError', stop);
    };
  }, [router.events]);

  useEffect(() => {
    if (router.isReady && router.locale && i18n.language !== router.locale) {
      i18n.changeLanguage(router.locale);
    }
  }, [router.locale, router.isReady]);

  useEffect(() => {
    startProactiveAuthRefresh();
  }, []);

  useEffect(() => {
    if (pageProps.initialSiteSettings !== undefined) {
      writeCachedSiteSettings(pageProps.initialSiteSettings ?? null);
    }
  }, [pageProps.initialSiteSettings]);

  // Use the layout defined at the page level, if available
  const getLayout =
    Component.getLayout ?? ((page: ReactElement) => <RootLayout>{page}</RootLayout>);
  return (
    <>
      <ReactIf condition={process.env.NEXT_PUBLIC_ENABLE_VERCEL_STATISTIC === 'true'}>
        <SpeedInsights />
      </ReactIf>
      <JotaiProvider>
        <ThemeProvider>
          {routeLoading ? <PageLoading /> : null}
          <SiteSettingsProvider value={pageProps.initialSiteSettings}>
            <WindowZProvider>
              <GlobalAppWindowProvider>
                {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
                {/* @ts-ignore */}
                {getLayout(<Component {...pageProps} />)}
              </GlobalAppWindowProvider>
            </WindowZProvider>
          </SiteSettingsProvider>
        </ThemeProvider>
      </JotaiProvider>
    </>
  );
}

MyApp.getInitialProps = async (appContext: AppContext) => {
  const appProps = await App.getInitialProps(appContext);
  const headers: Record<string, string> = {
    'X-App-Source': 'main',
  };

  if (process.env.DOGGY_SERVER_CLIENT_SECRET) {
    headers['x-client-secret'] = process.env.DOGGY_SERVER_CLIENT_SECRET;
  }

  const endpoint =
    typeof window === 'undefined'
      ? `${process.env.DOGGY_SERVER || 'http://localhost:3002'}/api/site-settings/public`
      : '/api/site-settings/public';

  let initialSiteSettings: SiteSettings | null = null;

  if (typeof window !== 'undefined') {
    const cached = readCachedSiteSettings();
    if (cached !== undefined) {
      return {
        ...appProps,
        pageProps: {
          ...appProps.pageProps,
          initialSiteSettings: cached,
        },
      };
    }
  }

  try {
    const response = await fetch(endpoint, {
      headers,
    });
    if (response.ok) {
      const payload = await response.json();
      initialSiteSettings = payload?.code === 1 ? (payload.data ?? null) : null;
      if (typeof window !== 'undefined') {
        writeCachedSiteSettings(initialSiteSettings);
      }
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Failed to prefetch site settings', error);
    }
  }

  return {
    ...appProps,
    pageProps: {
      ...appProps.pageProps,
      initialSiteSettings,
    },
  };
};
