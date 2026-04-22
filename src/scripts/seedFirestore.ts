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
  ozellikler: Record<string, string>;
}

const ILANLAR: IlanSeed[] = [
  /* ── Anadolu Prefabrik / Ankara ── */
  {
    id: 'seed_ilan_01', firmaId: 'seed_firm_01',
    baslik: '80m² Prefabrik Villa - Anahtar Teslim',
    fiyat: 280000, acil: false, indirimli: false,
    aciklama: 'Fabrikada üretilmiş, anahtar teslim 80m² prefabrik villa. Çift cam, ısı yalıtımlı dış cephe ve kombi altyapısı dahildir. Ankara ve çevre illere 60 gün içinde kurulum garantisi sunulmaktadır. Temel betonu fiyata dahildir.',
    ozellikler: { metrekare: '80', odaSayisi: '2+1', malzeme: 'EPS sandviç panel', teslimSuresi: '60 gün', katSayisi: '1', yalitim: 'Isı + ses yalıtımı' },
  },
  {
    id: 'seed_ilan_02', firmaId: 'seed_firm_01',
    baslik: '120m² Prefabrik Müstakil Ev - 3+1',
    fiyat: 420000, acil: false, indirimli: false,
    aciklama: 'Geniş 3+1 müstakil prefabrik ev. Yerden ısıtma altyapısı, klima tesisat çıkışları, ön balkon ve arka teras standart olarak sunulmaktadır. İç mekan yüksekliği 2,80 metre olup ferah bir yaşam alanı sağlar. Mutfak dolapları ve banyo seramikleri fiyata dahildir.',
    ozellikler: { metrekare: '120', odaSayisi: '3+1', malzeme: 'Çelik karkas + EPS panel', teslimSuresi: '75 gün', katSayisi: '1', yalitim: 'Dış cephe taş yünü', bahce: 'Ön bahçe düzenlemesi dahil' },
  },
  {
    id: 'seed_ilan_03', firmaId: 'seed_firm_01',
    baslik: '50m² Yazlık Prefabrik - 45 Gün Teslim',
    fiyat: 175000, acil: true, indirimli: false,
    aciklama: 'Yazlık ve tatil amaçlı kompakt prefabrik yapı. 45 günde teslim garantisi verilmektedir. Açık plan mutfak-salon, 1 yatak odası ve duşakabin banyodan oluşur. Temel hariç fiyattır, isteğe bağlı güneş paneli paketi eklenebilir.',
    ozellikler: { metrekare: '50', odaSayisi: '1+1', malzeme: 'Sandviç panel', teslimSuresi: '45 gün', katSayisi: '1', yalitim: 'Standart EPS yalıtım' },
  },

  /* ── İstanbul Konteyner / İstanbul ── */
  {
    id: 'seed_ilan_04', firmaId: 'seed_firm_02',
    baslik: '20 Feet Konteyner Ofis - Hazır Teslimat',
    fiyat: 180000, acil: false, indirimli: true,
    aciklama: 'Komple düzenlenmiş 20 feet konteyner ofis. Split klima, LED aydınlatma ve elektrik panosu kurulu halde teslim edilir. Şantiye, fuar alanı veya bahçe ofisi olarak kullanılabilir. İstanbul içi nakliye ücretsizdir.',
    ozellikler: { metrekare: '15', malzeme: 'Cor-Ten çelik konteyner', teslimSuresi: '15 gün', yalitim: 'Poliüretan sprey yalıtım', elektrik: 'Komple tesisat + pano', klima: 'Split klima dahil' },
  },
  {
    id: 'seed_ilan_05', firmaId: 'seed_firm_02',
    baslik: '40 Feet Yaşam Konteyneri - 2+1',
    fiyat: 320000, acil: false, indirimli: false,
    aciklama: '40 feet high-cube konteynerden dönüştürülmüş 2+1 yaşam alanı. Mutfak tezgahı, aspiratör, kombi, duşakabin ve seramik zemin tam donanımlı olarak sunulur. Tavan yüksekliği 2,70 metre olup standart konteynerlere kıyasla daha ferah bir iç mekan sağlar.',
    ozellikler: { metrekare: '30', odaSayisi: '2+1', malzeme: 'High-cube çelik konteyner', teslimSuresi: '30 gün', yalitim: 'Taş yünü + alçıpan kaplama', tesisat: 'Kombi + sıhhi tesisat komple' },
  },
  {
    id: 'seed_ilan_06', firmaId: 'seed_firm_02',
    baslik: 'Çift Konteyner Villa - Geniş Bahçeli',
    fiyat: 420000, acil: true, indirimli: false,
    aciklama: 'İki adet 40 feet konteynerin birleşiminden oluşan lüks villa tipi yaşam alanı. Geniş açık teras ve özel bahçe düzenlemesiyle doğayla iç içe bir yaşam sunar. Amerikan mutfak, jakuzi banyosu ve panoramik pencere sistemi standart donanımdadır.',
    ozellikler: { metrekare: '60', odaSayisi: '3+1', malzeme: 'Çift konteyner birleşim', teslimSuresi: '45 gün', yalitim: 'Çift kat yalıtım sistemi', teras: '25m² açık teras', bahce: 'Peyzaj dahil' },
  },

  /* ── Ege Çelik Yapı / İzmir ── */
  {
    id: 'seed_ilan_07', firmaId: 'seed_firm_03',
    baslik: 'Çift Katlı Çelik Ev - 120m²',
    fiyat: 1850000, acil: false, indirimli: false,
    aciklama: 'Çelik iskelet sistem üzerine inşa edilmiş 120m² çift katlı müstakil ev. 8. derece deprem bölgesine uygun statik hesaplar yapılmıştır. Alt kat salon, mutfak ve misafir WC; üst kat 3 yatak odası ve ebeveyn banyosundan oluşur. Dış cephe siding kaplama ve çatı kiremit dahildir.',
    ozellikler: { metrekare: '120', odaSayisi: '3+1', malzeme: 'Hafif çelik iskelet (galvanizli)', teslimSuresi: '90 gün', katSayisi: '2', yalitim: 'Taş yünü + OSB + siding', deprem: '8. derece dayanıklı' },
  },
  {
    id: 'seed_ilan_08', firmaId: 'seed_firm_03',
    baslik: 'Çelik İskelet Prefabrik 80m² - Stok Fiyatı',
    fiyat: 1350000, acil: false, indirimli: true,
    aciklama: 'Sezon sonu stok temizleme kampanyası kapsamında 80m² çelik iskelet prefabrik ev. Galvanizli çelik profiller, dış cephe EPS yalıtım ve iç mekan alçıpan kaplama standarttır. Sınırlı sayıda stokla teslimata hazırdır, erken sipariş avantajlıdır.',
    ozellikler: { metrekare: '80', odaSayisi: '2+1', malzeme: 'Galvanizli çelik profil', teslimSuresi: '60 gün', katSayisi: '1', yalitim: 'EPS yalıtım + alçıpan' },
  },
  {
    id: 'seed_ilan_09', firmaId: 'seed_firm_03',
    baslik: '150m² Çelik Yapı Villa - Panoramik Cam',
    fiyat: 2500000, acil: false, indirimli: false,
    aciklama: 'Deniz veya göl manzaralı arsalar için tasarlanmış 150m² lüks çelik yapı villa. Panoramik cam cephe sistemi, yerden ısıtma altyapısı ve havuz teknik odası standart olarak sunulur. Mimari proje müşterinin isteğine göre özelleştirilebilir.',
    ozellikler: { metrekare: '150', odaSayisi: '4+1', malzeme: 'Çelik iskelet + cam cephe', teslimSuresi: '120 gün', katSayisi: '2', yalitim: 'Isıcam + dış cephe yalıtım', havuz: 'Havuz altyapısı dahil', isitma: 'Yerden ısıtma' },
  },

  /* ── Karadeniz Tiny House / Trabzon ── */
  {
    id: 'seed_ilan_10', firmaId: 'seed_firm_04',
    baslik: 'Orman İçi Tiny House 35m² - Acil Satış',
    fiyat: 220000, acil: true, indirimli: false,
    aciklama: 'Karadeniz ormanları içine kurmak için tasarlanmış 35m² tiny house. Yüksek nem ve yağışa dayanıklı özel dış cephe kaplaması uygulanmıştır. Çatı katında yatak alanı, alt katta açık plan salon-mutfak ve kompakt banyo bulunur. Hemen teslime hazırdır.',
    ozellikler: { metrekare: '35', odaSayisi: '1+0 (çatı katı)', malzeme: 'Ahşap karkas + OSB', teslimSuresi: '30 gün', yalitim: 'Taş yünü + nefes alan membran', cati: 'Çatı katı yatak alanı' },
  },
  {
    id: 'seed_ilan_11', firmaId: 'seed_firm_04',
    baslik: 'Tekerlekli Tiny House - Gezici Yaşam',
    fiyat: 210000, acil: false, indirimli: false,
    aciklama: 'Her yere taşıyabileceğiniz tekerlekli tiny house. Güneş enerjisi paneli, 200 litre temiz su tankı ve gri su arıtma sistemi altyapısı standarttır. Ruhsatsız arazilere kurulabilir yapısıyla lokasyon bağımsız yaşam sunar. Toplam ağırlık 3.500 kg olup standart çekici ile taşınabilir.',
    ozellikler: { metrekare: '25', odaSayisi: '1+0', malzeme: 'Hafif çelik şasi + ahşap karkas', teslimSuresi: '45 gün', agirlik: '3.500 kg', enerji: 'Güneş paneli altyapısı', suTanki: '200 litre' },
  },
  {
    id: 'seed_ilan_12', firmaId: 'seed_firm_04',
    baslik: 'Ahşap Tiny House 40m² - Karadeniz Serisi',
    fiyat: 250000, acil: false, indirimli: true,
    aciklama: 'Karadeniz mimarisi ilhamıyla tasarlanmış, yerel ladin ahşabı kullanılmış 40m² tiny house. Geniş veranda, odun sobası bağlantısı ve çift kişilik asma kat standart olarak sunulur. Özel kampanya fiyatıyla sınırlı sayıda üretilmektedir.',
    ozellikler: { metrekare: '40', odaSayisi: '1+1 (asma kat)', malzeme: 'Ladin ahşap karkas', teslimSuresi: '40 gün', yalitim: 'Ahşap lif yalıtım levha', veranda: '8m² kapalı veranda', isitma: 'Odun sobası bağlantısı' },
  },

  /* ── Bursa Modüler / Bursa ── */
  {
    id: 'seed_ilan_13', firmaId: 'seed_firm_05',
    baslik: '100m² Modüler Prefabrik - Tek Kat',
    fiyat: 350000, acil: false, indirimli: false,
    aciklama: 'Geniş yaşam alanı sunan 100m² modüler prefabrik ev. Salon, 2 yatak odası, mutfak ve banyo düzenlemesi standarttır. Temel betonu ve bahçe peyzajı fiyata dahildir. Bursa, Yalova ve Balıkesir bölgesine 4 ay içinde teslim edilmektedir.',
    ozellikler: { metrekare: '100', odaSayisi: '2+1', malzeme: 'Çelik karkas + sandviç panel', teslimSuresi: '120 gün', katSayisi: '1', yalitim: 'EPS 10 cm dış cephe', temel: 'Radye temel dahil' },
  },
  {
    id: 'seed_ilan_14', firmaId: 'seed_firm_05',
    baslik: '60m² Prefabrik Bungalov - Hızlı Teslim',
    fiyat: 210000, acil: true, indirimli: false,
    aciklama: 'Bahçe düzenlemesi dahil 60m² bungalov tipi prefabrik ev. Tek yatak odası, geniş salon ve açık mutfak planıyla kompakt ama fonksiyonel bir yaşam sunar. Sessiz, doğayla iç içe arsalar için idealdir. 45 gün içinde anahtar teslim yapılır.',
    ozellikler: { metrekare: '60', odaSayisi: '1+1', malzeme: 'Sandviç panel', teslimSuresi: '45 gün', katSayisi: '1', yalitim: 'Standart ısı yalıtımı', bahce: 'Bahçe peyzajı dahil' },
  },
  {
    id: 'seed_ilan_15', firmaId: 'seed_firm_05',
    baslik: '3+1 Prefabrik Ev 130m² - Anahtar Teslim',
    fiyat: 455000, acil: false, indirimli: false,
    aciklama: 'Komple donanımlı 3+1 prefabrik ev. Mutfak dolapları, banyo armatürleri, kombi ve ısıtma sistemi dahil anahtar teslim sunulmaktadır. Geniş ebeveyn yatak odası, çocuk odası ve misafir odası ile aileler için idealdir. Dış cephe boyası ve çatı izolasyonu standarttır.',
    ozellikler: { metrekare: '130', odaSayisi: '3+1', malzeme: 'Çelik karkas + EPS panel', teslimSuresi: '90 gün', katSayisi: '1', yalitim: 'EPS 12 cm + çatı izolasyonu', isitma: 'Kombi + radyatör sistemi' },
  },

  /* ── Antalya Prefabrik / Antalya ── */
  {
    id: 'seed_ilan_16', firmaId: 'seed_firm_06',
    baslik: 'Tatil Köyü Tipi Prefabrik Bungalov',
    fiyat: 245000, acil: false, indirimli: true,
    aciklama: 'Tatil köyü ve kamp alanları için toplu üretim prefabrik bungalov. 5 ve üzeri alımlarda %15 ekstra indirim uygulanır. Her ünite kendi verandası, mini mutfağı ve duş banyosuyla bağımsız konaklama imkanı sunar. Antalya iklim koşullarına uygun havalandırma sistemi dahildir.',
    ozellikler: { metrekare: '45', odaSayisi: '1+1', malzeme: 'Sandviç panel', teslimSuresi: '30 gün', katSayisi: '1', yalitim: 'Isı + UV dayanımlı kaplama', veranda: '6m² ahşap veranda' },
  },
  {
    id: 'seed_ilan_17', firmaId: 'seed_firm_06',
    baslik: 'Yazlık Prefabrik 70m² - Deniz İklimi',
    fiyat: 245000, acil: false, indirimli: false,
    aciklama: 'Deniz kenarı arazilere özel tasarlanmış 70m² prefabrik yazlık ev. Tuz ve nem atmosferine dayanıklı galvanizli çelik karkas ve özel dış cephe boyası kullanılmıştır. Geniş cam yüzeylerle deniz manzarası yaşam alanına taşınır. Hemen teslime hazırdır.',
    ozellikler: { metrekare: '70', odaSayisi: '2+1', malzeme: 'Galvanizli çelik + anti-korozif panel', teslimSuresi: '45 gün', katSayisi: '1', yalitim: 'Deniz iklimine uygun özel yalıtım', pencere: 'Geniş panoramik pencereler' },
  },
  {
    id: 'seed_ilan_18', firmaId: 'seed_firm_06',
    baslik: 'Çift Katlı Prefabrik Villa - 5 Oda',
    fiyat: 630000, acil: false, indirimli: false,
    aciklama: '2 katlı 5 odalı prefabrik villa. Alt katta geniş salon, mutfak, misafir WC ve 1 yatak odası; üst katta ebeveyn süiti dahil 3 yatak odası bulunur. Antalya ve Muğla bölgesine uygun sıcak iklim yalıtımı uygulanmıştır. Dış merdivenli balkon ve teras dahildir.',
    ozellikler: { metrekare: '180', odaSayisi: '5+1', malzeme: 'Çelik karkas + kompozit panel', teslimSuresi: '120 gün', katSayisi: '2', yalitim: 'Sıcak iklim optimizasyonlu yalıtım', teras: 'Üst kat teras + balkon' },
  },

  /* ── Konya Çelik / Konya ── */
  {
    id: 'seed_ilan_19', firmaId: 'seed_firm_07',
    baslik: 'Çelik Yapı Depo + Konut Kombine - Acil',
    fiyat: 1650000, acil: true, indirimli: false,
    aciklama: 'Alt kat depo/atölye, üst kat konut olarak tasarlanmış çift fonksiyonlu çelik yapı. Ticari ve sanayi bölgelerinde hem iş hem yaşam alanı olarak kullanılabilir. Alt kat 200m² açık plan depo, üst kat 100m² 2+1 konut düzenindedir. Yük asansörü altyapısı dahildir.',
    ozellikler: { metrekare: '300', odaSayisi: '2+1 (üst kat)', malzeme: 'Ağır çelik konstrüksiyon', teslimSuresi: '150 gün', katSayisi: '2', yalitim: 'Endüstriyel yalıtım sistemi', depo: '200m² açık plan depo alanı' },
  },
  {
    id: 'seed_ilan_20', firmaId: 'seed_firm_07',
    baslik: '90m² Çelik Ev - İç Anadolu Serisi',
    fiyat: 1250000, acil: false, indirimli: false,
    aciklama: 'İç Anadolu iklim koşullarına özel optimize edilmiş 90m² çelik ev. -25°C\'ye kadar dayanıklı yalıtım sistemi, merkezi ısıtma altyapısı ve çift cam standart donanımdadır. Sert kış şartlarına karşı çatı kar yükü hesabı yapılmıştır.',
    ozellikler: { metrekare: '90', odaSayisi: '2+1', malzeme: 'Hafif çelik iskelet', teslimSuresi: '75 gün', katSayisi: '1', yalitim: '15 cm taş yünü + çift cam', isitma: 'Merkezi ısıtma altyapısı' },
  },
  {
    id: 'seed_ilan_21', firmaId: 'seed_firm_07',
    baslik: 'Çelik Çerçeveli Karma Prefabrik 80m²',
    fiyat: 950000, acil: false, indirimli: true,
    aciklama: 'Çelik taşıyıcı sistem üzerine prefabrik panel dolgu ile hem sağlam hem ekonomik bir çözüm sunar. Galvanizli çelik çerçeve 50 yıl dayanıklılık garantili olup, iç mekan panelleri istenildiğinde değiştirilebilir modüler yapıdadır. Kampanya kapsamında özel indirimli fiyatla sunulmaktadır.',
    ozellikler: { metrekare: '80', odaSayisi: '2+1', malzeme: 'Galvanizli çelik + prefabrik panel', teslimSuresi: '60 gün', katSayisi: '1', yalitim: 'EPS sandviç panel', garanti: '50 yıl çelik iskelet garantisi' },
  },

  /* ── Adana Konteyner / Adana ── */
  {
    id: 'seed_ilan_22', firmaId: 'seed_firm_08',
    baslik: 'Lüks Konteyner Ev 2+1 - Anahtar Teslim',
    fiyat: 350000, acil: false, indirimli: false,
    aciklama: 'High-cube konteynerden dönüştürülmüş 2+1 lüks konut. Açık mutfak konsepti, geniş duşakabin banyo ve ebeveyn yatak odası tam donanımlı olarak teslim edilir. İç mekan ahşap laminat zemin, dış cephe ise modern metal kaplama ile kaplanmıştır. Adana ve çevre illere kurulum hizmeti verilmektedir.',
    ozellikler: { metrekare: '35', odaSayisi: '2+1', malzeme: 'High-cube çelik konteyner', teslimSuresi: '25 gün', yalitim: 'Poliüretan + alçıpan iç kaplama', zemin: 'Ahşap laminat parke' },
  },
  {
    id: 'seed_ilan_23', firmaId: 'seed_firm_08',
    baslik: 'Konteyner Yurt Ünitesi - Öğrenci Kampüsü',
    fiyat: 160000, acil: false, indirimli: false,
    aciklama: 'Öğrenci kampüsleri ve yurtlar için ekonomik konteyner yaşam ünitesi. 2 kişilik veya 4 kişilik oda düzeni seçenekleri mevcuttur. Ortak banyo, mini mutfak köşesi ve çalışma masası standart donanımdadır. Toplu siparişlerde özel fiyatlandırma uygulanır.',
    ozellikler: { metrekare: '15', odaSayisi: 'Tek oda', malzeme: '20 feet standart konteyner', teslimSuresi: '15 gün', yalitim: 'EPS yalıtım', kapasite: '2-4 kişi' },
  },
  {
    id: 'seed_ilan_24', firmaId: 'seed_firm_08',
    baslik: 'Bahçeli Konteyner Villa - Çukurova',
    fiyat: 440000, acil: false, indirimli: false,
    aciklama: 'Çukurova ovasına özgü geniş bahçe tasarımıyla konteyner villa. Sıcak iklime uygun çift kat yalıtım ve havalandırma sistemi standarttır. L şeklinde iki konteyner birleşiminden oluşan yapı, avlu formunda özel bir yaşam alanı oluşturur. Bahçe sulama sistemi altyapısı dahildir.',
    ozellikler: { metrekare: '55', odaSayisi: '2+1', malzeme: 'Çift konteyner L-birleşim', teslimSuresi: '40 gün', yalitim: 'Çift kat yalıtım + havalandırma', bahce: 'Avlu formunda bahçe düzeni' },
  },

  /* ── Gaziantep Yapı / Gaziantep ── */
  {
    id: 'seed_ilan_25', firmaId: 'seed_firm_09',
    baslik: 'Yığma Ahşap Bungalov 90m² - Kuzey Çamı',
    fiyat: 420000, acil: false, indirimli: false,
    aciklama: 'Kuzey Amerika çamından üretilen yığma ahşap bungalov. Doğal ve sağlıklı yaşam arayanlar için ideal olan bu yapı, nefes alan ahşap duvarları sayesinde iç mekanda doğal nem dengesi sağlar. 3 yatak odası, geniş salon ve ahşap veranda standart olarak sunulur.',
    ozellikler: { metrekare: '90', odaSayisi: '3+1', malzeme: 'Kuzey çamı yığma ahşap', teslimSuresi: '90 gün', katSayisi: '1', yalitim: 'Doğal ahşap yalıtım + ara dolgu', veranda: '12m² ahşap veranda' },
  },
  {
    id: 'seed_ilan_26', firmaId: 'seed_firm_09',
    baslik: 'Ahşap Yazlık Bungalov - Söküp Taşınabilir',
    fiyat: 320000, acil: false, indirimli: false,
    aciklama: 'Söküp taşınabilir modüler ahşap yazlık bungalov. İç tasarım tamamen doğal ahşap kaplama olup, yapı istenildiğinde parçalanarak başka bir arsaya kurulabilir. Kompakt ama fonksiyonel planıyla hafta sonu kaçamakları için mükemmeldir. Montaj ve demontaj hizmeti firmamız tarafından verilir.',
    ozellikler: { metrekare: '55', odaSayisi: '1+1', malzeme: 'Modüler ahşap karkas', teslimSuresi: '45 gün', katSayisi: '1', yalitim: 'Ahşap lif yalıtım', tasinabilir: 'Söküp taşıma özelliği' },
  },
  {
    id: 'seed_ilan_27', firmaId: 'seed_firm_09',
    baslik: 'Kütük Ev - El İşçiliği Premium',
    fiyat: 650000, acil: false, indirimli: false,
    aciklama: 'El işçiliğiyle üretilen premium kütük ev. Her kütük parça özel kesim olup, geleneksel geçme tekniğiyle birleştirilmiştir. İç yüzeyler doğal kireç sıva ile kaplanmış, dış cephe emprenye işlemiyle korunmuştur. Şömine bacası, kütük merdiven ve çatı katı standart donanımdadır.',
    ozellikler: { metrekare: '110', odaSayisi: '3+1', malzeme: 'Doğal kütük (el işçiliği)', teslimSuresi: '150 gün', katSayisi: '1 + çatı katı', yalitim: 'Kütük doğal yalıtım + macun dolgu', somine: 'Taş şömine dahil' },
  },

  /* ── Mersin Modüler / Mersin ── */
  {
    id: 'seed_ilan_28', firmaId: 'seed_firm_10',
    baslik: 'Deniz Manzaralı Tiny House 40m²',
    fiyat: 290000, acil: false, indirimli: false,
    aciklama: 'Akdeniz kıyılarına özel tasarım, tüm odalardan deniz manzarası sunan 40m² tiny house. Geniş teras ve pergole sistemi standart donanımdadır. Açık plan yaşam alanı, kompakt mutfak ve duş banyosu ile minimalist ama konforlu bir yaşam sunar. Denize yakın arsalar için tuz dayanımlı malzeme kullanılmıştır.',
    ozellikler: { metrekare: '40', odaSayisi: '1+1', malzeme: 'Çelik karkas + ahşap kaplama', teslimSuresi: '35 gün', yalitim: 'Anti-korozif yalıtım', teras: '15m² teras + pergole' },
  },
  {
    id: 'seed_ilan_29', firmaId: 'seed_firm_10',
    baslik: 'Söküp Takılabilir Tiny House - Mobil',
    fiyat: 210000, acil: false, indirimli: false,
    aciklama: 'Tamamen söküp başka bir yere kurulabilen modüler tiny house. Arazi satın almadan farklı lokasyonlarda yaşam imkanı sunar. Güneş paneli, su deposu ve karavan tipi tuvalet altyapısı opsiyonel olarak eklenebilir. Hafif yapısıyla kamyonetle taşınabilir.',
    ozellikler: { metrekare: '25', odaSayisi: '1+0', malzeme: 'Hafif çelik + ahşap hibrit', teslimSuresi: '30 gün', agirlik: '2.800 kg', yalitim: 'XPS yalıtım', tasinabilir: 'Kamyonetle taşınabilir' },
  },
  {
    id: 'seed_ilan_30', firmaId: 'seed_firm_10',
    baslik: 'Lüks Tiny House 45m² - Plunge Havuzlu',
    fiyat: 380000, acil: false, indirimli: false,
    aciklama: 'Plunge havuzu ve güneş terası dahil 45m² lüks tiny house. Mersin ve çevre ilçelere ücretsiz montaj hizmeti sunulmaktadır. İç mekanda akıllı ev sistemi altyapısı, dış mekanda ahşap deck ve mini havuz standarttır. Premium segment müşteriler için tasarlanmıştır.',
    ozellikler: { metrekare: '45', odaSayisi: '1+1', malzeme: 'Çelik karkas + kompozit kaplama', teslimSuresi: '50 gün', yalitim: 'Poliüretan sprey yalıtım', havuz: 'Plunge havuz dahil', teras: '20m² güneş terası', akilliEv: 'Akıllı ev altyapısı' },
  },
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
      ozet: "Türkiye İstatistik Kurumu verilerine göre 2026 yılının ilk çeyreğinde prefabrik konut talebinde geçen yılın aynı dönemine kıyasla yüzde 40'lık artış kaydedildi.",
      icerik: "Türkiye İstatistik Kurumu (TÜİK) verilerine göre 2026 yılının ilk çeyreğinde prefabrik konut talebinde geçen yılın aynı dönemine kıyasla yüzde 40'lık artış kaydedildi. Uzmanlar, bu artışı yükselen inşaat maliyetleri ve hızlı teslim avantajına bağlıyor.\n\nSektör temsilcileri, talebin özellikle Marmara ve Ege bölgelerinde yoğunlaştığını belirtiyor. Deprem sonrası kalıcı konut ihtiyacı ve kentsel dönüşüm projeleri, prefabrik yapılara olan ilgiyi artıran temel faktörler arasında yer alıyor.\n\nPrefabrik Sanayicileri Derneği Başkanı, sektörün üretim kapasitesini iki katına çıkardığını ve 2026 sonuna kadar 50.000 yeni konut üretmeyi hedeflediklerini açıkladı. Yeni yatırımlarla birlikte istihdamın da yüzde 30 artması bekleniyor.\n\nUzmanlar, prefabrik yapıların geleneksel inşaata göre yüzde 40 daha hızlı tamamlandığını ve maliyetin yüzde 20-30 daha düşük olduğunu vurguluyor. Bu avantajlar, özellikle orta gelir grubundaki ailelerin tercihi haline geliyor.\n\nSektörün 2026 yılı sonuna kadar 5 milyar TL büyüklüğe ulaşması öngörülüyor. Hükümetin teşvik paketleri ve düşük faizli konut kredileri, büyümeyi destekleyen önemli etkenler olarak değerlendiriliyor.",
      baslikEn: "Prefabricated housing demand in Turkey surged 40 percent in 2026",
      ozetEn: "According to the Turkish Statistical Institute, prefabricated housing demand increased by 40 percent in the first quarter of 2026 compared to the same period last year.",
      icerikEn: "According to the Turkish Statistical Institute (TurkStat), prefabricated housing demand in the first quarter of 2026 surged by 40 percent compared to the same period last year. Experts attribute this increase to rising construction costs and the advantage of rapid delivery.\n\nIndustry representatives note that demand has been particularly concentrated in the Marmara and Aegean regions. The need for permanent housing after earthquakes and urban transformation projects are among the key factors driving interest in prefabricated structures.\n\nThe President of the Prefabricated Manufacturers Association announced that the sector has doubled its production capacity and aims to produce 50,000 new homes by the end of 2026. Employment is also expected to increase by 30 percent alongside new investments.\n\nExperts emphasize that prefabricated buildings are completed 40 percent faster than traditional construction and cost 20-30 percent less. These advantages are making them increasingly popular among middle-income families.\n\nThe sector is projected to reach a market size of 5 billion TL by the end of 2026. Government incentive packages and low-interest housing loans are considered key drivers supporting this growth.",
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
      ozet: "Yüksek deprem riskli bölgelerde çelik karkas prefabrik yapıların zorunlu tutulması için yasal düzenleme gündemde.",
      icerik: "Türk Mühendis ve Mimar Odaları Birliği'nin (TMMOB) hazırladığı rapora göre yüksek deprem riskli bölgelerde çelik karkas prefabrik yapıların zorunlu tutulması için yasal düzenleme yapılması gündemdedir. Rapor, 1999 Marmara Depremi sonrası yapılan araştırmalara dayanıyor.\n\nRapora göre çelik yapılar, beton alternatiflerine göre üç kat daha iyi sismik performans gösteriyor. Özellikle 7 ve üzeri büyüklükteki depremlerde çelik karkas binaların hasar oranı yüzde 90 daha düşük çıkıyor.\n\nTMMOB İnşaat Mühendisleri Odası Başkanı, düzenlemenin sadece yeni yapıları değil, mevcut binaların güçlendirilmesini de kapsayacağını belirtti. Öncelikli olarak deprem kuşağındaki 15 ilin ele alınacağı ifade edildi.\n\nSektör temsilcileri, düzenlemenin prefabrik yapı sektörüne büyük ivme kazandıracağını öngörüyor. Tahmini pazar büyüklüğünün önümüzdeki 5 yılda yüzde 300 artabileceği değerlendiriliyor.\n\nBakanlık yetkilileri, yasa taslağının 2026 yılı sonuna kadar Meclis'e sunulmasının planlandığını açıkladı. Yeni düzenleme kapsamında prefabrik yapı üreticilerine de kalite standartları ve sertifikasyon zorunluluğu getirilecek.",
      baslikEn: "Modular construction may become mandatory in earthquake zones",
      ozetEn: "A legal regulation is on the agenda to mandate steel-frame prefabricated buildings in high seismic risk zones.",
      icerikEn: "According to a report prepared by the Union of Chambers of Turkish Engineers and Architects (TMMOB), a legal regulation mandating steel-frame prefabricated buildings in high seismic risk zones is on the agenda. The report is based on research conducted after the 1999 Marmara Earthquake.\n\nAccording to the report, steel structures demonstrate three times better seismic performance compared to concrete alternatives. Particularly in earthquakes of magnitude 7 and above, the damage rate of steel-frame buildings is 90 percent lower.\n\nThe President of the TMMOB Chamber of Civil Engineers stated that the regulation would cover not only new buildings but also the retrofitting of existing structures. It was noted that 15 provinces in the earthquake belt would be addressed as a priority.\n\nIndustry representatives predict that the regulation will provide a major boost to the prefabricated construction sector. The estimated market size is expected to grow by 300 percent over the next 5 years.\n\nMinistry officials announced that the draft law is planned to be submitted to Parliament by the end of 2026. Under the new regulation, quality standards and certification requirements will also be imposed on prefabricated building manufacturers.",
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
      ozet: "Avrupa'nın önde gelen şehirlerinde dönüştürülmüş konteyner evler lüks konut alternatifi olarak yüksek talep görüyor.",
      icerik: "Avrupa'nın önde gelen şehirlerinde dönüştürülmüş konteyner evler, sürdürülebilirlik ve tasarım odaklı bir yaşam alanı olarak yüksek talep görüyor. Amsterdam, Berlin ve İsveç'in büyük kentlerinde metrekare başına 5.000 euro'yu aşan fiyatlarla satışa sunulan konteyner villa projeleri dikkat çekiyor.\n\nHollandalı mimarlık firması MVRDV, konteyner evleri lüks segmente taşıyan projelerle uluslararası ödüller kazandı. Firma, kullanılan geri dönüştürülmüş konteynerlerle karbon ayak izini yüzde 60 azalttıklarını bildiriyor.\n\nAvrupa Birliği'nin 2030 sürdürülebilirlik hedefleri kapsamında konteyner ve modüler yapılara verilen teşvikler artıyor. Almanya'da yeni inşa edilen konteyner konutlara yüzde 15 vergi indirimi uygulanıyor.\n\nTürkiye'den Avrupa'ya konteyner ev ihracatı da hız kazanıyor. Türk üreticiler, maliyet avantajı sayesinde Avrupa pazarında yüzde 20'lik paya ulaşmayı hedefliyor. İstanbul merkezli firmalar, özellikle İskandinav ülkelerine yönelik tasarım odaklı projeler geliştiriyor.\n\nSektör analistleri, konteyner ev pazarının Avrupa genelinde 2028'e kadar 3 milyar euro'ya ulaşacağını tahmin ediyor. Türkiye'nin bu pastadan aldığı payın giderek artması bekleniyor.",
      baslikEn: "Container homes are becoming a luxury housing alternative in Europe",
      ozetEn: "Converted container homes are seeing high demand as luxury housing alternatives in Europe's leading cities.",
      icerikEn: "Converted container homes are seeing high demand in Europe's leading cities as sustainability- and design-oriented living spaces. Container villa projects priced at over 5,000 euros per square meter in Amsterdam, Berlin, and major Swedish cities are drawing significant attention.\n\nDutch architecture firm MVRDV has won international awards with projects that elevated container homes to the luxury segment. The firm reports that they have reduced their carbon footprint by 60 percent through the use of recycled containers.\n\nIncentives for container and modular buildings are increasing under the European Union's 2030 sustainability goals. In Germany, a 15 percent tax reduction is applied to newly built container residences.\n\nContainer home exports from Turkey to Europe are also gaining momentum. Turkish manufacturers aim to capture a 20 percent share of the European market thanks to their cost advantage. Istanbul-based companies are developing design-focused projects particularly targeting Scandinavian countries.\n\nIndustry analysts estimate that the container home market across Europe will reach 3 billion euros by 2028. Turkey's share of this market is expected to continue growing.",
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
      ozet: "Bakanlık, 50 metrekarenin altındaki tiny house yapılarını düzenleyen yasal çerçeve üzerinde çalışıyor.",
      icerik: "Çevre, Şehircilik ve İklim Değişikliği Bakanlığı, 50 metrekarenin altındaki seyyar ve sabit tiny house yapılarını düzenleyen yasal çerçeve üzerinde çalışmalar yürüttüğünü açıkladı. Yeni düzenlemeyle tekerlekli tiny house'ların belediye sınırları içindeki park ve kamp alanlarında konumlandırılması için özel izin rejimi getirilmesi planlanıyor.\n\nMevcut imar mevzuatında tiny house'lar net bir yasal statüye sahip değil. Bu durum, hem üreticileri hem de kullanıcıları belirsiz bir hukuki ortamda bırakıyor. Yeni düzenleme bu boşluğu doldurmayı amaçlıyor.\n\nBakanlık yetkilileri, düzenlemenin tiny house turizmine de ivme kazandıracağını belirtiyor. Özellikle Karadeniz, Ege ve Akdeniz sahil şeridinde tiny house tatil köyleri için yeni bir lisanslama sistemi getiriliyor.\n\nTiny house üreticileri derneği başkanı, sektörde son bir yılda yüzde 150 büyüme yaşandığını ve 300'den fazla üreticinin aktif olarak faaliyet gösterdiğini açıkladı. Yıllık üretimin 5.000 adedi geçtiği tahmin ediliyor.\n\nYeni yasal düzenlemenin 2026 sonbaharında yürürlüğe girmesi bekleniyor. Düzenlemeyle birlikte tiny house'lar için asgari yalıtım, elektrik güvenliği ve atık su standartları da belirlenecek.",
      baslikEn: "Tiny house legislation: Zoning regulations for small homes are coming",
      ozetEn: "The Ministry is working on a legal framework to regulate tiny house structures under 50 square meters.",
      icerikEn: "The Ministry of Environment, Urbanization and Climate Change announced that it is conducting studies on a legal framework to regulate mobile and fixed tiny house structures under 50 square meters. Under the new regulation, a special permit regime is planned for positioning wheeled tiny houses in parks and camping areas within municipal boundaries.\n\nUnder current zoning legislation, tiny houses do not have a clear legal status. This situation leaves both manufacturers and users in an uncertain legal environment. The new regulation aims to fill this gap.\n\nMinistry officials note that the regulation will also boost tiny house tourism. A new licensing system is being introduced specifically for tiny house holiday villages along the Black Sea, Aegean, and Mediterranean coastlines.\n\nThe president of the tiny house manufacturers association announced that the sector experienced 150 percent growth in the past year, with more than 300 manufacturers actively operating. Annual production is estimated to have exceeded 5,000 units.\n\nThe new legal regulation is expected to take effect in the fall of 2026. Along with the regulation, minimum standards for insulation, electrical safety, and wastewater will also be established for tiny houses.",
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
      ozet: "2025 yılında Türkiye'nin çelik yapı ihracatı yüzde 28 artarak 1,4 milyar dolara ulaştı.",
      icerik: "İnşaat Malzemesi Sanayicileri Derneği (İMSAD) verilerine göre 2025 yılında Türkiye'nin çelik yapı ihracatı bir önceki yıla kıyasla yüzde 28 artarak 1,4 milyar dolar seviyesine ulaştı. Prefabrik çelik yapı ve modüler konut sistemleri, ihracatta en büyük payı oluşturuyor.\n\nOrta Doğu ve Afrika pazarlarındaki talep yüzde 60 büyüdü. Suudi Arabistan'ın NEOM projesi ve Katar'ın altyapı yatırımları, Türk çelik yapı üreticileri için önemli fırsatlar yaratıyor. Libya ve Cezayir'deki yeniden yapılanma projeleri de talebi artırıyor.\n\nİMSAD Başkanı, Türk firmalarının kalite-fiyat dengesinde küresel rekabet gücüne sahip olduğunu vurguladı. Özellikle ISO 9001 ve CE sertifikalı üreticilerin sayısının son iki yılda iki katına çıktığını belirtti.\n\nSektörde istihdam da hızla artıyor. Çelik yapı üretiminde çalışan sayısı 80.000'i aştı. Mesleki eğitim programlarıyla nitelikli işgücü yetiştirme çalışmaları hızlandırılıyor.\n\nDernek, 2026 yılı sonunda ihracatın 2 milyar dolar hedefine ulaşmasını beklediğini açıkladı. Yeni hedef pazarlar arasında Güney Amerika ve Güneydoğu Asya ülkeleri de yer alıyor.",
      baslikEn: "Steel construction sector breaks export records",
      ozetEn: "Turkey's steel construction exports increased by 28 percent in 2025, reaching 1.4 billion dollars.",
      icerikEn: "According to data from the Construction Materials Industrialists Association (IMSAD), Turkey's steel construction exports increased by 28 percent compared to the previous year in 2025, reaching 1.4 billion dollars. Prefabricated steel structures and modular housing systems account for the largest share of exports.\n\nDemand in Middle Eastern and African markets grew by 60 percent. Saudi Arabia's NEOM project and Qatar's infrastructure investments are creating significant opportunities for Turkish steel construction manufacturers. Reconstruction projects in Libya and Algeria are also boosting demand.\n\nThe IMSAD President emphasized that Turkish companies have global competitiveness in quality-price balance. He noted that the number of ISO 9001 and CE certified manufacturers has doubled in the past two years.\n\nEmployment in the sector is also growing rapidly. The number of workers in steel construction has exceeded 80,000. Efforts to train qualified workforce through vocational education programs are being accelerated.\n\nThe association announced that it expects exports to reach the 2 billion dollar target by the end of 2026. South America and Southeast Asian countries are also among the new target markets.",
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
      ozet: "Yapı Fuarı 2026'da prefabrik, konteyner ve tiny house üreticileri en büyük ilgiyi çekti.",
      icerik: "İstanbul'da düzenlenen Yapı Fuarı 2026'da prefabrik, konteyner ve tiny house üreticileri en büyük ilgiyi çeken stantlar arasında yer aldı. Fuar direktörü, bu yılki katılımın yüzde 35 artışla rekor kırdığını açıkladı.\n\nModülerPazar'ın fuar organizasyon ortağı olarak yer aldığı etkinlikte birden fazla proje yatırım anlaşması imzalandı. 200'den fazla firma, 50.000'i aşkın ziyaretçiye ürünlerini sergiledi.\n\nFuarda en çok ilgi gören ürünler arasında güneş enerjili off-grid tiny house'lar, depreme dayanıklı çelik karkas prefabrikler ve akıllı ev sistemleriyle donatılmış konteyner konutlar yer aldı.\n\nUluslararası katılımcılar arasında Almanya, İtalya ve Japonya'dan gelen firmalar da bulunuyordu. Yabancı firmalar, Türk üreticilerle ortak proje geliştirme konusunda anlaşmalar yaptı.\n\nFuar organizatörleri, gelecek yıl etkinliğin kapasitesini iki katına çıkarmayı ve uluslararası katılımı yüzde 50 artırmayı hedefliyor. 2027 fuarının tarihi Mart ayı olarak açıklandı.",
      baslikEn: "Modular construction sector draws major interest at 2026 Turkey building fair",
      ozetEn: "Prefabricated, container, and tiny house manufacturers attracted the most attention at the 2026 Building Fair.",
      icerikEn: "At the 2026 Building Fair held in Istanbul, prefabricated, container, and tiny house manufacturers were among the booths that attracted the most attention. The fair director announced that this year's participation broke records with a 35 percent increase.\n\nMultiple project investment agreements were signed at the event, where ModulerPazar participated as an organizational partner. More than 200 companies showcased their products to over 50,000 visitors.\n\nAmong the most popular products at the fair were solar-powered off-grid tiny houses, earthquake-resistant steel-frame prefabricated buildings, and container homes equipped with smart home systems.\n\nInternational participants included companies from Germany, Italy, and Japan. Foreign firms signed agreements with Turkish manufacturers on joint project development.\n\nFair organizers aim to double the event's capacity next year and increase international participation by 50 percent. The date of the 2027 fair was announced as March.",
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
    { id: 'seed_kaynak_01', ad: 'Hürriyet',                     url: 'https://www.hurriyet.com.tr',                             aramaKelimesi: 'prefabrik ev',           bolge: 'turkiye', aktif: true, _seed: true },
    { id: 'seed_kaynak_02', ad: 'Türkiye Prefabrik Birliği',    url: 'https://www.prefab.org.tr',                               aramaKelimesi: 'prefabrik',              bolge: 'turkiye', aktif: true, _seed: true },
    { id: 'seed_kaynak_03', ad: 'İMSAD',                        url: 'https://www.imsad.org',                                   aramaKelimesi: 'prefabrik',              bolge: 'turkiye', aktif: true, _seed: true },
    { id: 'seed_kaynak_04', ad: 'Sabah',                        url: 'https://www.sabah.com.tr',                                aramaKelimesi: 'tiny house',             bolge: 'turkiye', aktif: true, _seed: true },
    { id: 'seed_kaynak_05', ad: 'Mynet',                        url: 'https://www.mynet.com',                                   aramaKelimesi: 'prefabrik',              bolge: 'turkiye', aktif: true, _seed: true },
    { id: 'seed_kaynak_06', ad: 'Sözcü',                        url: 'https://www.sozcu.com.tr',                                aramaKelimesi: 'konteyner ev',           bolge: 'turkiye', aktif: true, _seed: true },
    { id: 'seed_kaynak_07', ad: 'Emlakjet Blog',                url: 'https://www.emlakjet.com',                                aramaKelimesi: 'prefabrik ev',           bolge: 'turkiye', aktif: true, _seed: true },
    { id: 'seed_kaynak_08', ad: 'Modular Building Institute',   url: 'https://www.modular.org/press-releases',                  aramaKelimesi: 'modular construction',   bolge: 'dunya',   aktif: true, _seed: true },
    { id: 'seed_kaynak_09', ad: 'ArchDaily Modular',            url: 'https://www.archdaily.com/tag/modular-and-prefabricated',  aramaKelimesi: 'prefab modular',         bolge: 'dunya',   aktif: true, _seed: true },
    { id: 'seed_kaynak_10', ad: 'Construction Dive',            url: 'https://www.constructiondive.com',                        aramaKelimesi: 'modular building',       bolge: 'dunya',   aktif: true, _seed: true },
    { id: 'seed_kaynak_11', ad: 'HousingWire',                  url: 'https://www.housingwire.com',                             aramaKelimesi: 'prefab housing',         bolge: 'dunya',   aktif: true, _seed: true },
    { id: 'seed_kaynak_12', ad: 'Dwell Prefab',                 url: 'https://www.dwell.com/collection/prefab',                 aramaKelimesi: 'prefab home',            bolge: 'dunya',   aktif: true, _seed: true },
  ];

  const kaynakBatch = writeBatch(db);
  KAYNAKLAR.forEach((k) => {
    kaynakBatch.set(doc(db, 'haberKaynaklari', k.id), {
      ...k,
      eklenmeTarihi: daysAgo(0),
    });
  });
  await kaynakBatch.commit();
  console.log('[seed] haberKaynaklari yazıldı (12 adet)');

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
