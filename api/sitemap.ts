import type { VercelRequest, VercelResponse } from '@vercel/node';

const BASE = 'https://www.modulerpazar.com';
const TODAY = new Date().toISOString().slice(0, 10);

/* ── Firestore REST API ile koleksiyon oku ──────────────── */
const PROJECT = 'modulerpazar';

async function fetchCollection(col: string, fields: string[]) {
  const mask = fields.map((f) => `mask.fieldPaths=${f}`).join('&');
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/${col}?pageSize=500&${mask}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const json = await res.json();
    return (json.documents ?? []) as Array<{
      name: string;
      fields: Record<string, { stringValue?: string; mapValue?: unknown }>;
    }>;
  } catch {
    return [];
  }
}

function docId(doc: { name: string }) {
  return doc.name.split('/').pop()!;
}

function field(doc: { fields: Record<string, { stringValue?: string }> }, key: string) {
  return doc.fields?.[key]?.stringValue ?? '';
}

/* ── Statik rotalar ─────────────────────────────────────── */
const CATEGORIES = [
  'prefabrik', 'celik-yapilar', 'yasam-konteynerleri',
  'tiny-house', 'ahsap-yapilar', 'ikinci-el', 'ozel-projeler',
];

const STATIC_PAGES = [
  { loc: '/',                   changefreq: 'daily',   priority: '1.0' },
  { loc: '/blog',               changefreq: 'weekly',  priority: '0.8' },
  { loc: '/firmalar',           changefreq: 'daily',   priority: '0.8' },
  { loc: '/talep-olustur',      changefreq: 'monthly', priority: '0.7' },
  { loc: '/sss',                changefreq: 'monthly', priority: '0.7' },
  { loc: '/nasil-kullanilir',   changefreq: 'monthly', priority: '0.7' },
  { loc: '/haberler',           changefreq: 'daily',   priority: '0.8' },
  { loc: '/hakkimizda',         changefreq: 'monthly', priority: '0.6' },
  { loc: '/fiyat-hesapla',      changefreq: 'monthly', priority: '0.7' },
  { loc: '/satici-formu',       changefreq: 'monthly', priority: '0.6' },
  { loc: '/kvkk',               changefreq: 'yearly',  priority: '0.3' },
  { loc: '/gizlilik',           changefreq: 'yearly',  priority: '0.3' },
  { loc: '/kullanim-kosullari', changefreq: 'yearly',  priority: '0.3' },
];

/* ── Statik blog yazıları (fallback) ────────────────────── */
const BLOG_SLUGS = [
  'prefabrik-ev-nedir-2025-fiyatlari',
  'celik-yapi-mi-prefabrik-mi-karsilastirma',
  'turkiyede-tiny-house-yasami',
  'konteyner-ev-nasil-yapilir',
  'sehre-gore-yapi-tipi-iklim-rehberi',
  'moduler-yapilarda-dask-ve-sigorta',
  'prefabrik-ev-izinleri-ruhsat-surecleri',
  'ahsap-celik-yapi-karsilastirmasi',
  'moduler-yapi-sektorunde-surdurulebilirlik',
  'prefabrik-evlerde-enerji-verimliligi',
  'moduler-yapilarda-deprem-guvenligi',
  'modulerpazar-nasil-kullanilir-rehber',
];

function urlEntry(loc: string, changefreq: string, priority: string, lastmod = TODAY) {
  return `  <url>
    <loc>${BASE}${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const urls: string[] = [];

  // Statik sayfalar
  for (const p of STATIC_PAGES) {
    urls.push(urlEntry(p.loc, p.changefreq, p.priority));
  }

  // Kategori sayfaları
  for (const slug of CATEGORIES) {
    urls.push(urlEntry(`/kategori/${slug}`, 'daily', '0.9'));
  }

  // Blog yazıları — statik listeden
  for (const slug of BLOG_SLUGS) {
    urls.push(urlEntry(`/blog/${slug}`, 'monthly', '0.7'));
  }

  // Firestore'dan onaylı firmalar
  const firms = await fetchCollection('firms', ['status', 'name']);
  for (const doc of firms) {
    if (field(doc, 'status') === 'approved') {
      urls.push(urlEntry(`/firma/${docId(doc)}`, 'weekly', '0.6'));
    }
  }

  // Firestore'dan aktif ilanlar
  const ilanlar = await fetchCollection('ilanlar', ['status', 'aktif']);
  for (const doc of ilanlar) {
    if (field(doc, 'status') === 'aktif') {
      urls.push(urlEntry(`/ilan/${docId(doc)}`, 'weekly', '0.5'));
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

  res.setHeader('Content-Type', 'application/xml');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=600');
  res.status(200).send(xml);
}
