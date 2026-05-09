import type { VercelRequest, VercelResponse } from '@vercel/node';

interface HaberItem {
  baslikTr:   string;
  baslikEn:   string;
  kaynak:     string;
  kaynakUrl:  string;
  ozetTr:     string;
  ozetEn:     string;
  icerikTr:   string;
  icerikEn:   string;
  gorselUrl:  string;
  kategori:   'prefabrik' | 'konteyner' | 'tiny-house' | 'celik-yapi' | 'genel';
  bolge:      'turkiye' | 'dunya';
  tarih:      string;
}

const DEMO_HABERLER: HaberItem[] = [
  {
    baslikTr:  '2026 Prefabrik Ev Sektörü Yüzde 23 Büyüdü — İMSAD Raporu',
    baslikEn:  'Prefab Housing Sector Grew 23% in 2026 — İMSAD Report',
    kaynak:    'İMSAD',
    kaynakUrl: 'https://www.imsad.org',
    ozetTr:    'Türkiye İnşaat Malzemesi Sanayicileri Derneği verilerine göre prefabrik yapı sektörü 2025 yılında bir önceki yıla kıyasla yüzde 23 büyüdü.',
    ozetEn:    'According to the Turkish Construction Material Industrialists Association, the prefab building sector grew by 23% compared to the previous year in 2025.',
    icerikTr:  'Türkiye İnşaat Malzemesi Sanayicileri Derneği (İMSAD), 2025 yılı sektör raporunu yayımladı. Rapora göre prefabrik yapı sektörü bir önceki yıla kıyasla yüzde 23 oranında büyüme kaydetti.\n\nBüyümenin başlıca nedenleri arasında deprem sonrası artan konut talebi, kentsel dönüşüm projelerinin hız kazanması ve sürdürülebilir yapı malzemelerine olan ilginin artması gösteriliyor. Özellikle Güneydoğu Anadolu ve Doğu Anadolu bölgelerinde prefabrik konut üretimi rekor seviyelere ulaştı.\n\nİMSAD Başkanı, sektörün 2026 yılında da benzer bir büyüme trendi yakalayacağını öngördüklerini belirtti. Dernek, prefabrik yapıların depreme dayanıklılık açısından geleneksel yapılara göre önemli avantajlar sunduğunu vurguladı.\n\nRaporda ayrıca sektördeki istihdam artışına da dikkat çekildi. Prefabrik yapı sektöründe çalışan sayısı son bir yılda yüzde 15 artarak 45.000 kişiye ulaştı.',
    icerikEn:  'The Turkish Construction Material Industrialists Association (İMSAD) published its 2025 sector report. According to the report, the prefab building sector recorded a 23% growth compared to the previous year.\n\nThe main reasons for this growth include increased housing demand after earthquakes, acceleration of urban transformation projects, and growing interest in sustainable building materials. Prefab housing production reached record levels, especially in the Southeast and Eastern Anatolia regions.\n\nThe İMSAD President stated that they foresee the sector will maintain a similar growth trend in 2026. The association emphasized that prefab buildings offer significant advantages in earthquake resistance compared to traditional structures.\n\nThe report also highlighted the increase in sector employment. The number of workers in the prefab building sector increased by 15% in the past year, reaching 45,000 people.',
    gorselUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&h=500&fit=crop',
    kategori:  'prefabrik',
    bolge:     'turkiye',
    tarih:     '2026-03-25',
  },
  {
    baslikTr:  'Konteyner Ev Yönetmeliği Taslağı Hazır — Çevre Bakanlığı Açıkladı',
    baslikEn:  'Container Home Regulation Draft Ready — Ministry Announces',
    kaynak:    'Hürriyet',
    kaynakUrl: 'https://www.hurriyet.com.tr',
    ozetTr:    'Çevre Bakanlığı, konteyner evlerin imar ve yapı ruhsatı süreçlerini düzenleyen yönetmelik taslağını hazırladı.',
    ozetEn:    'The Ministry of Environment prepared a regulation draft governing zoning and building permits for container homes.',
    icerikTr:  'Çevre, Şehircilik ve İklim Değişikliği Bakanlığı, konteyner evlerin imar ve yapı ruhsatı süreçlerini düzenleyen kapsamlı bir yönetmelik taslağı hazırladı. Kamuoyu görüşüne açılan taslak, konteyner konutlar için standart ölçü ve yalıtım şartlarını belirliyor.\n\nYönetmelik taslağına göre konteyner evlerin minimum 14 metrekare kullanım alanına sahip olması, en az 50 mm kalınlığında ısı yalıtımı içermesi ve yangın güvenliği standartlarını karşılaması gerekecek. Ayrıca konteyner evler için basitleştirilmiş bir yapı ruhsatı süreci öngörülüyor.\n\nBakanlık yetkilileri, düzenlemenin hem vatandaşları koruyacağını hem de sektörün önünü açacağını belirtti. Taslak üzerinde sektör temsilcileri ve üniversitelerle istişare sürecinin devam ettiği bildirildi.\n\nKonteyner ev üreticileri derneği, yönetmeliğin sektöre olan güveni artıracağını ve kayıt dışı üretimin önüne geçeceğini değerlendirdi.',
    icerikEn:  'The Ministry of Environment, Urbanization and Climate Change has prepared a comprehensive regulation draft governing zoning and building permit processes for container homes. The draft, open for public comment, sets standard dimensions and insulation requirements for container residences.\n\nAccording to the draft regulation, container homes must have a minimum usable area of 14 square meters, include at least 50mm thermal insulation, and meet fire safety standards. A simplified building permit process is also envisioned for container homes.\n\nMinistry officials stated that the regulation will both protect citizens and pave the way for the sector. Consultations with sector representatives and universities on the draft are ongoing.\n\nThe container home manufacturers association assessed that the regulation will increase confidence in the sector and prevent unregistered production.',
    gorselUrl: 'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800&h=500&fit=crop',
    kategori:  'konteyner',
    bolge:     'turkiye',
    tarih:     '2026-03-22',
  },
  {
    baslikTr:  'Tiny House Fuarı İstanbul\'da 15.000 Ziyaretçi Ağırladı',
    baslikEn:  'Tiny House Fair in Istanbul Hosted 15,000 Visitors',
    kaynak:    'Sabah',
    kaynakUrl: 'https://www.sabah.com.tr',
    ozetTr:    '3. Türkiye Tiny House ve Modüler Yaşam Fuarı, İstanbul\'da 3 gün boyunca 15.000\'den fazla ziyaretçi ağırladı.',
    ozetEn:    'The 3rd Turkey Tiny House and Modular Living Fair hosted over 15,000 visitors in Istanbul over 3 days.',
    icerikTr:  '3. Türkiye Tiny House ve Modüler Yaşam Fuarı, İstanbul Fuar Merkezi\'nde 3 gün boyunca kapılarını açtı. Fuar boyunca 120 firma 15.000\'den fazla ziyaretçiye ürünlerini tanıttı. Özellikle off-grid güneş enerjili modeller büyük ilgi gördü.\n\nFuarda sergilenen yenilikler arasında tamamen güneş enerjisiyle çalışan tiny house modelleri, katlanabilir konteyner evler ve akıllı ev sistemleriyle donatılmış modüler yapılar ön plana çıktı. Ziyaretçilerin en çok ilgi gösterdiği ürünler arasında 30 metrekarelik mini evler ve off-grid yaşam çözümleri yer aldı.\n\nFuar organizatörü, etkinliğin her yıl büyüyen bir ilgiyle karşılaştığını ve gelecek yıl kapasiteyi iki katına çıkarmayı planladıklarını açıkladı. Fuarda ayrıca modüler yaşam ve sürdürülebilirlik konularında 20\'den fazla seminer düzenlendi.\n\nSektör temsilcileri, tiny house yaşam tarzının Türkiye\'de giderek yaygınlaştığını ve özellikle genç nesil arasında alternatif konut arayışının hız kazandığını belirtti.',
    icerikEn:  'The 3rd Turkey Tiny House and Modular Living Fair opened its doors at Istanbul Fair Center for 3 days. During the fair, 120 companies showcased their products to over 15,000 visitors. Off-grid solar-powered models attracted particular interest.\n\nAmong the innovations displayed were fully solar-powered tiny house models, foldable container homes, and modular structures equipped with smart home systems. The most popular products included 30-square-meter mini homes and off-grid living solutions.\n\nThe fair organizer announced that the event sees growing interest each year and plans to double the capacity next year. Over 20 seminars on modular living and sustainability were also held during the fair.\n\nSector representatives noted that the tiny house lifestyle is becoming increasingly popular in Turkey, with the younger generation particularly seeking alternative housing options.',
    gorselUrl: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&h=500&fit=crop',
    kategori:  'tiny-house',
    bolge:     'turkiye',
    tarih:     '2026-03-18',
  },
  {
    baslikTr:  'Çelik Yapı İhracatı İlk Çeyrekte 340 Milyon Dolar Oldu',
    baslikEn:  'Steel Building Exports Reached $340 Million in Q1',
    kaynak:    'Dünya Gazetesi',
    kaynakUrl: 'https://www.dunya.com',
    ozetTr:    'Türkiye çelik yapı ve prefabrik modüler yapı ihracatı 2026\'nın ilk çeyreğinde 340 milyon dolara ulaştı.',
    ozetEn:    'Turkey\'s steel building and prefab modular construction exports reached $340 million in Q1 2026.',
    icerikTr:  'Türkiye çelik yapı ve prefabrik modüler yapı ihracatı 2026 yılının ilk çeyreğinde 340 milyon dolara ulaştı. Bu rakam geçen yılın aynı dönemine göre yüzde 18 artış anlamına geliyor.\n\nBaşlıca ihracat pazarları arasında Körfez ülkeleri, Afrika ve Orta Asya ülkeleri yer alıyor. Suudi Arabistan ve BAE, en büyük alıcılar olmaya devam ederken, Libya ve Cezayir gibi Kuzey Afrika ülkelerinden gelen talepler de önemli ölçüde arttı.\n\nÇelik Yapı Üreticileri Derneği Başkanı, Türk firmalarının kalite-fiyat dengesinde küresel rekabet gücüne sahip olduğunu vurguladı. Dernek, yıl sonunda ihracatın 1,5 milyar dolar hedefine ulaşmasını beklediğini açıkladı.\n\nSektör uzmanları, deprem kuşağındaki ülkelerin çelik yapılara olan talebinin artmaya devam edeceğini ve Türkiye\'nin bu alanda önemli bir tedarikçi konumunu sürdüreceğini öngörüyor.',
    icerikEn:  'Turkey\'s steel building and prefab modular construction exports reached $340 million in the first quarter of 2026. This figure represents an 18% increase compared to the same period last year.\n\nThe main export markets include Gulf countries, Africa, and Central Asian nations. Saudi Arabia and the UAE remain the largest buyers, while demand from North African countries like Libya and Algeria has also increased significantly.\n\nThe Steel Building Manufacturers Association President emphasized that Turkish firms have global competitive strength in terms of quality-price balance. The association announced it expects exports to reach the $1.5 billion target by year-end.\n\nSector experts foresee that demand for steel structures from countries in earthquake zones will continue to grow, and Turkey will maintain its position as a significant supplier in this field.',
    gorselUrl: 'https://images.unsplash.com/photo-1581094794329-c8112c4e5190?w=800&h=500&fit=crop',
    kategori:  'celik-yapi',
    bolge:     'turkiye',
    tarih:     '2026-03-15',
  },
  {
    baslikTr:  'Depreme Dayanıklı Prefabrik Yapı Standartları Güncellendi',
    baslikEn:  'Earthquake-Resistant Prefab Building Standards Updated',
    kaynak:    'Anadolu Ajansı',
    kaynakUrl: 'https://www.aa.com.tr',
    ozetTr:    'TSE, prefabrik ve çelik modüler yapılar için deprem performans standartlarını güncelledi.',
    ozetEn:    'TSE updated seismic performance standards for prefab and steel modular buildings.',
    icerikTr:  'Türk Standardları Enstitüsü (TSE), prefabrik ve çelik modüler yapılar için deprem performans standartlarını TBDY 2018 revizyonuna uyumlu hale getirdi. Yeni standartlar 1 Nisan 2026\'dan itibaren tüm yeni üretim için zorunlu olacak.\n\nGüncellenen standartlar kapsamında prefabrik yapıların daha yüksek deprem kuvvetlerine dayanması, bağlantı noktalarının güçlendirilmesi ve temel-üst yapı bağlantılarının iyileştirilmesi hedefleniyor.\n\nTSE yetkilileri, yeni standartların 2023 Kahramanmaraş depremlerinden çıkarılan dersleri de içerdiğini ve prefabrik yapıların deprem performansını önemli ölçüde artıracağını belirtti. Standartların hazırlanmasında üniversiteler, sektör temsilcileri ve AFAD ile kapsamlı bir işbirliği yapıldığı kaydedildi.\n\nÜreticilere uyum süreci için 6 aylık bir geçiş dönemi tanınacak. Bu süre zarfında TSE, üreticilere yönelik eğitim programları ve teknik destek hizmetleri sunacak.',
    icerikEn:  'The Turkish Standards Institute (TSE) has aligned seismic performance standards for prefab and steel modular buildings with the TBDY 2018 revision. The new standards will be mandatory for all new production from April 1, 2026.\n\nThe updated standards aim to ensure prefab structures can withstand higher seismic forces, strengthen connection points, and improve foundation-superstructure connections.\n\nTSE officials stated that the new standards incorporate lessons learned from the 2023 Kahramanmaras earthquakes and will significantly improve the seismic performance of prefab buildings. Extensive collaboration with universities, sector representatives, and AFAD was noted in preparing the standards.\n\nManufacturers will be given a 6-month transition period for compliance. During this time, TSE will provide training programs and technical support services for producers.',
    gorselUrl: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&h=500&fit=crop',
    kategori:  'genel',
    bolge:     'turkiye',
    tarih:     '2026-03-10',
  },
  {
    baslikTr:  'Modular Building Institute: Küresel Prefab Pazarı 2028\'de 227 Milyar Dolara Ulaşacak',
    baslikEn:  'Global Prefab Market to Reach $227B by 2028 — MBI Report',
    kaynak:    'Modular Building Institute',
    kaynakUrl: 'https://www.modular.org',
    ozetTr:    'MBI raporuna göre küresel prefabrik ve modüler yapı pazarı 2028\'e kadar 227 milyar dolara ulaşacak.',
    ozetEn:    'According to the MBI report, the global prefab and modular building market will reach $227 billion by 2028.',
    icerikTr:  'Modular Building Institute (MBI), 2026 yıllık raporunda küresel prefabrik ve modüler yapı pazarının 2028 yılına kadar 227 milyar dolara ulaşacağını öngördü. Bu büyümenin arkasındaki temel itici güçler konut açığı, sürdürülebilirlik gereksinimleri ve daha hızlı teslim süreleri olarak sıralanıyor.\n\nRapora göre Kuzey Amerika ve Avrupa pazarları en hızlı büyüyen bölgeler olarak öne çıkıyor. ABD\'de modüler konut üretimi son iki yılda yüzde 35 artarken, İskandinav ülkelerinde prefabrik konutların toplam konut üretimindeki payı yüzde 40\'ı aştı.\n\nMBI Başkanı, iklim değişikliği hedeflerinin modüler yapı sektörünü dönüştürdüğünü belirtti. Fabrika ortamında üretilen yapıların geleneksel inşaata göre yüzde 50 daha az atık ürettiği ve karbon ayak izini önemli ölçüde azalttığı vurgulandı.\n\nRaporda Türkiye, gelişen pazarlar arasında dikkat çeken ülkelerden biri olarak değerlendirildi. Özellikle deprem sonrası kalıcı konut üretiminde modüler yapıların tercih edilmesi, Türkiye\'yi bölgesel bir üretim merkezi haline getiriyor.',
    icerikEn:  'The Modular Building Institute (MBI) projected in its 2026 annual report that the global prefab and modular building market will reach $227 billion by 2028. The key driving forces behind this growth are housing shortages, sustainability requirements, and faster delivery times.\n\nAccording to the report, North American and European markets stand out as the fastest-growing regions. Modular housing production in the US has increased by 35% in the last two years, while in Scandinavian countries, the share of prefab homes in total housing production has exceeded 40%.\n\nThe MBI President stated that climate change targets are transforming the modular building sector. It was emphasized that factory-produced buildings generate 50% less waste than traditional construction and significantly reduce the carbon footprint.\n\nTurkey was identified in the report as one of the notable countries among emerging markets. The preference for modular structures in post-earthquake permanent housing production is making Turkey a regional production hub.',
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
        baslikTr:  a.title,
        baslikEn:  '',
        kaynak:    a.source.name,
        kaynakUrl: a.url,
        ozetTr:    a.description ?? '',
        ozetEn:    '',
        icerikTr:  a.content ?? a.description ?? '',
        icerikEn:  '',
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

  return res.status(200).json({ haberler: DEMO_HABERLER, kaynak: 'demo' });
}
