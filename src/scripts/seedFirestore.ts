/**
 * seedFirestore.ts
 * Firebase client SDK ile Firestore'a test verisi ekler / temizler.
 * Admin Dashboard'daki butonlarla çalıştırılır.
 */
import {
  collection,
  doc,
  writeBatch,
  getDocs,
  getDoc,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { BLOG_POSTS } from '../data/blogPosts';
import { BLOG_ICERIK } from '../data/blogIcerik';

/* ── helpers ─────────────────────────────────────────────── */
function daysAgo(n: number): Timestamp {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return Timestamp.fromDate(d);
}

function futureDays(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

/* ── Unsplash görselleri kategori bazlı ─────────────────── */
const IMGS: Record<string, string[]> = {
  prefabrik: [
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=500&fit=crop',
  ],
  'celik-yapilar': [
    'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=500&fit=crop',
  ],
  'yasam-konteynerleri': [
    'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1494475673543-6a6a27143fc8?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1494526585095-c41746248156?w=800&h=500&fit=crop',
  ],
  'tiny-house': [
    'https://images.unsplash.com/photo-1501183638710-841dd1904471?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=800&h=500&fit=crop',
  ],
  'ahsap-yapilar': [
    'https://images.unsplash.com/photo-1449844908441-8829872d2607?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=800&h=500&fit=crop',
  ],
};

/* ══════════════════════════════════════════════════════════
   FIRMS — 10 adet
══════════════════════════════════════════════════════════ */
const FIRMS = [
  {
    id: 'seed_firm_01',
    name: 'Anadolu Prefabrik',
    category: 'Prefabrik',
    kategoriSlug: 'prefabrik',
    city: 'Ankara', sehir: 'Ankara',
    address: 'Ostim Organize Sanayi Bölgesi No:42, Yenimahalle / Ankara',
    phone: '0312 111 22 33',
    email: 'info@anadoluprefabrik.com',
    website: 'https://anadoluprefabrik.com',
    rating: 4.8,
    tanitimMetni: '1998\'den beri Ankara ve çevresine yüksek kaliteli prefabrik yapı çözümleri sunuyoruz. Fabrika tesislerimizde üretilen yapılarımız anahtar teslim teslim edilmektedir.',
    kategoriler: ['prefabrik'],
    hizmetler: ['Prefabrik Ev', 'Villa', 'Yazlık', 'Tatil Bungalov'],
  },
  {
    id: 'seed_firm_02',
    name: 'İstanbul Konteyner',
    category: 'Yaşam Konteynerleri',
    kategoriSlug: 'yasam-konteynerleri',
    city: 'İstanbul', sehir: 'İstanbul',
    address: 'Tuzla Sanayi Sitesi C Blok No:15, Tuzla / İstanbul',
    phone: '0216 222 33 44',
    email: 'info@istanbulkonteyner.com',
    website: 'https://istanbulkonteyner.com',
    rating: 4.5,
    tanitimMetni: 'Konteyner dönüşüm ve prefabrik konteyner ev konusunda Türkiye\'nin önde gelen firması. 20 feet ve 40 feet konteynerlerden yaşam alanı tasarımında uzmanız.',
    kategoriler: ['yasam-konteynerleri'],
    hizmetler: ['Konteyner Ev', 'Konteyner Ofis', 'Yurt', 'Depo'],
  },
  {
    id: 'seed_firm_03',
    name: 'Ege Çelik Yapı',
    category: 'Çelik Yapılar',
    kategoriSlug: 'celik-yapilar',
    city: 'İzmir', sehir: 'İzmir',
    address: 'Kemalpaşa OSB 3. Cadde No:8, Kemalpaşa / İzmir',
    phone: '0232 333 44 55',
    email: 'info@egecelik.com',
    website: 'https://egecelikyapi.com',
    rating: 4.7,
    tanitimMetni: 'Ege bölgesinin en köklü çelik yapı firması olarak 20 yıldır hizmet veriyoruz. Depreme dayanıklı çelik yapı sistemlerinde uzmanız.',
    kategoriler: ['celik-yapilar', 'prefabrik'],
    hizmetler: ['Çelik Ev', 'Çelik Villa', 'Çelik İskelet Prefabrik'],
  },
  {
    id: 'seed_firm_04',
    name: 'Karadeniz Tiny House',
    category: 'Tiny House',
    kategoriSlug: 'tiny-house',
    city: 'Trabzon', sehir: 'Trabzon',
    address: 'Arsin Küçük Sanayi Sitesi No:22, Arsin / Trabzon',
    phone: '0462 444 55 66',
    email: 'info@karadeniztinyhouse.com',
    website: 'https://karadeniztinyhouse.com',
    rating: 4.9,
    tanitimMetni: 'Karadeniz\'in doğal ahşabından ilham alan özel tiny house tasarımları. Her proje elle yapılmış, özgün ve doğayla uyumlu.',
    kategoriler: ['tiny-house', 'ahsap-yapilar'],
    hizmetler: ['Tiny House', 'Tekerlekli Tiny House', 'Ahşap Bungalov'],
  },
  {
    id: 'seed_firm_05',
    name: 'Bursa Modüler',
    category: 'Prefabrik',
    kategoriSlug: 'prefabrik',
    city: 'Bursa', sehir: 'Bursa',
    address: 'Nilüfer OSB 5. Cadde No:19, Nilüfer / Bursa',
    phone: '0224 555 66 77',
    email: 'info@bursamoduler.com',
    website: 'https://bursamoduler.com',
    rating: 4.6,
    tanitimMetni: 'Marmara bölgesine modüler prefabrik çözümler üretiyoruz. Kısa sürede teslim, uygun fiyat garantisi.',
    kategoriler: ['prefabrik'],
    hizmetler: ['Modüler Ev', 'Prefabrik Villa', 'Bungalov'],
  },
  {
    id: 'seed_firm_06',
    name: 'Antalya Prefabrik',
    category: 'Prefabrik',
    kategoriSlug: 'prefabrik',
    city: 'Antalya', sehir: 'Antalya',
    address: 'Kepez Sanayi Sitesi 2. Blok No:44, Kepez / Antalya',
    phone: '0242 666 77 88',
    email: 'info@antalyaprefabrik.com',
    website: 'https://antalyaprefabrik.com',
    rating: 4.4,
    tanitimMetni: 'Akdeniz iklimine uygun özel prefabrik ve yazlık ev çözümleri. Tuz atmosferine dayanıklı malzeme kullanıyoruz.',
    kategoriler: ['prefabrik'],
    hizmetler: ['Yazlık Prefabrik', 'Tatil Bungalov', 'Tatil Köyü'],
  },
  {
    id: 'seed_firm_07',
    name: 'Konya Çelik',
    category: 'Çelik Yapılar',
    kategoriSlug: 'celik-yapilar',
    city: 'Konya', sehir: 'Konya',
    address: 'Karatay OSB 1. Sokak No:7, Karatay / Konya',
    phone: '0332 777 88 99',
    email: 'info@konyacelik.com',
    website: 'https://konyacelik.com',
    rating: 4.3,
    tanitimMetni: 'İç Anadolu\'nun en güçlü çelik yapı üreticisi. Soğuğa ve sıcağa dayanıklı özel yalıtım sistemleri.',
    kategoriler: ['celik-yapilar', 'prefabrik'],
    hizmetler: ['Çelik Ev', 'Endüstriyel Yapı', 'Depo+Konut Kombine'],
  },
  {
    id: 'seed_firm_08',
    name: 'Adana Konteyner',
    category: 'Yaşam Konteynerleri',
    kategoriSlug: 'yasam-konteynerleri',
    city: 'Adana', sehir: 'Adana',
    address: 'Seyhan Sanayi Bölgesi Blok:3 No:12, Seyhan / Adana',
    phone: '0322 888 99 00',
    email: 'info@adanakonteyner.com',
    website: 'https://adanakonteyner.com',
    rating: 4.5,
    tanitimMetni: 'Güney illerinde hızlı ve uygun fiyatlı konteyner yapı çözümleri. Sıcak iklime özel havalandırma sistemleri.',
    kategoriler: ['yasam-konteynerleri'],
    hizmetler: ['Konteyner Ev', 'Konteyner Yurt', 'Konteyner Villa'],
  },
  {
    id: 'seed_firm_09',
    name: 'Gaziantep Yapı',
    category: 'Ahşap Yapılar',
    kategoriSlug: 'ahsap-yapilar',
    city: 'Gaziantep', sehir: 'Gaziantep',
    address: 'Organize Sanayi Bölgesi 8. Cadde No:33, Şahinbey / Gaziantep',
    phone: '0342 999 00 11',
    email: 'info@gaziantepyapi.com',
    website: 'https://gaziantepyapi.com',
    rating: 4.2,
    tanitimMetni: 'Güneydoğu Anadolu\'da ahşap ve modüler yapı çözümleri. El işçiliği ve özgün tasarımlarla fark yaratıyoruz.',
    kategoriler: ['ahsap-yapilar', 'prefabrik'],
    hizmetler: ['Ahşap Ev', 'Kütük Ev', 'Bungalov'],
  },
  {
    id: 'seed_firm_10',
    name: 'Mersin Modüler',
    category: 'Tiny House',
    kategoriSlug: 'tiny-house',
    city: 'Mersin', sehir: 'Mersin',
    address: 'Tarsus OSB 4. Cadde No:21, Tarsus / Mersin',
    phone: '0324 100 11 22',
    email: 'info@mersinmoduler.com',
    website: 'https://mersinmoduler.com',
    rating: 4.6,
    tanitimMetni: 'Akdeniz\'de tiny house ve modüler yaşam çözümleri üretiyoruz. Deniz manzaralı araziler için özel tasarım.',
    kategoriler: ['tiny-house'],
    hizmetler: ['Tiny House', 'Mobil Tiny House', 'Lüks Tiny House'],
  },
] as const;

type FirmId = typeof FIRMS[number]['id'];

/* ══════════════════════════════════════════════════════════
   İLANLAR — 30 adet (firmadan 3'er)
   acil: 5 adet (03,06,10,14,19)
   indirimli: 5 adet (04,08,12,16,21)
══════════════════════════════════════════════════════════ */
interface IlanSeed {
  id: string;
  firmaId: FirmId;
  baslik: string;
  fiyat: number;
  aciklama: string;
  acil: boolean;
  indirimli: boolean;
}

const ILANLAR: IlanSeed[] = [
  /* ── Anadolu Prefabrik / Ankara — 3.500 TL/m² ── */
  { id: 'seed_ilan_01', firmaId: 'seed_firm_01', baslik: '80m² Prefabrik Villa - Anahtar Teslim',    fiyat:  280000, aciklama: 'Fabrikada üretilmiş, anahtar teslim 80m² prefabrik villa. Isı yalıtımlı, çift camlı, kurulum dahil fiyat.', acil: false, indirimli: false },
  { id: 'seed_ilan_02', firmaId: 'seed_firm_01', baslik: '120m² Prefabrik Müstakil Ev - 3+1',        fiyat:  420000, aciklama: 'Geniş 3+1 müstakil prefabrik ev. Yerden ısıtma, klima altyapısı, balkon ve teras dahil.', acil: false, indirimli: false },
  { id: 'seed_ilan_03', firmaId: 'seed_firm_01', baslik: '50m² Yazlık Prefabrik - 45 Gün Teslim',   fiyat:  175000, aciklama: 'Yazlık ve tatil amaçlı kompakt prefabrik. 45 günde teslim garantisi. Temel hariç fiyat.', acil: true, indirimli: false },

  /* ── İstanbul Konteyner / İstanbul — 150k-450k ── */
  { id: 'seed_ilan_04', firmaId: 'seed_firm_02', baslik: '20 Feet Konteyner Ofis - Hazır Teslimat',  fiyat:  180000, aciklama: 'Komple düzenlenmiş konteyner ofis. Klimalı, ısı yalıtımlı, elektrik tesisatı tamamlanmış.', acil: false, indirimli: true },
  { id: 'seed_ilan_05', firmaId: 'seed_firm_02', baslik: '40 Feet Yaşam Konteyneri - 2+1',           fiyat:  320000, aciklama: '40 feet konteynerden dönüştürülmüş 2+1 yaşam alanı. Mutfak, banyo, salon ve yatak odası tam donanımlı.', acil: false, indirimli: false },
  { id: 'seed_ilan_06', firmaId: 'seed_firm_02', baslik: 'Çift Konteyner Villa - Geniş Bahçeli',    fiyat:  420000, aciklama: 'İki 40 feet konteynerin birleşiminden oluşan lüks villa. Geniş terası ve özel bahçesiyle dikkat çekiyor.', acil: true, indirimli: false },

  /* ── Ege Çelik Yapı / İzmir — 40.000 TL/m² (1.250 USD × 32 TL) ── */
  { id: 'seed_ilan_07', firmaId: 'seed_firm_03', baslik: 'Çift Katlı Çelik Ev - 120m²',             fiyat: 4800000, aciklama: 'Çelik iskelet sistem üzerine inşa edilmiş 120m² çift katlı ev. Depreme dayanıklı, uzun ömürlü.', acil: false, indirimli: false },
  { id: 'seed_ilan_08', firmaId: 'seed_firm_03', baslik: 'Çelik İskelet Prefabrik 80m² - Stok Fiyatı', fiyat: 3200000, aciklama: 'Sezonu kapattık, stok temizleme fiyatıyla 80m² çelik iskelet prefabrik ev. Sınırlı stok!', acil: false, indirimli: true },
  { id: 'seed_ilan_09', firmaId: 'seed_firm_03', baslik: '150m² Çelik Yapı Villa - Panoramik Cam',  fiyat: 6000000, aciklama: 'Deniz manzaralı arsa için tasarlanmış 150m² lüks çelik yapı. Panoramik cam cephe ve havuz altyapısı dahil.', acil: false, indirimli: false },

  /* ── Karadeniz Tiny House / Trabzon — 200k-600k ── */
  { id: 'seed_ilan_10', firmaId: 'seed_firm_04', baslik: 'Orman İçi Tiny House 35m² - Acil Satış',  fiyat:  220000, aciklama: 'Karadeniz ormanları içine kurmak için tasarlanmış 35m² tiny house. Kaçırılmayacak fırsat!', acil: true, indirimli: false },
  { id: 'seed_ilan_11', firmaId: 'seed_firm_04', baslik: 'Tekerlekli Tiny House - Gezici Yaşam',    fiyat:  210000, aciklama: 'Her yere taşıyabileceğiniz tekerlekli tiny house. Güneş enerjisi ve su tankı altyapısı dahil.', acil: false, indirimli: false },
  { id: 'seed_ilan_12', firmaId: 'seed_firm_04', baslik: 'Ahşap Tiny House 40m² - Karadeniz Serisi', fiyat: 250000, aciklama: 'Karadeniz mimarisi ilhamıyla, yerel ahşap kullanılmış 40m² tiny house. Özel indirimli fiyat!', acil: false, indirimli: true },

  /* ── Bursa Modüler / Bursa — 3.500 TL/m² ── */
  { id: 'seed_ilan_13', firmaId: 'seed_firm_05', baslik: '100m² Modüler Prefabrik - Tek Kat',       fiyat:  350000, aciklama: 'Geniş yaşam alanı sunan 100m² modüler prefabrik ev. 4 ay içinde teslim, temel dahil.', acil: false, indirimli: false },
  { id: 'seed_ilan_14', firmaId: 'seed_firm_05', baslik: '60m² Prefabrik Bungalov - Hızlı Teslim',  fiyat:  210000, aciklama: 'Bahçe düzenlemesi dahil 60m² bungalov tipi prefabrik ev. Komşusuz, sessiz arsa için ideal.', acil: true, indirimli: false },
  { id: 'seed_ilan_15', firmaId: 'seed_firm_05', baslik: '3+1 Prefabrik Ev 130m² - Anahtar Teslim', fiyat:  455000, aciklama: 'Komple donanımlı 3+1 prefabrik ev. Banyo, mutfak, ısıtma-soğutma sistemleri dahil.', acil: false, indirimli: false },

  /* ── Antalya Prefabrik / Antalya — 3.500 TL/m² ── */
  { id: 'seed_ilan_16', firmaId: 'seed_firm_06', baslik: 'Tatil Köyü Tipi Prefabrik Bungalov',      fiyat:  245000, aciklama: 'Tatil köyü ve kamp alanları için toplu üretim. 5 ve üzeri alımlarda ekstra indirim uygulanır.', acil: false, indirimli: true },
  { id: 'seed_ilan_17', firmaId: 'seed_firm_06', baslik: 'Yazlık Prefabrik 70m² - Deniz İklimi',    fiyat:  245000, aciklama: 'Deniz kenarı arazilere özel tasarım, tuz atmosferine dayanıklı malzeme kullanımı. Hemen teslim.', acil: false, indirimli: false },
  { id: 'seed_ilan_18', firmaId: 'seed_firm_06', baslik: 'Çift Katlı Prefabrik Villa - 5 Oda',      fiyat:  630000, aciklama: '2 katlı 5 odalı prefabrik villa. Antalya ve Muğla bölgesi için optimum iklim yalıtımı uygulanmış.', acil: false, indirimli: false },

  /* ── Konya Çelik / Konya — 40.000 TL/m² ── */
  { id: 'seed_ilan_19', firmaId: 'seed_firm_07', baslik: 'Çelik Yapı Depo + Konut Kombine - Acil',  fiyat: 4000000, aciklama: 'Alt kat depo/atölye, üst kat konut şeklinde tasarlanmış çelik yapı. Ticari-sanayi bölgeleri için ideal.', acil: true, indirimli: false },
  { id: 'seed_ilan_20', firmaId: 'seed_firm_07', baslik: '90m² Çelik Ev - İç Anadolu Serisi',       fiyat: 3600000, aciklama: 'İç Anadolu iklim koşullarına göre optimize edilmiş 90m² çelik ev. Güçlü ısı yalıtımı.', acil: false, indirimli: false },
  { id: 'seed_ilan_21', firmaId: 'seed_firm_07', baslik: 'Çelik Çerçeveli Karma Prefabrik 80m²',    fiyat: 3200000, aciklama: 'Çelik taşıyıcı sistem üzerine prefabrik panel dolgu. Hem sağlam hem ekonomik çözüm!', acil: false, indirimli: true },

  /* ── Adana Konteyner / Adana — 150k-450k ── */
  { id: 'seed_ilan_22', firmaId: 'seed_firm_08', baslik: 'Lüks Konteyner Ev 2+1 - Anahtar Teslim',  fiyat:  350000, aciklama: 'High-cube konteynerden dönüştürülmüş 2+1 lüks konut. Açık mutfak, geniş banyo, ebeveyn odası.', acil: false, indirimli: false },
  { id: 'seed_ilan_23', firmaId: 'seed_firm_08', baslik: 'Konteyner Yurt Ünitesi - Öğrenci Kampüsü', fiyat: 160000, aciklama: 'Öğrenci kampüsleri ve yurtlar için ekonomik konteyner yaşam ünitesi. 8 veya 2 kişilik oda düzeni.', acil: false, indirimli: false },
  { id: 'seed_ilan_24', firmaId: 'seed_firm_08', baslik: 'Bahçeli Konteyner Villa - Çukurova',      fiyat:  440000, aciklama: 'Çukurova ovasına özgü geniş bahçe tasarımıyla konteyner villa. Sıcak iklime uygun yalıtım.', acil: false, indirimli: false },

  /* ── Gaziantep Yapı / Gaziantep — 300k-900k ── */
  { id: 'seed_ilan_25', firmaId: 'seed_firm_09', baslik: 'Yığma Ahşap Bungalov 90m² - Kuzey Çamı',  fiyat:  420000, aciklama: 'Kuzey Amerika çamından üretilen yığma ahşap bungalov. Doğal ve sağlıklı yaşam arayanlar için.', acil: false, indirimli: false },
  { id: 'seed_ilan_26', firmaId: 'seed_firm_09', baslik: 'Ahşap Yazlık Bungalov - Söküp Taşınabilir', fiyat: 320000, aciklama: 'Küçük ama fonksiyonel ahşap yazlık ev. İç tasarım tamamen doğal ahşap. Söküp taşınabilir.', acil: false, indirimli: false },
  { id: 'seed_ilan_27', firmaId: 'seed_firm_09', baslik: 'Kütük Ev - El İşçiliği Premium',          fiyat:  650000, aciklama: 'El işçiliğiyle üretilen premium kütük ev. Her parça özel kesim, doğal kireç sıva ile iç yüzey.', acil: false, indirimli: false },

  /* ── Mersin Modüler / Mersin — 200k-600k ── */
  { id: 'seed_ilan_28', firmaId: 'seed_firm_10', baslik: 'Deniz Manzaralı Tiny House 40m²',         fiyat:  290000, aciklama: 'Akdeniz kıyılarına özel tasarım, tüm odalardan deniz görünen tiny house. Teraslı ve pergoleli.', acil: false, indirimli: false },
  { id: 'seed_ilan_29', firmaId: 'seed_firm_10', baslik: 'Söküp Takılabilir Tiny House - Mobil',    fiyat:  210000, aciklama: 'Tamamen söküp başka bir yere kurulabilen modüler tiny house. Arazi almadan özgür yaşam!', acil: false, indirimli: false },
  { id: 'seed_ilan_30', firmaId: 'seed_firm_10', baslik: 'Lüks Tiny House 45m² - Plunge Havuzlu',   fiyat:  380000, aciklama: 'Plunge havuzu ve güneş terası dahil 45m² lüks tiny house. Mersin ve çevre ilçelere ücretsiz montaj.', acil: false, indirimli: false },
];

/* ══════════════════════════════════════════════════════════
   TALEPLER — 15 adet
══════════════════════════════════════════════════════════ */
const TALEPLER = [
  { sehir: 'İstanbul', ilce: 'Kadıköy',     kategori: 'prefabrik',           butce: '250k_ustu', metrekare: '80-100m²', teslimTarihi: futureDays(90),  ad: 'Mehmet Yılmaz',  telefon: '0555 111 22 33', email: 'mehmet.y@example.com',   status: 'beklemede', aciklama: 'Kadıköy\'de arsama prefabrik ev yaptırmak istiyorum. Anahtar teslim teklif bekliyorum.' },
  { sehir: 'Ankara',   ilce: 'Çankaya',     kategori: 'celik-yapilar',        butce: '100k_250k', metrekare: '60-80m²',  teslimTarihi: futureDays(60),  ad: 'Ayşe Kaya',      telefon: '0544 222 33 44', email: 'ayse.k@example.com',     status: 'iletildi',  aciklama: 'Çelik yapı ev için detaylı teklif almak istiyorum. Çankaya\'da arazim var.' },
  { sehir: 'İzmir',    ilce: 'Urla',        kategori: 'tiny-house',           butce: '50k_100k',  metrekare: '30-40m²',  teslimTarihi: futureDays(45),  ad: 'Can Demir',      telefon: '0532 333 44 55', email: 'can.d@example.com',      status: 'beklemede', aciklama: 'Urla\'da yazlık tiny house arıyorum, hafta sonları kullanacağım.' },
  { sehir: 'Bursa',    ilce: 'Mudanya',     kategori: 'yasam-konteynerleri',  butce: '50k_100k',  metrekare: '20-30m²',  teslimTarihi: futureDays(30),  ad: 'Zeynep Çelik',  telefon: '0506 444 55 66', email: 'zeynep.c@example.com',   status: 'beklemede', aciklama: 'Konteyner dönüşüm projesi, ofis amaçlı kullanmak istiyorum.' },
  { sehir: 'Antalya',  ilce: 'Kemer',       kategori: 'prefabrik',            butce: '250k_ustu', metrekare: '120-150m²',teslimTarihi: futureDays(120), ad: 'Hasan Öztürk',  telefon: '0542 555 66 77', email: 'hasan.o@example.com',    status: 'iletildi',  aciklama: 'Tatil için büyük prefabrik ev istiyorum. Kemer bölgesinde arsam var.' },
  { sehir: 'Trabzon',  ilce: 'Araklı',      kategori: 'ahsap-yapilar',        butce: '100k_250k', metrekare: '50-60m²',  teslimTarihi: futureDays(90),  ad: 'Fatma Arslan',  telefon: '0533 666 77 88', email: 'fatma.a@example.com',    status: 'beklemede', aciklama: 'Araklı\'da doğayla iç içe ahşap bir ev yaptırmak istiyorum.' },
  { sehir: 'Konya',    ilce: 'Selçuklu',    kategori: 'celik-yapilar',        butce: '100k_250k', metrekare: '80-100m²', teslimTarihi: futureDays(75),  ad: 'Ali Şahin',     telefon: '0507 777 88 99', email: 'ali.s@example.com',      status: 'beklemede', aciklama: 'Tarla kenarındaki arazime çelik yapı ev düşünüyorum.' },
  { sehir: 'Adana',    ilce: 'Seyhan',      kategori: 'yasam-konteynerleri',  butce: '50k_100k',  metrekare: '30-50m²',  teslimTarihi: futureDays(45),  ad: 'Elif Yıldız',   telefon: '0552 888 99 00', email: 'elif.y@example.com',     status: 'iletildi',  aciklama: 'Konteyner ev proje danışmanlığı ve fiyat teklifi istiyorum.' },
  { sehir: 'Gaziantep',ilce: 'Şahinbey',   kategori: 'prefabrik',            butce: '50k_100k',  metrekare: '50-60m²',  teslimTarihi: futureDays(60),  ad: 'Mustafa Koç',   telefon: '0543 999 00 11', email: 'mustafa.k@example.com',  status: 'beklemede', aciklama: 'Ekonomik prefabrik ev seçeneklerini merak ediyorum, fiyat teklifi alabilir miyim?' },
  { sehir: 'Mersin',   ilce: 'Mezitli',     kategori: 'tiny-house',           butce: '50k_100k',  metrekare: '30-35m²',  teslimTarihi: futureDays(60),  ad: 'Selin Aydın',   telefon: '0537 100 11 22', email: 'selin.a@example.com',    status: 'beklemede', aciklama: 'Mersin\'de deniz kenarında tiny house yaşamı planlıyorum.' },
  { sehir: 'İstanbul', ilce: 'Şile',        kategori: 'ahsap-yapilar',        butce: '100k_250k', metrekare: '70-80m²',  teslimTarihi: futureDays(100), ad: 'Berk Güneş',    telefon: '0545 200 22 33', email: 'berk.g@example.com',     status: 'iletildi',  aciklama: 'Şile\'de ağaç evim olsun istiyorum, doğaya yakın bir yaşam hayal ediyorum.' },
  { sehir: 'Ankara',   ilce: 'Kızılcahamam',kategori: 'tiny-house',           butce: '50k_alti',  metrekare: '20-25m²',  teslimTarihi: futureDays(30),  ad: 'Pınar Yurt',    telefon: '0501 300 33 44', email: 'pinar.y@example.com',    status: 'beklemede', aciklama: 'Bütçem kısıtlı, en uygun fiyatlı tiny house seçeneğini arıyorum.' },
  { sehir: 'Balıkesir',ilce: 'Ayvalık',    kategori: 'prefabrik',            butce: '100k_250k', metrekare: '60-70m²',  teslimTarihi: futureDays(80),  ad: 'Taner Bozkurt', telefon: '0530 400 44 55', email: 'taner.b@example.com',    status: 'beklemede', aciklama: 'Ayvalık\'ta yazlık prefabrik ev yaptırmak istiyorum.' },
  { sehir: 'Muğla',    ilce: 'Bodrum',      kategori: 'yasam-konteynerleri',  butce: '250k_ustu', metrekare: '60-80m²',  teslimTarihi: futureDays(90),  ad: 'Deniz Kaplan',  telefon: '0555 500 55 66', email: 'deniz.k@example.com',    status: 'iletildi',  aciklama: 'Bodrum\'da lüks konteyner ev projesi için teklif bekliyorum.' },
  { sehir: 'Eskişehir',ilce: 'Tepebaşı',   kategori: 'celik-yapilar',        butce: '100k_250k', metrekare: '70-90m²',  teslimTarihi: futureDays(75),  ad: 'Gökhan Erdem',  telefon: '0541 600 66 77', email: 'gokhan.e@example.com',   status: 'beklemede', aciklama: 'Tepebaşı\'ndaki arazime çelik yapı ev yaptırmak istiyorum.' },
];

/* ══════════════════════════════════════════════════════════
   QUOTES (TEKLİFLER) — 10 adet
══════════════════════════════════════════════════════════ */
const QUOTES = [
  { ilanId: 'seed_ilan_01', ilanBaslik: '80m² Prefabrik Villa - Anahtar Teslim',         firmaId: 'seed_firm_01', firmaAdi: 'Anadolu Prefabrik',    musteriAd: 'Ahmet Koç',       musteriEmail: 'ahmet.koc@example.com',   mesaj: '80m² prefabrik villa için teklif almak istiyorum. Ankara\'da arazim var, ne zaman müsaitsiniz?',               fiyatTeklifi: '395.000 TL', durum: 'beklemede' },
  { ilanId: 'seed_ilan_05', ilanBaslik: '40 Feet Yaşam Konteyneri - 2+1',                firmaId: 'seed_firm_02', firmaAdi: 'İstanbul Konteyner',   musteriAd: 'Elif Demirtaş',   musteriEmail: 'elif.d@example.com',      mesaj: '40 feet konteyner için görüşebilir miyiz? İstanbul Anadolu yakasına kurulum yapıyor musunuz?',                fiyatTeklifi: '330.000 TL', durum: 'incelendi' },
  { ilanId: 'seed_ilan_07', ilanBaslik: 'Çift Katlı Çelik Ev - 120m²',                  firmaId: 'seed_firm_03', firmaAdi: 'Ege Çelik Yapı',       musteriAd: 'Serhan Yüce',     musteriEmail: 'serhan.y@example.com',    mesaj: 'Çift katlı çelik ev projesi için detaylı görüşme talep ediyorum. Zemin etüdü dahil fiyat verebilir misiniz?', fiyatTeklifi: '700.000 TL', durum: 'beklemede' },
  { ilanId: 'seed_ilan_10', ilanBaslik: 'Orman İçi Tiny House 35m² - Acil Satış',       firmaId: 'seed_firm_04', firmaAdi: 'Karadeniz Tiny House', musteriAd: 'Meral Tan',        musteriEmail: 'meral.t@example.com',     mesaj: 'Orman içi tiny house için acil teklif gerekiyor, bu hafta karar vereceğim. Elektrik bağlantısı nasıl çözülüyor?', fiyatTeklifi: '200.000 TL', durum: 'beklemede' },
  { ilanId: 'seed_ilan_13', ilanBaslik: '100m² Modüler Prefabrik - Tek Kat',             firmaId: 'seed_firm_05', firmaAdi: 'Bursa Modüler',         musteriAd: 'Uğur Özkan',      musteriEmail: 'ugur.o@example.com',      mesaj: '100m² modüler prefabrik hakkında daha fazla bilgi almak istiyorum. Temel fiyata dahil mi?',                   fiyatTeklifi: '540.000 TL', durum: 'incelendi' },
  { ilanId: 'seed_ilan_16', ilanBaslik: 'Tatil Köyü Tipi Prefabrik Bungalov',            firmaId: 'seed_firm_06', firmaAdi: 'Antalya Prefabrik',    musteriAd: 'Bahar Çetin',     musteriEmail: 'bahar.c@example.com',     mesaj: 'Tatil köyümüz için 10 adet bungalov düşünüyoruz, toplu alım fiyatı verebilir misiniz?',                       fiyatTeklifi: '2.800.000 TL', durum: 'görüşülüyor' },
  { ilanId: 'seed_ilan_19', ilanBaslik: 'Çelik Yapı Depo + Konut Kombine - Acil',       firmaId: 'seed_firm_07', firmaAdi: 'Konya Çelik',          musteriAd: 'Onur Soylu',      musteriEmail: 'onur.s@example.com',      mesaj: 'Depo ve konut kombine yapı için randevu almak istiyorum. Konya Karatay\'da 500m² arazim var.',                 fiyatTeklifi: '500.000 TL', durum: 'beklemede' },
  { ilanId: 'seed_ilan_22', ilanBaslik: 'Lüks Konteyner Ev 2+1 - Anahtar Teslim',       firmaId: 'seed_firm_08', firmaAdi: 'Adana Konteyner',      musteriAd: 'Sibel Arslan',    musteriEmail: 'sibel.a@example.com',     mesaj: 'Lüks konteyner evi görmek istiyorum. Adana\'da bir showroom ziyareti mümkün mü?',                              fiyatTeklifi: '400.000 TL', durum: 'incelendi' },
  { ilanId: 'seed_ilan_25', ilanBaslik: 'Yığma Ahşap Bungalov 90m² - Kuzey Çamı',       firmaId: 'seed_firm_09', firmaAdi: 'Gaziantep Yapı',       musteriAd: 'Kadir Yıldırım', musteriEmail: 'kadir.y@example.com',     mesaj: 'Yığma ahşap ev projesini detaylı değerlendirmek istiyorum. Projeye montaj dahil mi?',                         fiyatTeklifi: '450.000 TL', durum: 'beklemede' },
  { ilanId: 'seed_ilan_28', ilanBaslik: 'Deniz Manzaralı Tiny House 40m²',               firmaId: 'seed_firm_10', firmaAdi: 'Mersin Modüler',        musteriAd: 'Nazlı Şahin',    musteriEmail: 'nazli.s@example.com',     mesaj: 'Deniz manzaralı tiny house için teklif verir misiniz? Mersin Mezitli\'de 300m² arazim var.',                   fiyatTeklifi: '275.000 TL', durum: 'görüşülüyor' },
];

/* ══════════════════════════════════════════════════════════
   SEED — her çalıştırmada benzersiz ID üretir (üst üste eklenebilir)
══════════════════════════════════════════════════════════ */
export async function seedFirestore(): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Seed işlemi için giriş yapmalısınız.');
  }
  const uid = currentUser.uid;

  const ts   = Date.now();
  const rand = Math.random().toString(36).substr(2, 5);
  const mkId = (prefix: string, n: number) =>
    `seed_${prefix}_${ts}_${rand}_${String(n).padStart(2, '0')}`;

  console.log('[seed] Seed başladı...', { ts, rand, uid });

  /* Statik id → dinamik id haritaları */
  const firmIdMap: Record<string, string> = {};
  FIRMS.forEach(({ id }, i) => { firmIdMap[id] = mkId('firm', i + 1); });

  const ilanIdMap: Record<string, string> = {};
  ILANLAR.forEach(({ id }, i) => { ilanIdMap[id] = mkId('ilan', i + 1); });

  /* 1. Firms — userId olarak giriş yapan admin'in UID'sini kullan (firestore.rules uyumu) */
  const firmBatch = writeBatch(db);
  FIRMS.forEach(({ id, ...data }, i) => {
    firmBatch.set(doc(db, 'firms', firmIdMap[id]), {
      ...data,
      verified: true,
      status: 'approved',
      userId: uid,
      _seed: true,
      createdAt: daysAgo(90 - i * 5),
    });
  });
  await firmBatch.commit();
  console.log('[seed] firms yazıldı (10 adet)');

  /* 2. İlanlar — firmaId olarak admin UID'sini kullan (firestore.rules: firmaId == auth.uid) */
  const ilanBatch = writeBatch(db);
  ILANLAR.forEach(({ id, firmaId, ...data }, i) => {
    const firm = FIRMS.find((f) => f.id === firmaId)!;
    ilanBatch.set(doc(db, 'ilanlar', ilanIdMap[id]), {
      ...data,
      kategori: firm.category,
      kategoriSlug: firm.kategoriSlug,
      sehir: firm.sehir,
      firmaAdi: firm.name,
      firmaId: uid,
      firmaDogrulanmis: true,
      gorseller: IMGS[firm.kategoriSlug] ?? IMGS['prefabrik'],
      status: 'aktif',
      _seed: true,
      tarih: daysAgo(60 - Math.floor(i * 1.5)),
    });
  });
  await ilanBatch.commit();
  console.log('[seed] ilanlar yazıldı (30 adet)');

  /* 3. Talepler */
  const talepBatch = writeBatch(db);
  TALEPLER.forEach((t, i) => {
    talepBatch.set(doc(db, 'taleplar', mkId('talep', i + 1)), {
      ...t,
      fotograflar: [],
      firmaGonderilenler: t.status === 'iletildi'
        ? [firmIdMap[FIRMS[i % FIRMS.length].id]]
        : [],
      firmaKabulEdenler: [],
      _seed: true,
      tarih: daysAgo(45 - i * 2),
    });
  });
  await talepBatch.commit();
  console.log('[seed] talepler yazıldı (15 adet)');

  /* 4. Quotes */
  const quoteBatch = writeBatch(db);
  QUOTES.forEach((q, i) => {
    quoteBatch.set(doc(db, 'quotes', mkId('quote', i + 1)), {
      ...q,
      firmaId: firmIdMap[q.firmaId],
      ilanId:  ilanIdMap[q.ilanId],
      _seed: true,
      tarih: daysAgo(20 - i),
    });
  });
  await quoteBatch.commit();
  console.log('[seed] quotes yazıldı (10 adet)');

  /* 5. Blog içerikleri — "blog/{slug}" koleksiyonu */
  const blogBatch = writeBatch(db);
  BLOG_POSTS.forEach((post) => {
    const icerik = BLOG_ICERIK[post.slug] ?? '';
    blogBatch.set(doc(db, 'blog', post.slug), {
      slug:         post.slug,
      baslik:       post.baslik,
      ozet:         post.ozet,
      kategori:     post.kategori,
      tarih:        post.tarih,
      okumaSuresi:  post.okumaSuresi,
      yazar:        post.yazar,
      kapakGorseli: post.kapakGorseli,
      icerik,
      _seed: true,
    });
  });
  await blogBatch.commit();
  console.log('[seed] blog yazıldı (8 adet)');

  /* ── Haberler ───────────────────────────────────────── */
  const HABERLER = [
    {
      id: 'seed_haber_01',
      baslik: "Türkiye'de prefabrik ev talebi 2026'da yüzde 40 arttı",
      kaynak: 'Anadolu Ajansı',
      kaynakUrl: 'https://www.aa.com.tr',
      ozet: "Türkiye İstatistik Kurumu verilerine göre 2026 yılının ilk çeyreğinde prefabrik konut talebinde geçen yılın aynı dönemine kıyasla yüzde 40'lık artış kaydedildi. Uzmanlar, bu artışı yükselen inşaat maliyetleri ve hızlı teslim avantajına bağlıyor. Sektör temsilcileri, talebin özellikle Marmara ve Ege bölgelerinde yoğunlaştığını belirtiyor.",
      kategori: 'prefabrik',
      bolge: 'turkiye',
      gorselUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=500&fit=crop',
      yayinda: true,
      _seed: true,
    },
    {
      id: 'seed_haber_02',
      baslik: 'Deprem bölgelerinde modüler yapı kullanımı zorunlu hale gelebilir',
      kaynak: 'Hürriyet',
      kaynakUrl: 'https://www.hurriyet.com.tr',
      ozet: "Türk Mühendis ve Mimar Odaları Birliği'nin hazırladığı rapora göre yüksek deprem riskli bölgelerde çelik karkas prefabrik yapıların zorunlu tutulması için yasal düzenleme yapılması gündemdedir. Rapor, 1999 Marmara Depremi sonrası yapılan araştırmalara dayanarak çelik yapıların beton alternatiflerine göre üç kat daha iyi sismik performans gösterdiğini ortaya koyuyor.",
      kategori: 'genel',
      bolge: 'turkiye',
      gorselUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&h=500&fit=crop',
      yayinda: true,
      _seed: true,
    },
    {
      id: 'seed_haber_03',
      baslik: 'Konteyner evler Avrupa\'da lüks konut alternatifi oluyor',
      kaynak: 'Reuters',
      kaynakUrl: 'https://www.reuters.com',
      ozet: "Avrupa'nın önde gelen şehirlerinde dönüştürülmüş konteyner evler, sürdürülebilirlik ve tasarım odaklı bir yaşam alanı olarak yüksek talep görüyor. Amsterdam, Berlin ve İsveç'in büyük kentlerinde metrekare başına 5.000 euro'yu aşan fiyatlarla satışa sunulan konteyner villa projeleri, geleneksel konut piyasasını zorluyor.",
      kategori: 'konteyner',
      bolge: 'dunya',
      gorselUrl: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&h=500&fit=crop',
      yayinda: true,
      _seed: true,
    },
    {
      id: 'seed_haber_04',
      baslik: 'Tiny house yasası: İmar planlarında küçük ev düzenlemesi geliyor',
      kaynak: 'Sabah',
      kaynakUrl: 'https://www.sabah.com.tr',
      ozet: "Çevre, Şehircilik ve İklim Değişikliği Bakanlığı, 50 metrekarenin altındaki seyyar ve sabit tiny house yapılarını düzenleyen yasal çerçeve üzerinde çalışmalar yürüttüğünü açıkladı. Yeni düzenlemeyle tekerlekli tiny house'ların belediye sınırları içindeki park ve kamp alanlarında konumlandırılması için özel izin rejimi getirilmesi planlanıyor.",
      kategori: 'tiny-house',
      bolge: 'turkiye',
      gorselUrl: 'https://images.unsplash.com/photo-1501183638710-841dd1904471?w=800&h=500&fit=crop',
      yayinda: true,
      _seed: true,
    },
    {
      id: 'seed_haber_05',
      baslik: 'Çelik yapı sektörü ihracatta rekor kırdı',
      kaynak: 'İMSAD',
      kaynakUrl: 'https://www.imsad.org',
      ozet: "İnşaat Malzemesi Sanayicileri Derneği verilerine göre 2025 yılında Türkiye'nin çelik yapı ihracatı bir önceki yıla kıyasla yüzde 28 artarak 1,4 milyar dolar seviyesine ulaştı. Prefabrik çelik yapı ve modüler konut sistemleri, ihracatta en büyük payı oluştururken Orta Doğu ve Afrika pazarlarındaki talep yüzde 60 büyüdü.",
      kategori: 'celik-yapi',
      bolge: 'turkiye',
      gorselUrl: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&h=500&fit=crop',
      yayinda: true,
      _seed: true,
    },
    {
      id: 'seed_haber_06',
      baslik: "Modüler yapı sektörü 2026 Türkiye inşaat fuarında büyük ilgi gördü",
      kaynak: 'İnşaat Dünyası',
      kaynakUrl: 'https://www.insaatdunyasi.com.tr',
      ozet: "İstanbul'da düzenlenen Yapı Fuarı 2026'da prefabrik, konteyner ve tiny house üreticileri en büyük ilgiyi çeken stantlar arasında yer aldı. Fuar direktörü, bu yılki katılımın yüzde 35 artışla rekor kırdığını açıkladı. ModülerPazar'ın fuar organizasyon ortağı olarak yer aldığı etkinlikte birden fazla proje yatırım anlaşması imzalandı.",
      kategori: 'genel',
      bolge: 'turkiye',
      gorselUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=500&fit=crop',
      yayinda: true,
      _seed: true,
    },
  ];

  const haberlerBatch = writeBatch(db);
  HABERLER.forEach((haber) => {
    haberlerBatch.set(doc(db, 'haberler', haber.id), {
      ...haber,
      tarih: daysAgo(Math.floor(Math.random() * 30)),
    });
  });
  await haberlerBatch.commit();
  console.log('[seed] haberler yazıldı (6 adet)');

  /* ── Haber Kaynakları ────────────────────────────────── */
  const KAYNAKLAR = [
    { id: 'seed_kaynak_01', ad: 'Hürriyet Prefabrik Haberleri', url: 'https://www.hurriyet.com.tr/haberleri/prefabrik', bolge: 'turkiye', aktif: true, _seed: true },
    { id: 'seed_kaynak_02', ad: 'Türkiye Prefabrik Birliği',    url: 'https://www.prefab.org.tr',                       bolge: 'turkiye', aktif: true, _seed: true },
    { id: 'seed_kaynak_03', ad: 'İMSAD',                        url: 'https://www.imsad.org',                           bolge: 'turkiye', aktif: true, _seed: true },
    { id: 'seed_kaynak_04', ad: 'Modular Building Institute',   url: 'https://www.modular.org/press-releases',          bolge: 'dunya',   aktif: true, _seed: true },
    { id: 'seed_kaynak_05', ad: 'ArchDaily Modular',            url: 'https://www.archdaily.com/tag/modular-and-prefabricated', bolge: 'dunya', aktif: true, _seed: true },
    { id: 'seed_kaynak_06', ad: 'Construction Dive',            url: 'https://www.constructiondive.com',                bolge: 'dunya',   aktif: true, _seed: true },
    { id: 'seed_kaynak_07', ad: 'HousingWire',                  url: 'https://www.housingwire.com',                     bolge: 'dunya',   aktif: true, _seed: true },
    { id: 'seed_kaynak_08', ad: 'Dwell Prefab',                 url: 'https://www.dwell.com/collection/prefab',         bolge: 'dunya',   aktif: true, _seed: true },
  ];

  const kaynakBatch = writeBatch(db);
  KAYNAKLAR.forEach((k) => {
    kaynakBatch.set(doc(db, 'haberKaynaklari', k.id), {
      ...k,
      eklenmeTarihi: daysAgo(0),
    });
  });
  await kaynakBatch.commit();
  console.log('[seed] haberKaynaklari yazıldı (8 adet)');

  console.log('[seed] Tamamlandı ✓');
}

