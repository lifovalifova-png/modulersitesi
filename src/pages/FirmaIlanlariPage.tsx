import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEOMeta from '../components/SEOMeta';
import { CATEGORIES } from '../data/categories';
import { formatFiyat, type Ilan } from '../hooks/useIlanlar';
import {
  ShieldCheck, MapPin, Tag, Star, Send, Building2,
  Package, ArrowLeft, AlertCircle, MessageSquare,
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

/* ── Component ───────────────────────────────────────────── */
export default function FirmaIlanlariPage() {
  const { firmaId } = useParams<{ firmaId: string }>();

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
          <h1 className="text-xl font-bold text-gray-700">Firma bulunamadı</h1>
          <p className="text-gray-500 text-sm max-w-xs">
            Aradığınız firma mevcut değil veya kaldırılmış olabilir.
          </p>
          <Link
            to="/firmalar"
            className="flex items-center gap-2 text-emerald-600 hover:underline text-sm font-medium mt-2"
          >
            <ArrowLeft className="w-4 h-4" /> Tüm Firmalara Dön
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const firmaAdi   = firma.name || 'İsimsiz Firma';
  const firmaHarfi = firmaAdi.charAt(0).toUpperCase();
  const sehir      = firma.city || firma.sehir || '';
  const kategoriler = Array.isArray(firma.kategoriler) ? firma.kategoriler : [];
  const ilkKategori = kategoriler[0] || firma.category || '';

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <SEOMeta
        title={`${firmaAdi} İlanları | ModülerPazar`}
        description={`${firmaAdi} firmasının aktif ilanları. ${sehir ? sehir + ' — ' : ''}ModülerPazar'da inceleyin.`}
        url={`/firmalar/${firmaId}/ilanlar`}
      />
      <Header />

      <main className="flex-1">

        {/* ══ BANNER ═══════════════════════════════════════════ */}
        <div className="bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600 text-white">
          <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">

            {/* Breadcrumb */}
            <nav className="text-xs text-white/60 mb-5 flex items-center gap-1.5">
              <Link to="/" className="hover:text-white transition">Ana Sayfa</Link>
              <span>/</span>
              <Link to="/firmalar" className="hover:text-white transition">Firmalar</Link>
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
                      <ShieldCheck className="w-3.5 h-3.5" /> Doğrulanmış
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
                      {ilanlar.length} aktif ilan
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
                    {yorumSay > 0 ? `${avgPuan.toFixed(1)} (${yorumSay} değerlendirme)` : 'Henüz değerlendirme yok'}
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
                  <MessageSquare className="w-4 h-4" /> Firmayı Değerlendir
                </Link>
                <Link
                  to={`/talep-olustur?firma=${firmaId}`}
                  className="flex items-center gap-2 bg-white text-emerald-700 font-bold px-5 py-2.5 rounded-xl hover:bg-emerald-50 transition shadow-sm text-sm whitespace-nowrap"
                >
                  <Send className="w-4 h-4" /> Teklif Al
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
              Aktif İlanlar
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
              <ArrowLeft className="w-4 h-4" /> Tüm Firmalar
            </Link>
          </div>

          {ilanlar.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm font-medium">
                Bu firmaya ait aktif ilan bulunmuyor.
              </p>
              <Link
                to={`/firma/${firmaId}`}
                className="inline-block mt-4 text-sm text-emerald-600 hover:underline font-medium"
              >
                Firma profilini görüntüle →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {ilanlar.map((ilan) => (
                <Link
                  key={ilan.id}
                  to={`/ilan/${ilan.id}`}
                  className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-emerald-300 hover:shadow-md transition group"
                >
                  {/* Görsel */}
                  {ilan.gorseller?.[0] ? (
                    <div className="aspect-[4/3] overflow-hidden">
                      <img
                        src={ilan.gorseller[0]}
                        alt={ilan.baslik}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <div className="aspect-[4/3] bg-gray-100 flex items-center justify-center">
                      <Package className="w-10 h-10 text-gray-300" />
                    </div>
                  )}

                  {/* İçerik */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-800 text-sm line-clamp-2 group-hover:text-emerald-600 transition mb-2">
                      {ilan.baslik}
                    </h3>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mb-3">
                      {ilan.sehir && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {ilan.sehir}
                        </span>
                      )}
                      {ilan.kategori && (
                        <span className="flex items-center gap-1">
                          <Tag className="w-3 h-3" /> {ilan.kategori}
                        </span>
                      )}
                    </div>

                    {/* Özellikler */}
                    {ilan.ozellikler?.metrekare && (
                      <p className="text-xs text-gray-400 mb-2">{ilan.ozellikler.metrekare} m²</p>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <p className="text-lg font-bold text-emerald-600">{formatFiyat(ilan.fiyat)}</p>
                      {ilan.acil && (
                        <span className="text-xs font-semibold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                          Acil
                        </span>
                      )}
                      {ilan.indirimli && !ilan.acil && (
                        <span className="text-xs font-semibold bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full">
                          İndirimli
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
