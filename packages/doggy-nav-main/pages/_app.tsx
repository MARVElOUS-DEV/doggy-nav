import { useEffect } from 'react';
import type { ReactElement, ReactNode } from 'react';
import type { NextPage } from 'next';
import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import RootLayout from '@/components/Layout';
import { debugHydration } from '@/utils/hydrationDebug';
import i18n from '@/i18n';
import './global.css';

export type NextPageWithLayout<P = Record<string, any>, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement) => ReactNode
}

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout
}
debugHydration();
export default function MyApp({ Component, pageProps }: AppPropsWithLayout) {
  const router = useRouter();

  useEffect(() => {
    // Sync i18next language with Next.js locale
    if (router.locale && i18n.language !== router.locale) {
      i18n.changeLanguage(router.locale);
    }
  }, [router.locale]);

  // Use the layout defined at the page level, if available
  const getLayout = Component.getLayout ?? ((page) => (
    <RootLayout>
      {page}
    </RootLayout>
  ))

  return getLayout(<Component {...pageProps} />)
}