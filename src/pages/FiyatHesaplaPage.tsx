import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFeatureFlags } from '../hooks/useFeatureFlags';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEOMeta from '../components/SEOMeta';
import Disclaimer from '../components/Disclaimer';
import { Calculator, ChevronRight, MapPin, ArrowRight, Building2 } from 'lucide-react';
import { trackEvent } from '../lib/analytics';

/* ── Varsayılan m² birim fiyatlar (Firestore'dan override edilir) ── */
const DEFAULT_PRICES: Record<string, number> = {
  prefabrik:         3500,
  'celik-yapilar':  40000,
  'yasam-konteynerleri': 3000,
  'tiny-house':      4000,
  'ahsap-yapilar':   5000,
};

const KATEGORI_LABELS: Record<string, string> = {
  prefabrik:             'Prefabrik Ev',
  'celik-yapilar':       'Çelik Yapı',
  'yasam-konteynerleri': 'Yaşam Konteyneri',
  'tiny-house':          'Tiny House',
  'ahsap-yapilar':       'Ahşap Yapı',
};

const METREKARE_OPTIONS = ['30', '50', '60', '80', '100', '120', '150', '200', '250+'];

const CITIES = [
  'Adana','Ankara','Antalya','Bursa','Diyarbakır','Erzurum','Gaziantep',
  'İstanbul','İzmir','Kayseri','Konya','Malatya','Mersin','Muğla',
  'Samsun','Trabzon','Van',
];

interface Result {
  min: number;
  max: number;
  kalanKategoriSlug: string;
}

