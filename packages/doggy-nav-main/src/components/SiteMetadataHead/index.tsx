import Head from 'next/head';
import { useSiteSettings } from '@/context/SiteSettingsContext';

export default function SiteMetadataHead() {
  const { resolvedSiteSettings } = useSiteSettings();
  const { seoTitle, seoDescription, seoKeywords } = resolvedSiteSettings;

  return (
    <Head>
      <title>{seoTitle}</title>
      {seoDescription ? (
        <>
          <meta key="meta-description" name="description" content={seoDescription} />
          <meta key="og-description" property="og:description" content={seoDescription} />
        </>
      ) : null}
      <meta key="og-title" property="og:title" content={seoTitle} />
      {seoKeywords.length > 0 ? (
        <meta
          key="meta-keywords"
          name="keywords"
          content={seoKeywords.join(', ')}
        />
      ) : null}
    </Head>
  );
}
