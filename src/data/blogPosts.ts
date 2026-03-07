export type BlogKategori = 'prefabrik' | 'celik-yapi' | 'konteyner' | 'tiny-house' | 'genel';

export interface BlogPost {
  id:           number;
  slug:         string;
  baslik:       string;
  ozet:         string;
  icerik?:      string; /* Firestore "blog/{slug}" den lazy yüklenir; seed dışında kullanılmaz */
  kategori:     BlogKategori;
  tarih:        string;
  okumaSuresi:  number;
  yazar:        string;
  kapakGorseli: string;
}

export const BLOG_POSTS: BlogPost[] = [
  {
    id: 1,
    slug: 'prefabrik-ev-nedir-2025-fiyatlari',
    baslik: 'Prefabrik Ev Nedir? 2025 Fiyatları ve Avantajları',
    ozet: 'Prefabrik evlerin ne olduğunu, 2025 yılı güncel fiyatlarını ve geleneksel yapılara göre avantajlarını bu kapsamlı rehberde keşfedin.',
    kategori: 'prefabrik',
    tarih: '2025-01-10',
    okumaSuresi: 7,
    yazar: 'ModülerPazar Editörü',
    kapakGorseli: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=500&fit=crop',
  },
  {
    id: 2,
    slug: 'celik-yapi-mi-prefabrik-mi-karsilastirma',
    baslik: 'Çelik Yapı mı, Prefabrik mi? Kapsamlı Karşılaştırma',
    ozet: 'İki popüler yapı sistemini maliyet, dayanım, kurulum süresi ve kullanım alanı açısından karşılaştırıyoruz. Hangisi sizin için daha uygun?',
    kategori: 'celik-yapi',
    tarih: '2025-01-15',
    okumaSuresi: 8,
    yazar: 'ModülerPazar Editörü',
    kapakGorseli: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&h=500&fit=crop',
  },
  {
    id: 3,
    slug: 'turkiyede-tiny-house-yasami',
    baslik: "Türkiye'de Tiny House Yaşamı: Başlamadan Önce Bilinmesi Gerekenler",
    ozet: "Türkiye'de tiny house trendi hız kazanıyor. Yasal durum, maliyetler, iklim uyumluluğu ve dikkat edilmesi gereken pratik bilgileri bir araya getirdik.",
    kategori: 'tiny-house',
    tarih: '2025-01-22',
    okumaSuresi: 6,
    yazar: 'ModülerPazar Editörü',
    kapakGorseli: 'https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?w=800&h=500&fit=crop',
  },
  {
    id: 4,
    slug: 'konteyner-ev-nasil-yapilir',
    baslik: 'Konteyner Ev Nasıl Yapılır? Adım Adım Rehber',
    ozet: "Nakliye konteynerlerinden konut yapımı Türkiye'de giderek yaygınlaşıyor. Proje aşamasından teslimata kadar tüm süreci anlattık.",
    kategori: 'konteyner',
    tarih: '2025-01-28',
    okumaSuresi: 7,
    yazar: 'ModülerPazar Editörü',
    kapakGorseli: 'https://images.unsplash.com/photo-1565183997392-2f6f122e5912?w=800&h=500&fit=crop',
  },
  {
    id: 5,
    slug: 'sehre-gore-yapi-tipi-iklim-rehberi',
    baslik: "Şehre Göre En Uygun Yapı Tipi: İklim ve Zemin Rehberi",
    ozet: "Türkiye'nin farklı iklim ve zemin koşullarına göre hangi yapı tipinin tercih edilmesi gerektiğini bölge bölge açıklıyoruz.",
    kategori: 'genel',
    tarih: '2025-02-03',
    okumaSuresi: 8,
    yazar: 'ModülerPazar Editörü',
    kapakGorseli: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=500&fit=crop',
  },
  {
    id: 6,
    slug: 'moduler-yapilarda-dask-ve-sigorta',
    baslik: 'Modüler Yapılarda DASK ve Sigorta: Bilmeniz Gerekenler',
    ozet: 'Prefabrik ev, konteyner veya tiny house için DASK yaptırabilir misiniz? Hangi sigortalar gerekli? Tüm merak edilenleri yanıtladık.',
    kategori: 'genel',
    tarih: '2025-02-10',
    okumaSuresi: 6,
    yazar: 'ModülerPazar Editörü',
    kapakGorseli: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=500&fit=crop',
  },
  {
    id: 7,
    slug: 'prefabrik-ev-izinleri-ruhsat-surecleri',
    baslik: "2025'te Prefabrik Ev İzinleri: Ruhsat Süreçleri",
    ozet: 'Prefabrik ev yaptırmadan önce hangi izinleri almanız gerekiyor? Ruhsat süreci nasıl işliyor? Adım adım rehber.',
    kategori: 'prefabrik',
    tarih: '2025-02-14',
    okumaSuresi: 7,
    yazar: 'ModülerPazar Editörü',
    kapakGorseli: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=500&fit=crop',
  },
  {
    id: 8,
    slug: 'ahsap-celik-yapi-karsilastirmasi',
    baslik: 'Ahşap ve Çelik Yapı Karşılaştırması: Hangisi Daha Dayanıklı?',
    ozet: 'İki köklü yapı malzemesini dayanım, maliyet, estetik ve çevresel etki açısından karşılaştırıyoruz.',
    kategori: 'celik-yapi',
    tarih: '2025-02-20',
    okumaSuresi: 7,
    yazar: 'ModülerPazar Editörü',
    kapakGorseli: 'https://images.unsplash.com/photo-1510627489930-0c1b0bfb6785?w=800&h=500&fit=crop',
  },
  {
    id: 9,
    slug: 'prefabrik-ev-kredisi-nasil-alinir',
    baslik: 'Prefabrik Ev Kredisi Nasıl Alınır? 2026 Koşulları',
    ozet: 'Bankalar prefabrik ev için kredi veriyor mu? Hangi belgeler gerekli, faiz oranları ne kadar? Güncel koşulları ve püf noktaları anlattık.',
    kategori: 'prefabrik',
    tarih: '2026-03-05',
    okumaSuresi: 6,
    yazar: 'ModülerPazar Editörü',
    kapakGorseli: 'https://images.unsplash.com/photo-1560520653-9e0e4c89eb11?w=800&h=500&fit=crop',
  },
  {
    id: 10,
    slug: 'depreme-dayanikli-moduler-yapilar',
    baslik: 'Depreme Dayanıklı Modüler Yapılar: Doğru mu, Efsane mi?',
    ozet: 'Modüler ve prefabrik yapıların deprem performansını uzman görüşleri ve gerçek verilerle inceliyoruz. Çelik mi, ahşap mı, sandviç panel mi?',
    kategori: 'genel',
    tarih: '2026-03-06',
    okumaSuresi: 7,
    yazar: 'ModülerPazar Editörü',
    kapakGorseli: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&h=500&fit=crop',
  },
  {
    id: 11,
    slug: '100-m2-prefabrik-ev-maliyeti-2026',
    baslik: '100 m² Prefabrik Ev Maliyeti 2026: Gerçekçi Bütçe Rehberi',
    ozet: '100 metrekarelik bir prefabrik ev yaptırmak için gerçekte ne kadar bütçe ayırmalısınız? Zemin, izin, montaj ve ek maliyetler dahil tam liste.',
    kategori: 'prefabrik',
    tarih: '2026-03-07',
    okumaSuresi: 8,
    yazar: 'ModülerPazar Editörü',
    kapakGorseli: 'https://images.unsplash.com/photo-1516156008625-3a9d6067fab5?w=800&h=500&fit=crop',
  },
];