export default function FiyatHesaplaPage() {
  const navigate = useNavigate();
  const { flags, loading: flagsLoading } = useFeatureFlags();

  useEffect(() => {
    if (!flagsLoading && !flags.fiyatHesaplama) {
      navigate('/', { replace: true });
    }
  }, [flagsLoading, flags.fiyatHesaplama, navigate]);

  const [kategori, setKategori] = useState('');
  const [metrekare, setMetrekare] = useState('');
  const [sehir, setSehir] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const [prices, setPrices] = useState<Record<string, number>>(DEFAULT_PRICES);
  const [loading, setLoading] = useState(false);

  if (flagsLoading || !flags.fiyatHesaplama) return null;

  /* Firestore'dan güncel fiyatları çek */
  useEffect(() => {
    getDoc(doc(db, 'settings', 'fiyatlar')).then((snap) => {
      if (snap.exists()) {
        setPrices({ ...DEFAULT_PRICES, ...(snap.data() as Record<string, number>) });
      }
    });
  }, []);

  function handleHesapla(e: React.FormEvent) {
    e.preventDefault();
    if (!kategori || !metrekare) return;
    setLoading(true);
    const m2 = parseInt(metrekare.replace('+', ''), 10);
    const birimFiyat = prices[kategori] ?? DEFAULT_PRICES[kategori] ?? 4000;
    /* ±%25 min-max aralığı */
    const base = m2 * birimFiyat;
    const min  = Math.round(base * 0.85 / 1000) * 1000;
    const max  = Math.round(base * 1.25 / 1000) * 1000;
    setTimeout(() => {
      setResult({ min, max, kalanKategoriSlug: kategori });
      trackEvent('fiyat_hesaplandi', { yapiTipi: kategori, metrekare: m2 });
      setLoading(false);
    }, 400);
  }

  function fmt(n: number) {
    return new Intl.NumberFormat('tr-TR').format(n) + ' ₺';
  }

  return (
    <div className="flex flex-col min-h-screen">
      <SEOMeta
        title="Fiyat Hesaplayıcı — Prefabrik ve Modüler Yapı Maliyeti"
        description="Yapı tipi ve metrekareye göre prefabrik ev, çelik yapı, konteyner ev ve tiny house maliyetini hesaplayın. Ücretsiz tahmini fiyat aralığı."
        url="/fiyat-hesapla"
      />
      <Header />

      <main className="flex-1 bg-gray-50">

        {/* Hero */}
        <div className="bg-gradient-to-br from-emerald-700 to-teal-600 text-white py-12 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Calculator className="w-7 h-7" />
            </div>
            <h1 className="text-2xl md:text-4xl font-bold mb-2">Yapı Fiyatı Hesaplayıcı</h1>
            <p className="text-emerald-100 text-sm md:text-base max-w-xl mx-auto">
              Yapı tipini ve metrekareyi seçin; tahmini maliyet aralığını anında görün.
              Kesin fiyat için firmalardan ücretsiz teklif alın.
            </p>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-8">
          {/* Form */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8 mb-6">
            <form onSubmit={handleHesapla} className="space-y-5">
              {/* Yapı Tipi */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Yapı Tipi <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.entries(KATEGORI_LABELS).map(([slug, label]) => (
                    <button
                      key={slug}
                      type="button"
                      onClick={() => { setKategori(slug); setResult(null); }}
                      className={`border rounded-xl px-3 py-2.5 text-sm font-medium text-left transition ${
                        kategori === slug
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-gray-200 text-gray-600 hover:border-emerald-300'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Metrekare */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tahmini Metrekare <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {METREKARE_OPTIONS.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => { setMetrekare(m); setResult(null); }}
                      className={`border rounded-lg px-3 py-2.5 text-sm font-medium transition min-h-[44px] ${
                        metrekare === m
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-gray-200 text-gray-600 hover:border-emerald-300'
                      }`}
                    >
                      {m} m²
                    </button>
                  ))}
                </div>
              </div>

              {/* Şehir (opsiyonel) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Şehir <span className="text-gray-400 font-normal text-xs">(opsiyonel)</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    value={sehir}
                    onChange={(e) => setSehir(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Şehir seçin</option>
                    {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={!kategori || !metrekare || loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <><Calculator className="w-4 h-4" /> Fiyatı Hesapla</>
                )}
              </button>
            </form>
          </div>

          {/* Sonuç */}
          {result && (
            <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm p-6 md:p-8 mb-6 animate-fadeIn">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <Calculator className="w-4 h-4 text-emerald-600" />
                </div>
                <h2 className="font-bold text-gray-800">
                  {KATEGORI_LABELS[kategori]} — {metrekare} m² Tahmini Maliyet
                  {sehir ? ` (${sehir})` : ''}
                </h2>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1 bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center">
                  <p className="text-xs text-emerald-600 font-medium mb-1">Minimum Tahmini</p>
                  <p className="text-2xl font-extrabold text-emerald-700">{fmt(result.min)}</p>
                </div>
                <div className="flex items-center justify-center text-gray-400 font-bold text-xl">—</div>
                <div className="flex-1 bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
                  <p className="text-xs text-blue-600 font-medium mb-1">Maksimum Tahmini</p>
                  <p className="text-2xl font-extrabold text-blue-700">{fmt(result.max)}</p>
                </div>
              </div>

              <p className="text-xs text-gray-500 mb-5 leading-relaxed">
                Bu fiyat tahmini, {metrekare} m² için m² başına ~{fmt(prices[kategori] ?? DEFAULT_PRICES[kategori] ?? 4000)} baz fiyat üzerinden hesaplanmıştır.
                Gerçek fiyatlar malzeme kalitesi, zemin hazırlığı, nakliye ve işçilik maliyetine göre değişir.
              </p>

              <Disclaimer />

              {/* Önerilen firmalar */}
              <div className="mt-5 pt-5 border-t border-gray-100">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-600" />
                  Bu kategori için firmalar
                </h3>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    to={`/kategori/${result.kalanKategoriSlug}`}
                    className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl text-sm transition"
                  >
                    İlanları Gör <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    to="/talep-olustur"
                    className="flex-1 flex items-center justify-center gap-2 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold py-3 rounded-xl text-sm transition"
                  >
                    Ücretsiz Teklif Al
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Bilgi Kartları */}
          <div className="grid sm:grid-cols-2 gap-4">
            {Object.entries(KATEGORI_LABELS).map(([slug, label]) => (
              <Link
                key={slug}
                to={`/kategori/${slug}`}
                className="bg-white border border-gray-200 hover:border-emerald-300 rounded-xl p-4 flex items-center justify-between group transition"
              >
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    ~{new Intl.NumberFormat('tr-TR').format(prices[slug] ?? DEFAULT_PRICES[slug] ?? 4000)} ₺/m²'den başlayan
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-600 transition" />
              </Link>
            ))}
          </div>

          {/* Breadcrumb */}
          <nav className="mt-6 text-xs text-gray-400 flex items-center gap-1.5">
            <Link to="/" className="hover:text-emerald-600 transition">Ana Sayfa</Link>
            <span>/</span>
            <span className="text-gray-600">Fiyat Hesaplayıcı</span>
          </nav>
        </div>
      </main>

      <Footer />
    </div>
  );
}
