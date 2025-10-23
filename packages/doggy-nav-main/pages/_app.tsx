import { Provider as JotaiProvider } from 'jotai';
import { useEffect, type ReactElement, type ReactNode } from 'react';
import type { NextPage } from 'next';
import type { AppProps } from 'next/app';
import RootLayout from '@/components/Layout';
import { debugHydration } from '@/utils/hydrationDebug';
import i18n from '@/i18n';
import { useRouter } from 'next/router';
import './global.css';
import { startProactiveAuthRefresh } from '@/utils/session';

export type NextPageWithLayout<P = Record<string, any>, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement) => ReactNode;
};

debugHydration();

export default function MyApp({
  Component,
  pageProps,
}: {
  Component: NextPageWithLayout;
  pageProps: AppProps;
}) {
  const router = useRouter();

  useEffect(() => {
    if (router.isReady && router.locale && i18n.language !== router.locale) {
      i18n.changeLanguage(router.locale);
    }
  }, [router.locale, router.isReady]);

  useEffect(() => {
    startProactiveAuthRefresh();
  }, []);

  // Use the layout defined at the page level, if available
  const getLayout =
    Component.getLayout ?? ((page: ReactElement) => <RootLayout>{page}</RootLayout>);
  return (
    <JotaiProvider>
      {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
      {/* @ts-ignore */}
      {getLayout(<Component {...pageProps} />)}
    </JotaiProvider>
  );
}
