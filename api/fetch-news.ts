import type { VercelRequest, VercelResponse } from '@vercel/node';

/* ── Modüler yapı sektörü haberlerini döndürür ──────────────
   NEWS_API_KEY env değişkeni ayarlıysa NewsAPI.org kullanılır.
   Yoksa güncel örnek haberler döndürülür (demo modu).

   AI İçerik Üretim Kuralları (system prompt):
   "Sen deneyimli bir haber editörüsün. Verilen haber başlığı ve
   kaynağından kapsamlı bir Türkçe haber yazısı hazırla.
   Kurallar:
   - 4-5 paragraf yaz (toplam 400-600 kelime)
   - 1. paragraf: haberin özeti (kim, ne, nerede, ne zaman)
   - 2-3. paragraflar: detaylar, rakamlar, uzman görüşleri
   - 4. paragraf: sektöre etkisi, Türkiye pazarıyla ilişkilendir
   - 5. paragraf: gelecek beklentisi ve sonuç
   - Orijinal metni kopyalama, tamamen kendi cümlelerinle yaz
   - Teknik terimleri doğru kullan
   - Yabancı kaynaklardan gelen haberleri Türkçeye çevir"
─────────────────────────────────────────────────────────── */

interface HaberItem {
  baslik:     string;
  kaynak:     string;
  kaynakUrl:  string;
  ozet:       string;
  icerik:     string;
  gorselUrl:  string;
  kategori:   'prefabrik' | 'konteyner' | 'tiny-house' | 'celik-yapi' | 'genel';
  bolge:      'turkiye' | 'dunya';
  tarih:      string;
}

