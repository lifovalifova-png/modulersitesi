import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { CATEGORIES } from '../data/categories';
import { ShieldCheck, MapPin, Tag, ChevronDown, Building2, Star } from 'lucide-react';

/* ── Firma tipi (Firestore firms koleksiyonu) ───────────────── */
interface Firm {
  id:       string;
  name:     string;
  category: string;
  city:     string;
  verified: boolean;
  status:   'pending' | 'approved' | 'rejected';
}

interface YorumRating {
  avg:   number;
  count: number;
}

/* ── Category badge colors ──────────────────────────────────── */
const CAT_COLORS: Record<string, string> = {
  'Prefabrik':           'bg-emerald-100 text-emerald-700',
  'Yaşam Konteynerleri': 'bg-blue-100 text-blue-700',
  'Tiny House':          'bg-purple-100 text-purple-700',
  'Çelik Yapılar':       'bg-gray-200 text-gray-700',
  'Ahşap Yapılar':       'bg-amber-100 text-amber-700',
  'Özel Projeler':       'bg-pink-100 text-pink-700',
};

/* ── Skeleton kart ──────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 animate-pulse flex flex-col gap-3">
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="flex gap-2">
        <div className="h-5 bg-gray-100 rounded-full w-24" />
        <div className="h-5 bg-gray-100 rounded-full w-20" />
      </div>
      <div className="h-8 bg-gray-100 rounded-lg mt-auto" />
    </div>
  );
}

/* ── Component ──────────────────────────────────────────────── */
export default function FirmalarHaritaPage() {
  const [firms,          setFirms]          = useState<Firm[]>([]);
  const [ratings,        setRatings]        = useState<Record<string, YorumRating>>({});
  const [loading,        setLoading]        = useState(true);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterCity,     setFilterCity]     = useState('');

  /* Firestore'dan onaylı firmaları çek */
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'firms'), (snap) => {
      const docs = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as Firm))
        .filter((f) => f.status === 'approved');
      setFirms(docs);
      setLoading(false);
    }, () => setLoading(false));
    return unsub;
  }, []);

  /* Onaylı yorumlardan firma başına ortalama puan hesapla */
  useEffect(() => {
    const q = query(collection(db, 'yorumlar'), where('onaylandi', '==', true));
    const unsub = onSnapshot(q, (snap) => {
      const map: Record<string, { total: number; count: number }> = {};
      snap.docs.forEach((d) => {
        const data = d.data() as { firmaId: string; puan: number };
        if (!map[data.firmaId]) map[data.firmaId] = { total: 0, count: 0 };
        map[data.firmaId].total += data.puan;
        map[data.firmaId].count += 1;
      });
      const result: Record<string, YorumRating> = {};
      Object.entries(map).forEach(([id, v]) => {
        result[id] = { avg: v.total / v.count, count: v.count };
      });
      setRatings(result);
    });
    return unsub;
  }, []);

  /* Filtrelenmiş liste */
  const filtered = useMemo(() => firms.filter((f) => {
    if (filterCategory && f.category !== filterCategory) return false;
    if (filterCity     && f.city     !== filterCity)     return false;
    return true;
  }), [firms, filterCategory, filterCity]);

  /* Unique şehirler */
  const cities = useMemo(() => [...new Set(firms.map((f) => f.city))].sort(), [firms]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">

          {/* Sayfa başlığı */}
          <div className="mb-6">
            <nav className="text-sm text-gray-500 mb-3 flex items-center gap-2">
              <Link to="/" className="hover:text-emerald-600 transition">Ana Sayfa</Link>
              <span>/</span>
              <span className="text-gray-800">Firmalar</span>
            </nav>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Kayıtlı Firmalar</h1>
            <p className="text-gray-500 mt-1 text-sm">
              {loading ? 'Yükleniyor…' : `Türkiye genelinde ${firms.length} onaylı firma`}
            </p>
          </div>

          {/* Filtreler */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex flex-wrap gap-3 items-center">
            {/* Kategori */}
            <div className="relative">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                aria-label="Kategoriye göre filtrele"
                className="appearance-none border border-gray-300 rounded-lg bg-white text-sm text-gray-700 px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Tüm Kategoriler</option>
                {CATEGORIES.map((c) => (
                  <option key={c.slug} value={c.name}>{c.name}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" aria-hidden="true" />
            </div>

            {/* Şehir */}
            <div className="relative">
              <select
                value={filterCity}
                onChange={(e) => setFilterCity(e.target.value)}
                aria-label="Şehre göre filtrele"
                className="appearance-none border border-gray-300 rounded-lg bg-white text-sm text-gray-700 px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Tüm Şehirler</option>
                {cities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" aria-hidden="true" />
            </div>

            {!loading && (
              <span className="text-sm text-gray-500 ml-auto">
                {filtered.length} firma gösteriliyor
              </span>
            )}

            {/* Legend */}
            <div className="flex items-center gap-4 text-xs text-gray-500 border-l border-gray-200 pl-4">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                Doğrulanmış
              </span>
            </div>
          </div>

          {/* İçerik */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
              <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm font-medium">
                {firms.length === 0
                  ? 'Henüz onaylı firma yok.'
                  : 'Filtrelerle eşleşen firma bulunamadı.'}
              </p>
              {firms.length === 0 && (
                <Link
                  to="/satici-formu"
                  className="inline-block mt-4 text-sm text-emerald-600 hover:underline font-medium"
                >
                  İlk firma olmak için kayıt olun →
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((firm) => (
                <div
                  key={firm.id}
                  className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-emerald-300 hover:shadow-sm transition flex flex-col gap-3"
                >
                  {/* Başlık */}
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-gray-800 text-sm leading-snug">{firm.name}</p>
                    {firm.verified && (
                      <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" aria-label="Doğrulanmış firma" />
                    )}
                  </div>

                  {/* Rozetler */}
                  <div className="flex flex-wrap gap-1.5">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${CAT_COLORS[firm.category] ?? 'bg-gray-100 text-gray-600'}`}>
                      <Tag className="w-2.5 h-2.5" aria-hidden="true" />
                      {firm.category}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                      <MapPin className="w-2.5 h-2.5" aria-hidden="true" />
                      {firm.city}
                    </span>
                  </div>

                  {/* Ortalama puan */}
                  {ratings[firm.id] ? (
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < Math.round(ratings[firm.id].avg) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`} />
                      ))}
                      <span className="text-xs text-gray-500 ml-0.5">
                        {ratings[firm.id].avg.toFixed(1)} ({ratings[firm.id].count})
                      </span>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400">Henüz değerlendirme yok</p>
                  )}

                  {/* Buton */}
                  <div className="mt-auto pt-1">
                    <Link
                      to={`/firma/${firm.id}`}
                      className="block w-full text-center bg-emerald-600 text-white text-xs font-semibold py-2 rounded-lg hover:bg-emerald-700 transition"
                    >
                      Teklif İste
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className="mt-6 text-xs text-gray-400 text-center">
            Firmanızı listeye eklemek için{' '}
            <Link to="/satici-formu" className="text-emerald-600 hover:underline">
              ücretsiz kayıt olun
            </Link>.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
