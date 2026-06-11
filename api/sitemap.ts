import type { VercelRequest, VercelResponse } from '@vercel/node';

const BASE = 'https://www.modulerpazar.com';
const TODAY = new Date().toISOString().slice(0, 10);

const PROJECT = 'modulerpazar';
const RQ_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents:runQuery`;

interface FsDoc {
  name: string;
  fields: Record<string, { stringValue?: string; booleanValue?: boolean }>;
}

async function runQuery(
  col: string,
  filters: { field: string; op: string; value: { stringValue?: string; booleanValue?: boolean } }[],
  selectFields: string[],
): Promise<FsDoc[]> {
  const where = filters.length === 1
    ? {
        fieldFilter: {
          field: { fieldPath: filters[0].field },
          op: filters[0].op,
          value: filters[0].value,
        },
      }
    : {
        compositeFilter: {
          op: 'AND',
          filters: filters.map((f) => ({
            fieldFilter: {
              field: { fieldPath: f.field },
              op: f.op,
              value: f.value,
            },
          })),
        },
      };

  const body = {
    structuredQuery: {
      from: [{ collectionId: col }],
      where,
      select: { fields: selectFields.map((f) => ({ fieldPath: f })) },
      limit: 500,
    },
  };

  try {
    const res = await fetch(RQ_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) return [];
    const rows = (await res.json()) as Array<{ document?: FsDoc }>;
    return rows.filter((r) => r.document).map((r) => r.document!);
  } catch {
    return [];
  }
}

function docId(doc: FsDoc) {
  return doc.name.split('/').pop()!;
}

function strField(doc: FsDoc, key: string) {
  return doc.fields?.[key]?.stringValue ?? '';
}

/* ── Programmatic SEO: şehir × kategori ────────────────── */
const SEO_CITY_SLUGS  = ['istanbul', 'ankara', 'izmir', 'sakarya', 'antalya'];
const SEO_CAT_SLUGS   = ['prefabrik-ev', 'konteyner-ev', 'tiny-house'];

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
  { loc: '/haberler',           changefreq: 'monthly', priority: '0.3' },
  { loc: '/etkinlikler',        changefreq: 'weekly',  priority: '0.8' },
  { loc: '/hakkimizda',         changefreq: 'monthly', priority: '0.6' },
  { loc: '/fiyat-hesapla',      changefreq: 'monthly', priority: '0.7' },
  { loc: '/satici-formu',       changefreq: 'monthly', priority: '0.6' },
  { loc: '/kvkk',               changefreq: 'yearly',  priority: '0.3' },
  { loc: '/gizlilik',           changefreq: 'yearly',  priority: '0.3' },
  { loc: '/kullanim-kosullari', changefreq: 'yearly',  priority: '0.3' },
];

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
  try {
    const urls: string[] = [];

    for (const p of STATIC_PAGES) {
      urls.push(urlEntry(p.loc, p.changefreq, p.priority));
    }

    for (const slug of CATEGORIES) {
      urls.push(urlEntry(`/kategori/${slug}`, 'daily', '0.9'));
    }

    for (const slug of BLOG_SLUGS) {
      urls.push(urlEntry(`/blog/${slug}`, 'monthly', '0.7'));
    }

    for (const cat of SEO_CAT_SLUGS) {
      for (const city of SEO_CITY_SLUGS) {
        urls.push(urlEntry(`/${cat}/${city}`, 'weekly', '0.8'));
      }
    }

    const [firms, etkinlikler, ilanlar] = await Promise.all([
      runQuery(
        'firms',
        [{ field: 'verified', op: 'EQUAL', value: { booleanValue: true } }],
        ['status'],
      ),
      runQuery(
        'etkinlikler',
        [{ field: 'durum', op: 'EQUAL', value: { stringValue: 'yayinda' } }],
        ['slug'],
      ),
      runQuery(
        'ilanlar',
        [{ field: 'status', op: 'EQUAL', value: { stringValue: 'aktif' } }],
        ['status'],
      ),
    ]);

    for (const d of firms) {
      urls.push(urlEntry(`/firma/${docId(d)}`, 'weekly', '0.6'));
    }

    for (const d of etkinlikler) {
      const slug = strField(d, 'slug') || docId(d);
      urls.push(urlEntry(`/etkinlikler/${slug}`, 'weekly', '0.6'));
    }

    for (const d of ilanlar) {
      urls.push(urlEntry(`/ilan/${docId(d)}`, 'weekly', '0.5'));
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');
    res.status(200).send(xml);
  } catch (e) {
    console.error('[sitemap] handler error:', e);
    res.status(500).send('Sitemap generation failed');
  }
}