const DEMO_HABERLER: HaberItem[] = [
  {
    baslik:    '2026 Prefabrik Ev Sektörü Yüzde 23 Büyüdü — İMSAD Raporu',
    kaynak:    'İMSAD',
    kaynakUrl: 'https://www.imsad.org',
    ozet:      'Türkiye İnşaat Malzemesi Sanayicileri Derneği verilerine göre prefabrik yapı sektörü 2025 yılında bir önceki yıla kıyasla yüzde 23 büyüdü.',
    icerik:    'Türkiye İnşaat Malzemesi Sanayicileri Derneği (İMSAD), 2025 yılı sektör raporunu yayımladı. Rapora göre prefabrik yapı sektörü bir önceki yıla kıyasla yüzde 23 oranında büyüme kaydetti.\n\nBüyümenin başlıca nedenleri arasında deprem sonrası artan konut talebi, kentsel dönüşüm projelerinin hız kazanması ve sürdürülebilir yapı malzemelerine olan ilginin artması gösteriliyor. Özellikle Güneydoğu Anadolu ve Doğu Anadolu bölgelerinde prefabrik konut üretimi rekor seviyelere ulaştı.\n\nİMSAD Başkanı, sektörün 2026 yılında da benzer bir büyüme trendi yakalayacağını öngördüklerini belirtti. Dernek, prefabrik yapıların depreme dayanıklılık açısından geleneksel yapılara göre önemli avantajlar sunduğunu vurguladı.\n\nRaporda ayrıca sektördeki istihdam artışına da dikkat çekildi. Prefabrik yapı sektöründe çalışan sayısı son bir yılda yüzde 15 artarak 45.000 kişiye ulaştı.',
    gorselUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&h=500&fit=crop',
    kategori:  'prefabrik',
    bolge:     'turkiye',
    tarih:     '2026-03-25',
  },
  {
    baslik:    'Konteyner Ev Yönetmeliği Taslağı Hazır — Çevre Bakanlığı Açıkladı',
    kaynak:    'Hürriyet',
    kaynakUrl: 'https://www.hurriyet.com.tr',
    ozet:      'Çevre Bakanlığı, konteyner evlerin imar ve yapı ruhsatı süreçlerini düzenleyen yönetmelik taslağını hazırladı.',
    icerik:    'Çevre, Şehircilik ve İklim Değişikliği Bakanlığı, konteyner evlerin imar ve yapı ruhsatı süreçlerini düzenleyen kapsamlı bir yönetmelik taslağı hazırladı. Kamuoyu görüşüne açılan taslak, konteyner konutlar için standart ölçü ve yalıtım şartlarını belirliyor.\n\nYönetmelik taslağına göre konteyner evlerin minimum 14 metrekare kullanım alanına sahip olması, en az 50 mm kalınlığında ısı yalıtımı içermesi ve yangın güvenliği standartlarını karşılaması gerekecek. Ayrıca konteyner evler için basitleştirilmiş bir yapı ruhsatı süreci öngörülüyor.\n\nBakanlık yetkilileri, düzenlemenin hem vatandaşları koruyacağını hem de sektörün önünü açacağını belirtti. Taslak üzerinde sektör temsilcileri ve üniversitelerle istişare sürecinin devam ettiği bildirildi.\n\nKonteyner ev üreticileri derneği, yönetmeliğin sektöre olan güveni artıracağını ve kayıt dışı üretimin önüne geçeceğini değerlendirdi.',
    gorselUrl: 'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800&h=500&fit=crop',
    kategori:  'konteyner',
    bolge:     'turkiye',
    tarih:     '2026-03-22',
  },
  {
    baslik:    'Tiny House Fuarı İstanbul\'da 15.000 Ziyaretçi Ağırladı',
    kaynak:    'Sabah',
    kaynakUrl: 'https://www.sabah.com.tr',
    ozet:      '3. Türkiye Tiny House ve Modüler Yaşam Fuarı, İstanbul\'da 3 gün boyunca 15.000\'den fazla ziyaretçi ağırladı.',
    icerik:    '3. Türkiye Tiny House ve Modüler Yaşam Fuarı, İstanbul Fuar Merkezi\'nde 3 gün boyunca kapılarını açtı. Fuar boyunca 120 firma 15.000\'den fazla ziyaretçiye ürünlerini tanıttı. Özellikle off-grid güneş enerjili modeller büyük ilgi gördü.\n\nFuarda sergilenen yenilikler arasında tamamen güneş enerjisiyle çalışan tiny house modelleri, katlanabilir konteyner evler ve akıllı ev sistemleriyle donatılmış modüler yapılar ön plana çıktı. Ziyaretçilerin en çok ilgi gösterdiği ürünler arasında 30 metrekarelik mini evler ve off-grid yaşam çözümleri yer aldı.\n\nFuar organizatörü, etkinliğin her yıl büyüyen bir ilgiyle karşılaştığını ve gelecek yıl kapasiteyi iki katına çıkarmayı planladıklarını açıkladı. Fuarda ayrıca modüler yaşam ve sürdürülebilirlik konularında 20\'den fazla seminer düzenlendi.\n\nSektör temsilcileri, tiny house yaşam tarzının Türkiye\'de giderek yaygınlaştığını ve özellikle genç nesil arasında alternatif konut arayışının hız kazandığını belirtti.',
    gorselUrl: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&h=500&fit=crop',
    kategori:  'tiny-house',
    bolge:     'turkiye',
    tarih:     '2026-03-18',
  },
  {
    baslik:    'Çelik Yapı İhracatı İlk Çeyrekte 340 Milyon Dolar Oldu',
    kaynak:    'Dünya Gazetesi',
    kaynakUrl: 'https://www.dunya.com',
    ozet:      'Türkiye çelik yapı ve prefabrik modüler yapı ihracatı 2026\'nın ilk çeyreğinde 340 milyon dolara ulaştı.',
    icerik:    'Türkiye çelik yapı ve prefabrik modüler yapı ihracatı 2026 yılının ilk çeyreğinde 340 milyon dolara ulaştı. Bu rakam geçen yılın aynı dönemine göre yüzde 18 artış anlamına geliyor.\n\nBaşlıca ihracat pazarları arasında Körfez ülkeleri, Afrika ve Orta Asya ülkeleri yer alıyor. Suudi Arabistan ve BAE, en büyük alıcılar olmaya devam ederken, Libya ve Cezayir gibi Kuzey Afrika ülkelerinden gelen talepler de önemli ölçüde arttı.\n\nÇelik Yapı Üreticileri Derneği Başkanı, Türk firmalarının kalite-fiyat dengesinde küresel rekabet gücüne sahip olduğunu vurguladı. Dernek, yıl sonunda ihracatın 1,5 milyar dolar hedefine ulaşmasını beklediğini açıkladı.\n\nSektör uzmanları, deprem kuşağındaki ülkelerin çelik yapılara olan talebinin artmaya devam edeceğini ve Türkiye\'nin bu alanda önemli bir tedarikçi konumunu sürdüreceğini öngörüyor.',
    gorselUrl: 'https://images.unsplash.com/photo-1581094794329-c8112c4e5190?w=800&h=500&fit=crop',
    kategori:  'celik-yapi',
    bolge:     'turkiye',
    tarih:     '2026-03-15',
  },
  {
    baslik:    'Depreme Dayanıklı Prefabrik Yapı Standartları Güncellendi',
    kaynak:    'Anadolu Ajansı',
    kaynakUrl: 'https://www.aa.com.tr',
    ozet:      'TSE, prefabrik ve çelik modüler yapılar için deprem performans standartlarını güncelledi.',
    icerik:    'Türk Standardları Enstitüsü (TSE), prefabrik ve çelik modüler yapılar için deprem performans standartlarını TBDY 2018 revizyonuna uyumlu hale getirdi. Yeni standartlar 1 Nisan 2026\'dan itibaren tüm yeni üretim için zorunlu olacak.\n\nGüncellenen standartlar kapsamında prefabrik yapıların daha yüksek deprem kuvvetlerine dayanması, bağlantı noktalarının güçlendirilmesi ve temel-üst yapı bağlantılarının iyileştirilmesi hedefleniyor.\n\nTSE yetkilileri, yeni standartların 2023 Kahramanmaraş depremlerinden çıkarılan dersleri de içerdiğini ve prefabrik yapıların deprem performansını önemli ölçüde artıracağını belirtti. Standartların hazırlanmasında üniversiteler, sektör temsilcileri ve AFAD ile kapsamlı bir işbirliği yapıldığı kaydedildi.\n\nÜreticilere uyum süreci için 6 aylık bir geçiş dönemi tanınacak. Bu süre zarfında TSE, üreticilere yönelik eğitim programları ve teknik destek hizmetleri sunacak.',
    gorselUrl: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&h=500&fit=crop',
    kategori:  'genel',
    bolge:     'turkiye',
    tarih:     '2026-03-10',
  },
  {
    baslik:    'Modular Building Institute: Global Prefab Market to Reach $227B by 2028',
    kaynak:    'Modular Building Institute',
    kaynakUrl: 'https://www.modular.org',
    ozet:      'MBI raporuna göre küresel prefabrik ve modüler yapı pazarı 2028\'e kadar 227 milyar dolara ulaşacak.',
    icerik:    'Modular Building Institute (MBI), 2026 yıllık raporunda küresel prefabrik ve modüler yapı pazarının 2028 yılına kadar 227 milyar dolara ulaşacağını öngördü. Bu büyümenin arkasındaki temel itici güçler konut açığı, sürdürülebilirlik gereksinimleri ve daha hızlı teslim süreleri olarak sıralanıyor.\n\nRapora göre Kuzey Amerika ve Avrupa pazarları en hızlı büyüyen bölgeler olarak öne çıkıyor. ABD\'de modüler konut üretimi son iki yılda yüzde 35 artarken, İskandinav ülkelerinde prefabrik konutların toplam konut üretimindeki payı yüzde 40\'ı aştı.\n\nMBI Başkanı, iklim değişikliği hedeflerinin modüler yapı sektörünü dönüştürdüğünü belirtti. Fabrika ortamında üretilen yapıların geleneksel inşaata göre yüzde 50 daha az atık ürettiği ve karbon ayak izini önemli ölçüde azalttığı vurgulandı.\n\nRaporda Türkiye, gelişen pazarlar arasında dikkat çeken ülkelerden biri olarak değerlendirildi. Özellikle deprem sonrası kalıcı konut üretiminde modüler yapıların tercih edilmesi, Türkiye\'yi bölgesel bir üretim merkezi haline getiriyor.',
    gorselUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=500&fit=crop',
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
          urlToImage?: string; content?: string;
        }>
      };
      const haberler: HaberItem[] = (json.articles ?? []).map((a) => ({
        baslik:    a.title,
        kaynak:    a.source.name,
        kaynakUrl: a.url,
        ozet:      a.description ?? '',
        icerik:    a.content ?? a.description ?? '',
        gorselUrl: a.urlToImage ?? '',
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
