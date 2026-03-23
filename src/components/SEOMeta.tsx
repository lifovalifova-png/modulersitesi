import { useEffect } from 'react';

const BASE_URL      = 'https://www.modulerpazar.com';
const DEFAULT_TITLE = "ModülerPazar — Türkiye'nin En Büyük Modüler Yapı Pazarı";
const DEFAULT_DESC  = 'Prefabrik ev, çelik yapı, konteyner ve tiny house ilanları. Türkiye genelinde 2500+ ilan, 850+ firma. Aynı anda 2 firmadan teklif alın.';
const DEFAULT_IMAGE = `${BASE_URL}/og-image.png`;

export interface SEOMetaProps {
  title:       string;
  description: string;
  image?:      string;
  url?:        string;
  type?:       string;
}

/** meta[attrKey="attrVal"] elementini bulur ya da oluşturur ve content'ini günceller. */
function setMeta(attrKey: string, attrVal: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[${attrKey}="${attrVal}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attrKey, attrVal);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

/**
 * Sayfa başlığını ve Open Graph / Twitter Card meta taglarını dinamik günceller.
 * Sayfa unmount olunca varsayılan değerlere geri döner.
 */
export default function SEOMeta({ title, description, image, url, type = 'website' }: SEOMetaProps) {
  const fullTitle = title.includes('ModülerPazar') ? title : `${title} | ModülerPazar`;
  const ogImage   = image || DEFAULT_IMAGE;
  const ogUrl     = url ? `${BASE_URL}${url}` : BASE_URL;

  useEffect(() => {
    const prevTitle = document.title;
    document.title = fullTitle;

    // Open Graph
    setMeta('property', 'og:title',       fullTitle);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:image',       ogImage);
    setMeta('property', 'og:url',         ogUrl);
    setMeta('property', 'og:type',        type);

    // Twitter Card
    setMeta('name', 'twitter:title',       fullTitle);
    setMeta('name', 'twitter:description', description);
    setMeta('name', 'twitter:image',       ogImage);

    return () => {
      document.title = prevTitle;
      setMeta('property', 'og:title',       DEFAULT_TITLE);
      setMeta('property', 'og:description', DEFAULT_DESC);
      setMeta('property', 'og:image',       DEFAULT_IMAGE);
      setMeta('property', 'og:url',         BASE_URL);
      setMeta('property', 'og:type',        'website');
      setMeta('name', 'twitter:title',       DEFAULT_TITLE);
      setMeta('name', 'twitter:description', DEFAULT_DESC);
      setMeta('name', 'twitter:image',       DEFAULT_IMAGE);
    };
  }, [fullTitle, description, ogImage, ogUrl, type]);

  return null;
}