/* ══════════════════════════════════════════════════════════
   CLEAR — "seed_" prefix'li tüm ID'leri getDocs ile bulup siler
══════════════════════════════════════════════════════════ */
export async function clearSeedData(): Promise<void> {
  console.log('[clear] Temizleme başladı...');

  // Mevcut kullanıcı UID'ini logla
  const currentUser = auth.currentUser;
  console.log('[clear] Firebase Auth currentUser:', currentUser
    ? { uid: currentUser.uid, email: currentUser.email }
    : null,
  );

  // Admins koleksiyonundaki dokümanı kontrol et
  if (currentUser) {
    const adminDocRef = doc(db, 'admins', currentUser.uid);
    const adminSnap = await getDoc(adminDocRef);
    console.log('[clear] admins/' + currentUser.uid + ' exists:', adminSnap.exists());
    if (adminSnap.exists()) {
      console.log('[clear] admins dokümanı:', adminSnap.data());
    }
  }

  const colls = ['firms', 'ilanlar', 'taleplar', 'quotes', 'blog', 'haberler', 'haberKaynaklari'] as const;
  for (const coll of colls) {
    try {
      const snap = await getDocs(query(collection(db, coll), where('_seed', '==', true)));
      if (snap.empty) {
        console.log(`[clear] ${coll}: silinecek doküman yok`);
        continue;
      }
      const batch = writeBatch(db);
      snap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
      console.log(`[clear] ${coll} temizlendi (${snap.size} adet)`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[clear] ${coll} HATA:`, msg);
      throw new Error(`${coll} temizlenemedi: ${msg}`);
    }
  }

  console.log('[clear] Tamamlandı ✓');
}
