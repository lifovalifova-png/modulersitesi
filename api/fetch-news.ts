import type { VercelRequest, VercelResponse } from '@vercel/node';

/* ── Modüler yapı sektörü haberlerini döndürür ──────────────
   NEWS_API_KEY env değişkeni ayarlıysa NewsAPI.org kullanılır.
   Yoksa güncel örnek haberler döndürülür (demo modu).
─────────────────────────────────────────────────────────── */

interface HaberItem {
  baslik:    string;
  kaynak:    string;
  kaynakUrl: string;
  ozet:      string;
  kategori:  'prefabrik' | 'konteyner' | 'tiny-house' | 'celik-yapi' | 'genel';
  bolge:     'turkiye' | 'dunya';
  tarih:     string;
}

const DEMO_HABERLER: HaberItem[] = [
  {
    baslik:    '2026 Prefabrik Ev Sektörü Yüzde 23 Büyüdü — İMSAD Raporu',
    kaynak:    'İMSAD',
    kaynakUrl: 'https://www.imsad.org',
    ozet:      'Türkiye İnşaat Malzemesi Sanayicileri Derneği verilerine göre prefabrik yapı sektörü 2025 yılında bir önceki yıla kıyasla yüzde 23 büyüdü. Deprem sonrası talep artışı ve kentsel dönüşüm projeleri büyümenin başlıca nedenleri arasında gösteriliyor.',
    kategori:  'prefabrik',
    bolge:     'turkiye',
    tarih:     '2026-03-25',
  },
  {
    baslik:    'Konteyner Ev Yönetmeliği Taslağı Hazır — Çevre Bakanlığı Açıkladı',
    kaynak:    'Hürriyet',
    kaynakUrl: 'https://www.hurriyet.com.tr',
    ozet:      'Çevre, Şehircilik ve İklim Değişikliği Bakanlığı, konteyner evlerin imar ve yapı ruhsatı süreçlerini düzenleyen yönetmelik taslağını hazırladı. Kamuoyu görüşüne açılan taslak, konteyner konutları için standart ölçü ve yalıtım şartlarını belirliyor.',
    kategori:  'konteyner',
    bolge:     'turkiye',
    tarih:     '2026-03-22',
  },
  {
    baslik:    'Tiny House Fuarı İstanbul\'da 15.000 Ziyaretçi Ağırladı',
    kaynak:    'Sabah',
    kaynakUrl: 'https://www.sabah.com.tr',
    ozet:      '3. Türkiye Tiny House ve Modüler Yaşam Fuarı, İstanbul Fuar Merkezi\'nde 3 gün boyunca kapılarını açtı. Fuar boyunca 120 firma 15.000\'den fazla ziyaretçiye ürünlerini tanıttı; özellikle off-grid güneş enerjili modeller yoğun ilgi gördü.',
    kategori:  'tiny-house',
    bolge:     'turkiye',
    tarih:     '2026-03-18',
  },
  {
    baslik:    'Çelik Yapı İhracatı İlk Çeyrekte 340 Milyon Dolar Oldu',
    kaynak:    'Dünya Gazetesi',
    kaynakUrl: 'https://www.dunya.com',
    ozet:      'Türkiye çelik yapı ve prefabrik modüler yapı ihracatı 2026 yılının ilk çeyreğinde 340 milyon dolara ulaştı. Başlıca pazarlar Körfez ülkeleri, Afrika ve Orta Asya ülkeleri olarak sıralandı.',
    kategori:  'celik-yapi',
    bolge:     'turkiye',
    tarih:     '2026-03-15',
  },
  {
    baslik:    'Depreme Dayanıklı Prefabrik Yapı Standartları Güncellendi',
    kaynak:    'Anadolu Ajansı',
    kaynakUrl: 'https://www.aa.com.tr',
    ozet:      'TSE, prefabrik ve çelik modüler yapılar için deprem performans standartlarını TBDY 2018 revizyonuna uyumlu hale getirdi. Yeni standartlar 1 Nisan 2026\'dan itibaren tüm yeni üretim için zorunlu olacak.',
    kategori:  'genel',
    bolge:     'turkiye',
    tarih:     '2026-03-10',
  },
  {
    baslik:    'Modular Building Institute: Global Prefab Market to Reach $227B by 2028',
    kaynak:    'Modular Building Institute',
    kaynakUrl: 'https://www.modular.org',
    ozet:      'The Modular Building Institute\'s 2026 annual report forecasts the global prefab and modular construction market will reach $227 billion by 2028, driven by housing shortages, sustainability mandates, and faster delivery timelines.',
    kategori:  'prefabrik',
    bolge:     'dunya',
    tarih:     '2026-03-20',
  },
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.NEWS_API_KEY;

  if (apiKey) {
    /* NewsAPI.org entegrasyonu — NEWS_API_KEY env ile etkinleşir */
    const sorgu = encodeURIComponent('prefabrik ev OR konteyner ev OR "modüler yapı" OR "çelik yapı" OR "tiny house"');
    const url   = `https://newsapi.org/v2/everything?q=${sorgu}&language=tr&sortBy=publishedAt&pageSize=10&apiKey=${apiKey}`;
    try {
      const r    = await fetch(url);
      const json = await r.json() as {
        articles?: Array<{
          title: string; source: { name: string }; url: string;
          description?: string; publishedAt: string;
        }>
      };
      const haberler: HaberItem[] = (json.articles ?? []).map((a) => ({
        baslik:    a.title,
        kaynak:    a.source.name,
        kaynakUrl: a.url,
        ozet:      a.description ?? '',
        kategori:  'genel' as const,
        bolge:     'turkiye' as const,
        tarih:     a.publishedAt.slice(0, 10),
      }));
      return res.status(200).json({ haberler, kaynak: 'newsapi' });
    } catch {
      /* API başarısız → demo veriye düş */
    }
  }

  /* Demo modu */
  return res.status(200).json({ haberler: DEMO_HABERLER, kaynak: 'demo' });
}
