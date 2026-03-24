import { Helmet } from 'react-helmet-async';

const BASE_URL      = 'https://www.modulerpazar.com';
const DEFAULT_TITLE = "ModülerPazar — Türkiye'nin En Büyük Modüler Yapı Pazarı";
const DEFAULT_IMAGE = `${BASE_URL}/og-image.png`;

export interface SEOMetaProps {
  title:       string;
  description: string;
  image?:      string;
  url?:        string;
  type?:       string;
}

/**
 * Sayfa başlığını, canonical link'i ve Open Graph / Twitter Card meta taglarını
 * react-helmet-async ile yönetir. Prerender sırasında HTML'e statik olarak yazılır.
 */
export default function SEOMeta({ title, description, image, url, type = 'website' }: SEOMetaProps) {
  const fullTitle = title.includes('ModülerPazar') ? title : `${title} | ModülerPazar`;
  const ogImage   = image || DEFAULT_IMAGE;
  const ogUrl     = url ? `${BASE_URL}${url}` : BASE_URL;
  const canonical = url ? `${BASE_URL}${url}` : BASE_URL;

  return (
    <Helmet defaultTitle={DEFAULT_TITLE} titleTemplate="%s">
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />

      {/* Open Graph */}
      <meta property="og:type"        content={type} />
      <meta property="og:title"       content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image"       content={ogImage} />
      <meta property="og:url"         content={ogUrl} />

      {/* Twitter Card */}
      <meta name="twitter:card"        content="summary_large_image" />
      <meta name="twitter:title"       content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image"       content={ogImage} />
    </Helmet>
  );
}
