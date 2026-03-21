import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, onSnapshot, query, where, limit, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEOMeta from '../components/SEOMeta';
import { CATEGORIES, CATEGORY_NAME_KEYS } from '../data/categories';
import { useLanguage } from '../context/LanguageContext';
import { ShieldCheck, MapPin, Tag, ChevronDown, Building2, Star, Package, ArrowRight } from 'lucide-react';

/* ── Firma tipi ──────────────────────────────────────────── */
interface Firm {
  id:           string;
  name:         string;
  category:     string;
  kategoriler?: string[];
  city:         string;
  sehir?:       string;
  verified:     boolean;
  status:       'pending' | 'approved' | 'rejected';
  tanitimMetni?: string;
}

interface FirmStats {
  avg:       number;
  count:     number;
  ilanCount: number;
}

/* ── Category badge colors ───────────────────────────────── */
const CAT_COLORS: Record<string, string> = {
  'Prefabrik':           'bg-emerald-100 text-emerald-700',
  'Yaşam Konteynerleri': 'bg-blue-100 text-blue-700',
  'Tiny House':          'bg-purple-100 text-purple-700',
  'Çelik Yapılar':       'bg-gray-200 text-gray-700',
  'Ahşap Yapılar':       'bg-amber-100 text-amber-700',
  'Özel Projeler':       'bg-pink-100 text-pink-700',
  '2. El':               'bg-orange-100 text-orange-700',
};

