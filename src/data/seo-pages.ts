export type SeoCity = {
  slug: string;
  name: string;
  region: string;
  population: number;
  imarNotu: string;
  iklimNotu: string;
  fiyatAraligi: { min: number; max: number };
};

export type SeoCategory = {
  slug: string;
  name: string;
  description: string;
  avgDeliveryDays: number;
  m2Range: { min: number; max: number };
};

export const SEO_CITIES: SeoCity[] = [
  {
    slug: 'istanbul',
    name: 'İstanbul',
    region: 'Marmara',
    population: 15800000,
    imarNotu: 'İstanbul Büyükşehir Belediyesi sınırları içinde modüler yapı kurulumu için ilçe belediyesinden ruhsat zorunlu. Boğaziçi öngörünüm bölgesinde ek kısıtlamalar var.',
    iklimNotu: 'Nemli ve değişken iklim; çelik konstrüksiyonlarda korozyona dayanıklı kaplama önerilir. Deprem bölgesi 1. derece, statik hesaplar zorunlu.',
    fiyatAraligi: { min: 18000, max: 35000 },
  },
  {
    slug: 'ankara',
    name: 'Ankara',
    region: 'İç Anadolu',
    population: 5750000,
    imarNotu: 'Ankara Büyükşehir Belediyesi modüler yapılarda ilçe belediyesi ruhsatı talep ediyor. Tarım arazilerinde ek izin gerekli.',
    iklimNotu: 'Karasal iklim; kış sıcaklığı -15°C\'ye düşebilir. Yalıtım kalınlığı min. 8 cm önerilir.',
    fiyatAraligi: { min: 15000, max: 28000 },
  },
  {
    slug: 'izmir',
    name: 'İzmir',
    region: 'Ege',
    population: 4400000,
    imarNotu: 'İzmir Büyükşehir Belediyesi turizm bölgelerinde özel imar planı gerektiriyor. Çeşme ve Foça\'da ek kısıtlamalar var.',
    iklimNotu: 'Akdeniz iklimi; yaz sıcaklıkları 40°C\'yi aşar. Çatı yalıtımı ve doğal havalandırma kritik. Deprem 1. derece.',
    fiyatAraligi: { min: 16000, max: 30000 },
  },
  {
    slug: 'sakarya',
    name: 'Sakarya',
    region: 'Marmara',
    population: 1080000,
    imarNotu: 'Modüler yapı sektörünün üretim merkezi. Hendek ve Adapazarı\'nda OSB içinde üretim tesisleri yoğun. Yapı ruhsatı süreci diğer büyükşehirlere göre daha hızlı.',
    iklimNotu: 'Nemli orta kuşak; yıllık yağış 800mm. Çatı eğimi ve yalıtım kritik. Deprem 1. derece.',
    fiyatAraligi: { min: 14000, max: 25000 },
  },
  {
    slug: 'antalya',
    name: 'Antalya',
    region: 'Akdeniz',
    population: 2620000,
    imarNotu: 'Turizm bölgelerinde ÇED raporu gerekli olabilir. Konyaaltı ve Kemer\'de imar planı kısıtları sıkı. Tarım arazilerinde modüler yapı kuruluma 1. sınıf izin.',
    iklimNotu: 'Yarı tropikal Akdeniz; yaz uzun ve sıcak. UV dayanımlı dış kaplama önerilir. Deprem 2. derece.',
    fiyatAraligi: { min: 17000, max: 32000 },
  },
];

export const SEO_CATEGORIES: SeoCategory[] = [
  {
    slug: 'prefabrik-ev',
    name: 'Prefabrik Ev',
    description: 'Fabrikada üretilip sahaya monte edilen, kalıcı yaşam için tasarlanmış modüler konutlardır. Çelik veya ahşap karkas üzerine yalıtımlı paneller ile inşa edilir.',
    avgDeliveryDays: 45,
    m2Range: { min: 40, max: 200 },
  },
  {
    slug: 'konteyner-ev',
    name: 'Konteyner Ev',
    description: 'Standart denizcilik konteynerlerinden veya konteyner formundan üretilen modüler yapılardır. Hızlı kurulum, taşınabilirlik ve dayanıklılık avantajı sunar.',
    avgDeliveryDays: 30,
    m2Range: { min: 12, max: 80 },
  },
  {
    slug: 'tiny-house',
    name: 'Tiny House',
    description: 'Genellikle 30 m² altı, taşınabilir veya sabit küçük yaşam birimleridir. Hafta sonu evi, dağ evi veya minimalist yaşam tarzı için tercih edilir.',
    avgDeliveryDays: 60,
    m2Range: { min: 12, max: 30 },
  },
];

export const SEO_PAGES = SEO_CITIES.flatMap(city =>
  SEO_CATEGORIES.map(category => ({
    city,
    category,
    url: `/${category.slug}/${city.slug}`,
    title: `${city.name} ${category.name} - Onaylı Üreticiler ve Fiyatlar | ModülerPazar`,
    description: `${city.name}'da ${category.name.toLowerCase()} üreten onaylı firmalar, güncel ${category.m2Range.min}-${category.m2Range.max} m² ürün listesi ve fiyat aralığı. ModülerPazar'da hızlı teklif al.`,
  }))
);
