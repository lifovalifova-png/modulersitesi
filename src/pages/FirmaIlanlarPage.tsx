import { useState, useEffect, memo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEOMeta from '../components/SEOMeta';
import { CATEGORIES } from '../data/categories';
import { formatFiyat, formatTarih, type Ilan } from '../hooks/useIlanlar';
import { useLanguage } from '../context/LanguageContext';
import {
  ShieldCheck, MapPin, Tag, Star, Send,
  Package, ArrowLeft, AlertCircle, Eye, Calendar, Zap,
} from 'lucide-react';

/* ── Firma tipi ──────────────────────────────────────────── */
interface Firma {
  id:               string;
  name:             string;
  firmaType?:       'uretici' | 'satici' | '';
  city?:            string;
  sehir?:           string;
  ilce?:            string;
  category?:        string;
  kategoriler?:     string[];
  tanitimMetni?:    string;
  status:           'pending' | 'approved' | 'rejected';
  verified:         boolean;
}

interface Yorum {
  firmaId: string;
  puan:    number;
}

const CAT_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.slug, c.name]));

const CAT_COLORS: Record<string, string> = {
  'Prefabrik':           'bg-emerald-100 text-emerald-700',
  'Yaşam Konteynerleri': 'bg-blue-100 text-blue-700',
  'Tiny House':          'bg-purple-100 text-purple-700',
  'Çelik Yapılar':       'bg-gray-200 text-gray-700',
  'Ahşap Yapılar':       'bg-amber-100 text-amber-700',
  'Özel Projeler':       'bg-pink-100 text-pink-700',
  '2. El':               'bg-orange-100 text-orange-700',
};