/* ── Skeleton kart ───────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 animate-pulse flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 bg-gray-200 rounded-xl" />
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
        </div>
      </div>
      <div className="flex gap-2">
        <div className="h-5 bg-gray-100 rounded-full w-24" />
        <div className="h-5 bg-gray-100 rounded-full w-20" />
      </div>
      <div className="h-8 bg-gray-100 rounded-lg mt-auto" />
    </div>
  );
}

/* ── Component ───────────────────────────────────────────── */
export default function FirmalarPage() {
  const { t } = useLanguage();

  const [firms,          setFirms]          = useState<Firm[]>([]);
  const [stats,          setStats]          = useState<Record<string, FirmStats>>({});
  const [loading,        setLoading]        = useState(true);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterCity,     setFilterCity]     = useState('');

  /* Firestore'dan onaylı firmaları çek */
  useEffect(() => {
    const q = query(collection(db, 'firms'), where('status', '==', 'approved'), limit(200));
    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Firm));
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
      setStats((prev) => {
        const next = { ...prev };
        Object.entries(map).forEach(([id, v]) => {
          next[id] = { ...next[id], avg: v.total / v.count, count: v.count, ilanCount: next[id]?.ilanCount ?? 0 };
        });
        return next;
      });
    });
    return unsub;
  }, []);

  /* Firma başına ilan sayısı */
  useEffect(() => {
    if (firms.length === 0) return;
    const q = query(collection(db, 'ilanlar'), where('status', '==', 'aktif'));
    getDocs(q).then((snap) => {
      const countMap: Record<string, number> = {};
      snap.docs.forEach((d) => {
        const firmaId = (d.data() as { firmaId: string }).firmaId;
        countMap[firmaId] = (countMap[firmaId] || 0) + 1;
      });
      setStats((prev) => {
        const next = { ...prev };
        Object.entries(countMap).forEach(([id, cnt]) => {
          next[id] = { avg: next[id]?.avg ?? 0, count: next[id]?.count ?? 0, ilanCount: cnt };
        });
        return next;
      });
    });
  }, [firms]);

  /* Filtrelenmiş liste */
  const filtered = useMemo(() => firms.filter((f) => {
    if (filterCategory && f.category !== filterCategory) return false;
    if (filterCity && (f.city || f.sehir) !== filterCity) return false;
    return true;
  }), [firms, filterCategory, filterCity]);

  /* Unique şehirler */
  const cities = useMemo(() => [...new Set(firms.map((f) => f.city || f.sehir || '').filter(Boolean))].sort(), [firms]);

  return (
    <div className="flex flex-col min-h-screen">
      <SEOMeta
        title={`${t('firms.pageTitle')} | ModülerPazar`}
        description={t('firms.seoDesc')}
        url="/firmalar"
      />
      <Header />

      <main className="flex-1 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">

          {/* Sayfa başlığı */}
          <div className="mb-6">
            <nav className="text-sm text-gray-500 mb-3 flex items-center gap-2">
              <Link to="/" className="hover:text-emerald-600 transition">{t('common.home')}</Link>
              <span>/</span>
              <span className="text-gray-800">{t('nav.firms')}</span>
            </nav>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{t('nav.firms')}</h1>
            <p className="text-gray-500 mt-1 text-sm">
              {loading ? t('common.loading') : `${t('firms.countPrefix')} ${firms.length} ${t('firms.countSuffix')}`}
            </p>
          </div>

          {/* Filtreler */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex flex-wrap gap-3 items-center">
            <div className="relative">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                aria-label={t('firms.filterCategory')}
                className="appearance-none border border-gray-300 rounded-lg bg-white text-sm text-gray-700 px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">{t('header.allCategories')}</option>
                {CATEGORIES.map((c) => (
                  <option key={c.slug} value={c.name}>{t(CATEGORY_NAME_KEYS[c.slug])}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" aria-hidden="true" />
            </div>

            <div className="relative">
              <select
                value={filterCity}
                onChange={(e) => setFilterCity(e.target.value)}
                aria-label={t('firms.filterCity')}
                className="appearance-none border border-gray-300 rounded-lg bg-white text-sm text-gray-700 px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">{t('header.allCities')}</option>
                {cities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" aria-hidden="true" />
            </div>

            {!loading && (
              <span className="text-sm text-gray-500 ml-auto">
                {filtered.length} {t('firms.showing')}
              </span>
            )}
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
                {firms.length === 0 ? t('firms.noFirms') : t('firms.noMatch')}
              </p>
              {firms.length === 0 && (
                <Link
                  to="/satici-formu"
                  className="inline-block mt-4 text-sm text-emerald-600 hover:underline font-medium"
                >
                  {t('firms.beFirst')}
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((firm) => {
                const firmStats = stats[firm.id];
                const avg = firmStats?.avg ?? 0;
                const ratingCount = firmStats?.count ?? 0;
                const ilanCount = firmStats?.ilanCount ?? 0;

                return (
                  <Link
                    key={firm.id}
                    to={`/firmalar/${firm.id}/ilanlar`}
                    className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-emerald-300 hover:shadow-md transition flex flex-col gap-3 group"
                  >
                    {/* Avatar + Ad */}
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-xl font-extrabold text-emerald-700">
                          {firm.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-semibold text-gray-800 text-sm leading-snug truncate group-hover:text-emerald-600 transition">
                            {firm.name}
                          </p>
                          {firm.verified && (
                            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" aria-label={t('common.verified')} />
                          )}
                        </div>
                        {(firm.city || firm.sehir) && (
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" />
                            {firm.city || firm.sehir}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Kategori rozeti */}
                    <div className="flex flex-wrap gap-1.5">
                      {firm.category && (
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${CAT_COLORS[firm.category] ?? 'bg-gray-100 text-gray-600'}`}>
                          <Tag className="w-2.5 h-2.5" aria-hidden="true" />
                          {firm.category}
                        </span>
                      )}
                      {ilanCount > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                          <Package className="w-2.5 h-2.5" aria-hidden="true" />
                          {ilanCount} {t('common.listings')}
                        </span>
                      )}
                    </div>

                    {/* Ortalama puan */}
                    {ratingCount > 0 ? (
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-3.5 h-3.5 ${i < Math.round(avg) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`} />
                        ))}
                        <span className="text-xs text-gray-500 ml-0.5">
                          {avg.toFixed(1)} ({ratingCount} {t('puan.count')})
                        </span>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400">{t('puan.noRatings')}</p>
                    )}

                    {/* Buton */}
                    <div className="mt-auto pt-1">
                      <span className="flex items-center justify-center gap-2 w-full text-center bg-emerald-600 text-white text-xs font-semibold py-2.5 rounded-lg group-hover:bg-emerald-700 transition">
                        <Package className="w-3.5 h-3.5" />
                        {t('firms.viewListings')}
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          <p className="mt-6 text-xs text-gray-400 text-center">
            {t('firms.registerCta')}{' '}
            <Link to="/satici-formu" className="text-emerald-600 hover:underline">
              {t('firms.registerLink')}
            </Link>.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
