import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { SEO_CITIES, SEO_CATEGORIES } from '@/data/seo-pages';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SEOMeta from '@/components/SEOMeta';

interface FirmaRow { id: string; name: string; city?: string; sehir?: string; category?: string; kategoriler?: string[]; tanitimMetni?: string }
interface IlanRow  { id: string; baslik: string; fiyat?: number; gorseller?: string[]; firmaAdi?: string }

export default function SehirKategoriPage() {
  const { kategori, sehir } = useParams<{ kategori: string; sehir: string }>();
  const [firmalar, setFirmalar] = useState<FirmaRow[]>([]);
  const [ilanlar, setIlanlar]   = useState<IlanRow[]>([]);
  const [loading, setLoading]   = useState(true);

  const cityData     = SEO_CITIES.find(c => c.slug === sehir);
  const categoryData = SEO_CATEGORIES.find(c => c.slug === kategori);

  useEffect(() => {
    async function loadData() {
      if (!cityData || !categoryData) { setLoading(false); return; }
      try {
        const firmaQ = query(
          collection(db, 'firms'),
          where('status', '==', 'approved'),
          where('city', '==', cityData.name),
          limit(20)
        );
        const firmaSnap = await getDocs(firmaQ);
        setFirmalar(firmaSnap.docs.map(d => ({ id: d.id, ...d.data() } as FirmaRow)));

        const ilanQ = query(
          collection(db, 'ilanlar'),
          where('sehir', '==', cityData.name),
          where('kategoriSlug', '==', categoryData.slug),
          where('status', '==', 'aktif'),
          limit(12)
        );
        const ilanSnap = await getDocs(ilanQ);
        setIlanlar(ilanSnap.docs.map(d => ({ id: d.id, ...d.data() } as IlanRow)));
      } catch (e) {
        console.error('[SEO] Data load failed:', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [cityData, categoryData]);

  if (!cityData || !categoryData) {
    return <div className="p-8">Sayfa bulunamadı.</div>;
  }

  const pageTitle = `${cityData.name} ${categoryData.name} - Onaylı Üreticiler ve Fiyatlar`;
  const pageDesc  = `${cityData.name}'da ${categoryData.name.toLowerCase()} üreten onaylı firmalar, güncel ${categoryData.m2Range.min}-${categoryData.m2Range.max} m² ürün listesi ve ${cityData.fiyatAraligi.min.toLocaleString('tr-TR')}-${cityData.fiyatAraligi.max.toLocaleString('tr-TR')} TL/m² fiyat aralığı.`;
  const pageUrl   = `/${categoryData.slug}/${cityData.slug}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: pageTitle,
    description: pageDesc,
    url: `https://modulerpazar.com${pageUrl}`,
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: 'https://modulerpazar.com/' },
        { '@type': 'ListItem', position: 2, name: categoryData.name, item: `https://modulerpazar.com/${categoryData.slug}` },
        { '@type': 'ListItem', position: 3, name: cityData.name, item: `https://modulerpazar.com${pageUrl}` },
      ],
    },
  };

  return (
    <>
      <SEOMeta title={pageTitle} description={pageDesc} url={pageUrl} />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <Header />

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500 mb-4">
          <Link to="/" className="hover:text-emerald-600">Ana Sayfa</Link>
          {' / '}
          <span className="hover:text-emerald-600">{categoryData.name}</span>
          {' / '}
          <span className="text-gray-700">{cityData.name}</span>
        </nav>

        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
          {cityData.name} {categoryData.name} Üreticileri ve Fiyatları
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          {cityData.name}&apos;da onaylı {categoryData.name.toLowerCase()} firmalarından hızlı teklif alın.
        </p>

        {/* İl + Kategori Bilgi Kartları */}
        <section className="bg-gray-50 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-3">{cityData.name}&apos;da {categoryData.name}</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            {categoryData.description} {cityData.name} ({cityData.region} bölgesi, nüfus{' '}
            {cityData.population.toLocaleString('tr-TR')}) için {categoryData.name.toLowerCase()} ortalama{' '}
            {categoryData.avgDeliveryDays} günde teslim edilir ve tipik olarak {categoryData.m2Range.min}-
            {categoryData.m2Range.max} m² aralığında üretilir.
          </p>
          <div className="grid md:grid-cols-3 gap-4 mt-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h3 className="font-semibold text-sm text-gray-500 mb-1">Fiyat Aralığı</h3>
              <p className="text-lg font-bold text-emerald-700">
                ₺{cityData.fiyatAraligi.min.toLocaleString('tr-TR')} - ₺{cityData.fiyatAraligi.max.toLocaleString('tr-TR')} /m²
              </p>
              <p className="text-xs text-gray-500 mt-1">2026 tahmini, firmaya göre değişir</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h3 className="font-semibold text-sm text-gray-500 mb-1">İmar Durumu</h3>
              <p className="text-sm text-gray-700">{cityData.imarNotu}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h3 className="font-semibold text-sm text-gray-500 mb-1">İklim &amp; Yapı Notu</h3>
              <p className="text-sm text-gray-700">{cityData.iklimNotu}</p>
            </div>
          </div>
        </section>

        {/* Firmalar */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">{cityData.name}&apos;da Onaylı {categoryData.name} Üreticileri</h2>
          {loading ? (
            <p className="text-gray-500">Yükleniyor...</p>
          ) : firmalar.length === 0 ? (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
              <p className="text-amber-900">
                {cityData.name}&apos;da henüz onaylı {categoryData.name.toLowerCase()} üreticisi listelenmemiş.{' '}
                <Link to="/firmalar" className="font-semibold underline">Tüm firmaları görün</Link>.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {firmalar.map(firma => (
                <Link key={firma.id} to={`/firma/${firma.id}`} className="block p-4 bg-white border border-gray-200 rounded-lg hover:border-emerald-400 transition">
                  <h3 className="font-semibold text-gray-900">{firma.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{firma.tanitimMetni || 'Onaylı üretici'}</p>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* İlanlar */}
        {ilanlar.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Güncel {categoryData.name} İlanları</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {ilanlar.map(ilan => (
                <Link key={ilan.id} to={`/ilan/${ilan.id}`} className="block bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition">
                  {ilan.gorseller?.[0] && <img src={ilan.gorseller[0]} alt={ilan.baslik} className="w-full h-40 object-cover" loading="lazy" />}
                  <div className="p-3">
                    <h3 className="font-semibold text-sm text-gray-900 line-clamp-2">{ilan.baslik}</h3>
                    <p className="text-emerald-700 font-bold mt-2">
                      {ilan.fiyat ? `₺${ilan.fiyat.toLocaleString('tr-TR')}` : 'Teklif al'}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center">
          <h2 className="text-xl font-bold text-emerald-900 mb-2">
            {cityData.name}&apos;da {categoryData.name} mı arıyorsunuz?
          </h2>
          <p className="text-emerald-800 mb-4">
            Tek bir formla birden fazla onaylı firmadan teklif alın. Ücretsiz, 24 saat içinde yanıt.
          </p>
          <Link to="/talep-olustur" className="inline-block bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition">
            Hızlı Teklif Al
          </Link>
        </section>

        {/* Diğer şehirler internal linking */}
        <section className="mt-12">
          <h2 className="text-lg font-semibold text-gray-700 mb-3">Diğer Şehirlerde {categoryData.name}</h2>
          <div className="flex flex-wrap gap-2">
            {SEO_CITIES.filter(c => c.slug !== cityData.slug).map(c => (
              <Link key={c.slug} to={`/${categoryData.slug}/${c.slug}`} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-emerald-100 hover:text-emerald-700 transition">
                {c.name}
              </Link>
            ))}
          </div>
        </section>

        {/* Diğer kategoriler internal linking */}
        <section className="mt-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-700 mb-3">{cityData.name}&apos;da Diğer Kategoriler</h2>
          <div className="flex flex-wrap gap-2">
            {SEO_CATEGORIES.filter(c => c.slug !== categoryData.slug).map(c => (
              <Link key={c.slug} to={`/${c.slug}/${cityData.slug}`} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-emerald-100 hover:text-emerald-700 transition">
                {c.name}
              </Link>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