/* ── İlan kartı (CategoryPage GridCard ile aynı yapı) ────── */
const IlanGridCard = memo(function IlanGridCard({ ilan }: { ilan: Ilan }) {
  const { t } = useLanguage();
  const img = ilan.gorseller[0] ?? '';
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md hover:border-emerald-200 transition flex flex-col">
      <Link to={`/ilan/${ilan.id}`} className="block">
        <div className="relative h-48 bg-gray-100">
          {img ? (
            <img src={img} alt={ilan.baslik} loading="lazy" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300 text-4xl">🏠</div>
          )}
          {ilan.acilSatis && (
            <span className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1 animate-pulse">
              🔴 {t('badge.urgentSale')}
            </span>
          )}
          {!ilan.acilSatis && ilan.acil && (
            <span className="absolute top-3 left-3 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1">
              <Zap className="w-2.5 h-2.5" />{t('badge.urgent')}
            </span>
          )}
          {ilan.indirimli && (
            <span className="absolute top-3 right-3 bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded-md">
              {t('badge.discounted')}
            </span>
          )}
        </div>
      </Link>
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center gap-1.5 flex-wrap mb-2">
          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${CAT_COLORS[ilan.kategori] ?? 'bg-gray-100 text-gray-600'}`}>
            <Tag className="w-2.5 h-2.5" />{ilan.kategori}
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
            <MapPin className="w-2.5 h-2.5" />{ilan.sehir}
          </span>
        </div>

        <Link to={`/ilan/${ilan.id}`}
          className="font-semibold text-gray-800 text-sm leading-snug line-clamp-2 hover:text-emerald-600 transition mb-2 flex-1">
          {ilan.baslik}
        </Link>

        <div className="flex items-end justify-between mb-2">
          <p className={`font-extrabold text-lg leading-none ${ilan.acilSatis ? 'text-red-600' : 'text-emerald-600'}`}>
            {ilan.acilSatis && ilan.acilSatisFiyat ? formatFiyat(ilan.acilSatisFiyat) : formatFiyat(ilan.fiyat)}
          </p>
          <span className="text-[10px] text-gray-400 flex items-center gap-1">
            <Calendar className="w-2.5 h-2.5" />{formatTarih(ilan.tarih)}
          </span>
        </div>

        {/* Stok badge */}
        <div className="mb-2">
          {(ilan.stokDurumu === undefined || ilan.stokDurumu === 'var') ? (
            <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200">{t('firms.inStock')}</span>
          ) : ilan.stokDurumu === 'tedarik' ? (
            <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 border border-yellow-200">{t('firms.supplyPending')}</span>
          ) : (
            <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200">{t('firms.outOfStock')}</span>
          )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-xs text-gray-500 truncate max-w-[120px]">{ilan.firmaAdi}</span>
            {ilan.firmaDogrulanmis && (
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" aria-label={t('common.verified')} />
            )}
          </div>
          <Link to={`/ilan/${ilan.id}`}
            className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 transition font-semibold flex-shrink-0">
            {t('category.getQuote')}
          </Link>
        </div>
      </div>
    </div>
  );
});

/* ── Component ───────────────────────────────────────────── */
export default function FirmaIlanlarPage() {
  const { firmaId } = useParams<{ firmaId: string }>();
  const { t } = useLanguage();

  const [firma,    setFirma]    = useState<Firma | null>(null);
  const [ilanlar,  setIlanlar]  = useState<Ilan[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [avgPuan,  setAvgPuan]  = useState(0);
  const [yorumSay, setYorumSay] = useState(0);

  /* Firma verisini çek */
  useEffect(() => {
    if (!firmaId) { setNotFound(true); setLoading(false); return; }
    getDoc(doc(db, 'firms', firmaId))
      .then((snap) => {
        if (!snap.exists()) {
          setNotFound(true);
        } else {
          setFirma({ id: snap.id, ...snap.data() } as Firma);
        }
        setLoading(false);
      })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [firmaId]);

  /* Bu firmaya ait aktif ilanları çek */
  useEffect(() => {
    if (!firmaId) return;
    const q = query(collection(db, 'ilanlar'), where('firmaId', '==', firmaId));
    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as Ilan))
        .filter((d) => d.status === 'aktif');
      setIlanlar(docs);
    });
    return unsub;
  }, [firmaId]);

  /* Puanları çek */
  useEffect(() => {
    if (!firmaId) return;
    const q = query(collection(db, 'yorumlar'), where('firmaId', '==', firmaId), where('onaylandi', '==', true));
    const unsub = onSnapshot(q, (snap) => {
      const yorumlar = snap.docs.map((d) => d.data() as Yorum);
      setYorumSay(yorumlar.length);
      if (yorumlar.length > 0) {
        const total = yorumlar.reduce((s, y) => s + y.puan, 0);
        setAvgPuan(total / yorumlar.length);
      } else {
        setAvgPuan(0);
      }
    });
    return unsub;
  }, [firmaId]);

  /* ── Loading ────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  /* ── 404 ────────────────────────────────────────────────── */
  if (notFound || !firma) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-4 py-20">
          <AlertCircle className="w-12 h-12 text-gray-300" />
          <h2 className="text-xl font-bold text-gray-700">{t('firmaProfile.notFound')}</h2>
          <p className="text-gray-500 text-sm max-w-xs">
            {t('firmaProfile.notFoundDesc')}
          </p>
          <Link
            to="/firmalar"
            className="flex items-center gap-2 text-emerald-600 hover:underline text-sm font-medium mt-2"
          >
            <ArrowLeft className="w-4 h-4" /> {t('firms.backToAll')}
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const firmaAdi   = firma.name || t('firms.unnamed');
  const firmaHarfi = firmaAdi.charAt(0).toUpperCase();
  const sehir      = firma.city || firma.sehir || '';
  const kategoriler = Array.isArray(firma.kategoriler) ? firma.kategoriler : [];
  const ilkKategori = kategoriler[0] || firma.category || '';

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <SEOMeta
        title={`${firmaAdi} ${t('firms.listingsSeoSuffix')} | ModülerPazar`}
        description={`${firmaAdi} ${t('firms.listingsSeoDesc')} ${sehir ? sehir + ' — ' : ''}ModülerPazar`}
        url={`/firmalar/${firmaId}/ilanlar`}
      />
      <Header />

      <main className="flex-1">

        {/* ══ BANNER ═══════════════════════════════════════════ */}
        <div className="bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600 text-white">
          <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">

            {/* Breadcrumb */}
            <nav className="text-xs text-white/60 mb-5 flex items-center gap-1.5">
              <Link to="/" className="hover:text-white transition">{t('common.home')}</Link>
              <span>/</span>
              <Link to="/firmalar" className="hover:text-white transition">{t('nav.firms')}</Link>
              <span>/</span>
              <span className="text-white/90 truncate max-w-[160px]">{firmaAdi}</span>
            </nav>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">

              {/* Avatar */}
              <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur border-2 border-white/30 flex items-center justify-center flex-shrink-0 shadow-lg">
                <span className="text-3xl font-extrabold text-white">{firmaHarfi}</span>
              </div>

              {/* Bilgiler */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-2xl md:text-3xl font-bold leading-tight">{firmaAdi}</h1>
                  {firma.verified && (
                    <span className="inline-flex items-center gap-1 bg-white/20 border border-white/30 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                      <ShieldCheck className="w-3.5 h-3.5" /> {t('firmaProfile.verified')}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 text-sm text-white/80 mb-3 mt-1">
                  {sehir && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {sehir}{firma.ilce ? `, ${firma.ilce}` : ''}
                    </span>
                  )}
                  {ilkKategori && (
                    <span className="flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5" />
                      {CAT_MAP[ilkKategori] || ilkKategori}
                    </span>
                  )}
                  {ilanlar.length > 0 && (
                    <span className="flex items-center gap-1">
                      <Package className="w-3.5 h-3.5" />
                      {ilanlar.length} {t('firms.activeListings')}
                    </span>
                  )}
                </div>

                {/* Puan */}
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.round(avgPuan)
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-white/30 fill-white/20'
                      }`}
                    />
                  ))}
                  <span className="ml-1.5 text-sm font-semibold text-white/90">
                    {yorumSay > 0 ? `${avgPuan.toFixed(1)} (${yorumSay} ${t('puan.count')})` : t('puan.noRatings')}
                  </span>
                </div>

                {/* Açıklama */}
                {firma.tanitimMetni && (
                  <p className="text-sm text-white/70 mt-3 line-clamp-2 max-w-2xl">
                    {firma.tanitimMetni}
                  </p>
                )}
              </div>

              {/* Aksiyon butonları */}
              <div className="flex flex-col gap-2 flex-shrink-0">
                <Link
                  to={`/firma/${firmaId}`}
                  className="flex items-center gap-2 bg-white/20 backdrop-blur border border-white/30 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-white/30 transition text-sm whitespace-nowrap"
                >
                  <Eye className="w-4 h-4" /> {t('firms.viewProfile')}
                </Link>
                <Link
                  to={`/talep-olustur?firma=${firmaId}`}
                  className="flex items-center gap-2 bg-white text-emerald-700 font-bold px-5 py-2.5 rounded-xl hover:bg-emerald-50 transition shadow-sm text-sm whitespace-nowrap"
                >
                  <Send className="w-4 h-4" /> {t('common.getQuote')}
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ══ İLANLAR GRID ════════════════════════════════════ */}
        <div className="max-w-7xl mx-auto px-4 py-8">

          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-emerald-600" />
              {t('firmaProfile.listings')}
              {ilanlar.length > 0 && (
                <span className="text-xs font-semibold bg-emerald-100 text-emerald-700 px-2.5 py-0.5 rounded-full">
                  {ilanlar.length}
                </span>
              )}
            </h2>
            <Link
              to="/firmalar"
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-emerald-600 transition"
            >
              <ArrowLeft className="w-4 h-4" /> {t('firms.backToAll')}
            </Link>
          </div>

          {ilanlar.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm font-medium">
                {t('firms.noListingsForFirm')}
              </p>
              <Link
                to={`/firma/${firmaId}`}
                className="inline-block mt-4 text-sm text-emerald-600 hover:underline font-medium"
              >
                {t('firms.viewProfileLink')}
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {ilanlar.map((ilan) => (
                <IlanGridCard key={ilan.id} ilan={ilan} />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
