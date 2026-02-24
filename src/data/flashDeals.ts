export interface FlashDeal {
  id: number;
  title: string;
  location: string;
  price: string;
  originalPrice?: string;
  image: string;
  category: string;
  urgent: boolean;
  discount?: number;
}

export const FLASH_DEALS: FlashDeal[] = [
  {
    id: 1,
    title: "Kütahya'da 2 Adet Konteyner - ACİL SATILIK",
    location: 'Kütahya',
    price: '145.000 ₺',
    originalPrice: '180.000 ₺',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
    category: 'Yaşam Konteynerleri',
    urgent: true,
    discount: 20,
  },
  {
    id: 2,
    title: '80 m² Prefabrik Ev - Sıfır',
    location: 'Ankara',
    price: '320.000 ₺',
    image: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400&h=300&fit=crop',
    category: 'Prefabrik',
    urgent: false,
  },
  {
    id: 3,
    title: 'Tiny House 35 m² - Mobilyalı',
    location: 'İzmir',
    price: '280.000 ₺',
    originalPrice: '320.000 ₺',
    image: 'https://images.unsplash.com/photo-1587061949409-02df41d5e562?w=400&h=300&fit=crop',
    category: 'Tiny House',
    urgent: true,
    discount: 12,
  },
  {
    id: 4,
    title: 'Çelik Konstrüksiyon Depo 200 m²',
    location: 'Bursa',
    price: '450.000 ₺',
    image: 'https://images.unsplash.com/photo-1565610222536-ef125c59da2e?w=400&h=300&fit=crop',
    category: 'Çelik Yapılar',
    urgent: false,
  },
  {
    id: 5,
    title: '2. El Şantiye Konteyneri - 6m',
    location: 'İstanbul',
    price: '75.000 ₺',
    originalPrice: '95.000 ₺',
    image: 'https://images.unsplash.com/photo-1494145904049-0dca59b4bbad?w=400&h=300&fit=crop',
    category: '2. El',
    urgent: true,
    discount: 21,
  },
  {
    id: 6,
    title: 'Ahşap Bungalov 60 m² - Doğal',
    location: 'Antalya',
    price: '520.000 ₺',
    image: 'https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?w=400&h=300&fit=crop',
    category: 'Ahşap Yapılar',
    urgent: false,
  },
  {
    id: 7,
    title: 'Özel Proje Villa Tipi Prefabrik',
    location: 'Muğla',
    price: '890.000 ₺',
    image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop',
    category: 'Özel Projeler',
    urgent: false,
  },
  {
    id: 8,
    title: 'Konteyner Ofis - Hazır Teslimat',
    location: 'Kocaeli',
    price: '185.000 ₺',
    originalPrice: '210.000 ₺',
    image: 'https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=400&h=300&fit=crop',
    category: 'Yaşam Konteynerleri',
    urgent: true,
    discount: 12,
  },
];
