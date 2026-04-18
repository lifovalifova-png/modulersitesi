import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, getDocs, collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { CATEGORIES } from '../data/categories';
import type { Ilan } from '../hooks/useIlanlar';
import SEOMeta from '../components/SEOMeta';
import { useAuth } from '../context/AuthContext';
import { useFeatureFlags } from '../hooks/useFeatureFlags';
import { useLanguage } from '../context/LanguageContext';
import { toast } from 'sonner';
import {
  ShieldCheck, Star, Send, Globe,
  AlertCircle, ArrowLeft, ThumbsUp,
} from 'lucide-react';
import { trackWhatsAppClick } from '../lib/analytics';

/* ── Firma tipi (Firestore firms koleksiyonu) ───────────────── */
interface Firma {
  id:               string;
  name:             string;
  firmaType?:       'uretici' | 'satici' | '';
  vergiNo?:         string;
  firmaYapisi?:     string;
  phone?:           string;
  eposta?:          string;
  website?:         string;
  whatsapp?:        string;
  city?:            string;
  sehir?:           string;
  ilce?:            string;
  category?:        string;
  kategoriler?:     string[];
  hizmetBolgeleri?: string[];
  tanitimMetni?:    string;
  status:           'pending' | 'approved' | 'rejected';
  verified:         boolean;
  olusturmaTarihi?: { seconds: number } | null;
}

/* ── Puan tipi ───────────────────────────────────────────────── */
interface Yorum {
  id: string;
  firmaId: string;
  userId: string;
  userName?: string;
  puan: number;
  aciklama?: string;
  tarih: { seconds: number; nanoseconds: number } | null;
}

/* ── Helpers ─────────────────────────────────────────────────── */
const CAT_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.slug, c.name]));

function maskVergiNo(vn: string): string {
  if (!vn || vn.length < 4) return '**********';
  return vn.slice(0, 2) + '*'.repeat(vn.length - 4) + vn.slice(-2);
}

function formatDate(ts: { seconds: number } | null | undefined): string {
  if (!ts) return '—';
  return new Date(ts.seconds * 1000).toLocaleDateString('tr-TR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

/* ── Yıldız puanı (header için — beyaz tema) ─────────────────── */
function Stars({ rating, count }: { rating: number; count: number }) {
  const { t } = useLanguage();
  return (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        <span
          key={i}
          className={`material-symbols-outlined text-sm ${
            i < Math.round(rating) ? 'text-amber-400' : 'text-white/20'
          }`}
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          star
        </span>
      ))}
      <span className="ml-1.5 text-sm font-semibold text-white/90 font-body">
        {count > 0 ? `${rating.toFixed(1)} (${count} ${t('puan.count')})` : t('puan.none')}
      </span>
    </div>
  );
}

/* ── Yıldız puanı (kart için — koyu tema) ────────────────────── */
function StarsLight({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${
            i < Math.round(rating)
              ? 'text-amber-400 fill-amber-400'
              : 'text-gray-200 fill-gray-200'
          }`}
        />
      ))}
      {count > 0 && (
        <span className="ml-1 text-xs text-gray-500">{rating.toFixed(1)} ({count})</span>
      )}
    </div>
  );
}

/* ── Yıldız seçici (form) ────────────────────────────────────── */
function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          aria-label={`${n} yıldız`}
        >
          <Star
            className={`w-7 h-7 transition ${
              (hover || value) >= n
                ? 'text-amber-400 fill-amber-400'
                : 'text-gray-300 fill-gray-100'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

/* ── Ana bileşen ─────────────────────────────────────────────── */
export default function FirmaProfilPage() {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const { flags } = useFeatureFlags();
  const { t } = useLanguage();

  const [firma,    setFirma]    = useState<Firma | null>(null);
  const [ilanlar,  setIlanlar]  = useState<Ilan[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [notFound, setNotFound] = useState(false);

  /* Puan state */
  const [yorumlar,      setYorumlar]      = useState<Yorum[]>([]);
  const [puan,          setPuan]          = useState(0);
  const [aciklama,      setAciklama]      = useState('');
  const [yorumLoading,  setYorumLoading]  = useState(false);
  const [onayliMusteri, setOnayliMusteri] = useState<boolean | null>(null);

  /* Firma verisini çek */
  useEffect(() => {
    if (!id) { setNotFound(true); setLoading(false); return; }
    getDoc(doc(db, 'firms', id))
      .then((snap) => {
        if (!snap.exists()) {
          setNotFound(true);
        } else {
          setFirma({ id: snap.id, ...snap.data() } as Firma);
        }
        setLoading(false);
      })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [id]);

  /* Bu firmaya ait aktif ilanları çek */
  useEffect(() => {
    if (!id) return;
    const q = query(collection(db, 'ilanlar'), where('firmaId', '==', id));
    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as Ilan))
        .filter((d) => d.status === 'aktif');
      setIlanlar(docs);
    });
    return unsub;
  }, [id]);

  /* Bu firmaya ait puanları çek */
  useEffect(() => {
    if (!id) return;
    const q = query(collection(db, 'yorumlar'), where('firmaId', '==', id));
    const unsub = onSnapshot(q, (snap) => {
      setYorumlar(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Yorum)));
    });
    return unsub;
  }, [id]);

  /* Onaylı müşteri kontrolü */
  useEffect(() => {
    if (!currentUser || !id) { setOnayliMusteri(null); return; }
    setOnayliMusteri(null);
    const q = query(collection(db, 'taleplar'), where('email', '==', currentUser.email ?? ''));
    getDocs(q).then((snap) => {
      const found = snap.docs.some((d) => {
        const data = d.data();
        return Array.isArray(data.firmaGonderilenler) && data.firmaGonderilenler.includes(id);
      });
      setOnayliMusteri(found);
    }).catch(() => setOnayliMusteri(false));
  }, [currentUser, id]);

  /* Puan gönder */
  async function handlePuanGonder(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUser) { toast.error(t('puan.loginPrompt')); return; }
    if (puan === 0) { toast.error(t('puan.selectError')); return; }
    if (puan === 1 && aciklama.trim().length < 100) {
      toast.error(t('puan.aciklamaError'));
      return;
    }
    setYorumLoading(true);
    try {
      await addDoc(collection(db, 'yorumlar'), {
        firmaId:  id,
        userId:   currentUser.uid,
        userName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Kullanıcı',
        puan,
        aciklama: aciklama.trim() || null,
        tarih:    serverTimestamp(),
      });
      setPuan(0);
      setAciklama('');
      toast.success(t('puan.successMsg'));
    } catch {
      toast.error(t('puan.errorMsg'));
    } finally {
      setYorumLoading(false);
    }
  }

  /* ── Loading ──────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <div className="flex-1 flex items-center justify-center bg-surface-container-low">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  /* ── 404 ──────────────────────────────────────────────────── */
  if (notFound || !firma) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-4 py-20 bg-surface-container-low">
          <AlertCircle className="w-12 h-12 text-outline-variant" />
          <h2 className="text-xl font-bold text-on-surface font-headline">{t('firmaProfile.notFound')}</h2>
          <p className="text-on-surface-variant text-sm max-w-xs font-body">
            {t('firmaProfile.notFoundDesc')}
          </p>
          <Link
            to="/firmalar"
            className="flex items-center gap-2 text-primary hover:underline text-sm font-medium mt-2 font-body"
          >
            <ArrowLeft className="w-4 h-4" /> {t('firmaProfile.backToAll')}
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  /* ── Hesaplanan değerler ──────────────────────────────────── */
  const avgPuan = yorumlar.length > 0
    ? yorumlar.reduce((s, y) => s + y.puan, 0) / yorumlar.length
    : 0;
  const kullaniciPuanVerdi = currentUser
    ? yorumlar.some((y) => y.userId === currentUser.uid)
    : false;
  const kullanicininPuani = currentUser
    ? (yorumlar.find((y) => y.userId === currentUser.uid)?.puan ?? 0)
    : 0;
  const dagilim = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: yorumlar.filter((y) => y.puan === star).length,
  }));

  const firmaAdi    = firma.name || 'İsimsiz Firma';
  const firmaHarfi  = firmaAdi.charAt(0).toUpperCase();
  const sehir       = firma.city || firma.sehir || '';
  const kategoriler = Array.isArray(firma.kategoriler) ? firma.kategoriler : [];
  const bolgeler    = Array.isArray(firma.hizmetBolgeleri) ? firma.hizmetBolgeleri : [];
  const ilkKategori = kategoriler[0] || firma.category || '';

  const seoDesc = firma.tanitimMetni
    ? firma.tanitimMetni.slice(0, 160)
    : `${firma.name} — ${sehir ? sehir + ' ' : ''}${ilkKategori ? (CAT_MAP[ilkKategori] || ilkKategori) + ' ' : ''}firması. ModülerPazar'da ilanları ve iletişim bilgileri.`;

  return (
    <div className="flex flex-col min-h-screen bg-surface-container-low font-body">
      <SEOMeta
        title={firma.name}
        description={seoDesc}
        url={`/firma/${id}`}
      />

      {/* LocalBusiness JSON-LD — uses only server-owned config values, safe */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'LocalBusiness',
          name: firma.name,
          description: seoDesc,
          url: `https://www.modulerpazar.com/firma/${id}`,
          ...(sehir && { address: { '@type': 'PostalAddress', addressLocality: sehir, addressCountry: 'TR' } }),
          ...(firma.phone && { telephone: firma.phone }),
          ...(firma.eposta && { email: firma.eposta }),
          ...(firma.website && { sameAs: [firma.website] }),
          ...(avgPuan > 0 && yorumlar.length > 0 && {
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: avgPuan.toFixed(1),
              reviewCount: yorumlar.length,
              bestRating: 5,
              worstRating: 1,
            },
          }),
        }) }}
      />
      <Header />

      <main className="flex-1">

        {/* ══ DÜKKAN BAŞLIĞI ═══════════════════════════════════ */}
        <div className="bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-white">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-14">

            {/* Breadcrumb */}
            <nav className="text-xs text-white/50 mb-6 flex items-center gap-1.5 font-body">
              <Link to="/" className="hover:text-white transition">{t('common.home')}</Link>
              <span>/</span>
              <Link to="/firmalar" className="hover:text-white transition">{t('firmaProfile.breadcrumbFirms')}</Link>
              <span>/</span>
              <span className="text-white/80 truncate max-w-[160px]">{firmaAdi}</span>
            </nav>

            <div className="flex flex-col lg:flex-row gap-8 items-start">

              {/* Firma Avatar */}
              <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center text-white text-3xl font-bold font-headline flex-shrink-0 shadow-lg">
                {firmaHarfi}
              </div>

              {/* Firma Bilgileri */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h1 className="text-2xl md:text-3xl font-headline font-bold text-white">{firmaAdi}</h1>
                  {firma.verified && (
                    <span className="bg-primary text-on-primary text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1 font-headline">
                      <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span> {t('firmaProfile.verified')}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-4 text-white/60 text-sm font-body">
                  {sehir && (
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">location_on</span>
                      {sehir}{firma.ilce ? `, ${firma.ilce}` : ''}
                    </span>
                  )}
                  {ilkKategori && (
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">category</span>
                      {CAT_MAP[ilkKategori] || ilkKategori}
                    </span>
                  )}
                  {firma.olusturmaTarihi && (
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">calendar_today</span>
                      {new Date(firma.olusturmaTarihi.seconds * 1000).getFullYear()}'den beri
                    </span>
                  )}
                </div>
                <div className="mt-3">
                  <Stars rating={avgPuan} count={yorumlar.length} />
                </div>
              </div>

              {/* CTA Butonlar */}
              <div className="flex flex-col gap-3 flex-shrink-0">
                <Link
                  to={`/talep-olustur?firma=${id}`}
                  className="bg-primary hover:bg-primary-container text-on-primary font-bold px-8 py-3 rounded-xl transition-colors flex items-center gap-2 font-headline text-sm"
                >
                  <span className="material-symbols-outlined text-lg">request_quote</span>
                  {t('common.getQuote')}
                </Link>
                {firma.whatsapp && (
                  <a
                    href={`https://wa.me/${firma.whatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white/10 hover:bg-white/20 text-white font-bold px-8 py-3 rounded-xl transition-colors flex items-center gap-2 font-headline text-sm"
                  >
                    <span className="material-symbols-outlined text-lg">chat</span>
                    {t('firmaProfile.whatsapp')}
                  </a>
                )}
                {firma.website && (
                  <a
                    href={firma.website.startsWith('http') ? firma.website : `https://${firma.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white/10 hover:bg-white/20 text-white font-bold px-8 py-3 rounded-xl transition-colors flex items-center gap-2 font-headline text-sm"
                  >
                    <span className="material-symbols-outlined text-lg">language</span>
                    {t('firmaProfile.website')}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ══ ANA İÇERİK ═════════════════════════════════════ */}
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-12 grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Sol geniş: Ürünler & İlanlar ────────────────── */}
          <div className="lg:col-span-2 space-y-6">

            {/* İlan başlığı */}
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-headline font-bold text-on-surface">
                {t('firmaProfile.listings')}
                <span className="ml-2 text-sm font-normal text-on-surface-variant">({ilanlar.length})</span>
              </h2>
            </div>

            {/* İlan grid */}
            {ilanlar.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {ilanlar.map((ilan) => (
                  <Link key={ilan.id} to={`/ilan/${ilan.id}`}
                        className="group bg-white rounded-2xl overflow-hidden border border-outline-variant/20 hover:shadow-xl transition-all duration-300">
                    <div className="aspect-video overflow-hidden bg-surface-container-low">
                      {ilan.gorseller?.[0] ? (
                        <img src={ilan.gorseller[0]} alt={ilan.baslik}
                             className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                             loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="material-symbols-outlined text-4xl text-outline-variant">home</span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      {ilan.acil && (
                        <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase mr-2 font-headline">Acil</span>
                      )}
                      <h3 className="font-headline font-bold text-on-surface mt-2 line-clamp-2 group-hover:text-primary transition-colors">
                        {ilan.baslik}
                      </h3>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xl font-black text-primary font-headline">
                          {ilan.fiyat ? `₺${ilan.fiyat.toLocaleString('tr-TR')}` : 'Fiyat sorun'}
                        </span>
                        <span className="text-xs text-on-surface-variant flex items-center gap-1 font-body">
                          <span className="material-symbols-outlined text-sm">location_on</span>
                          {ilan.sehir}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-outline-variant/20">
                <span className="material-symbols-outlined text-5xl text-outline-variant mb-4">storefront</span>
                <p className="text-on-surface-variant font-medium font-headline">{t('firmaProfile.noListings')}</p>
                <p className="text-outline-variant text-sm mt-1 font-body">Bu firma yakında ilan ekleyecek</p>
              </div>
            )}

            {/* Hizmet Kategorileri */}
            {kategoriler.length > 0 && (
              <div className="bg-white rounded-2xl p-6 border border-outline-variant/20">
                <h2 className="font-bold text-on-surface mb-3 flex items-center gap-2 font-headline">
                  <span className="material-symbols-outlined text-primary text-lg">category</span> {t('firmaProfile.categories')}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {kategoriler.map((slug) => (
                    <Link
                      key={slug}
                      to={`/kategori/${slug}`}
                      className="inline-flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition font-body"
                    >
                      {CAT_MAP[slug] || slug}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Hizmet Bölgeleri */}
            {bolgeler.length > 0 && (
              <div className="bg-white rounded-2xl p-6 border border-outline-variant/20">
                <h2 className="font-bold text-on-surface mb-3 flex items-center gap-2 font-headline">
                  <span className="material-symbols-outlined text-primary text-lg">pin_drop</span> {t('firmaProfile.regions')}
                </h2>
                <div className="flex flex-wrap gap-1.5">
                  {bolgeler.map((bolge) => (
                    <span
                      key={bolge}
                      className="inline-block text-xs font-medium px-2.5 py-1 rounded-full bg-surface-container-highest text-on-surface-variant font-body"
                    >
                      {bolge}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Puanlar & Değerlendirmeler */}
            {flags.puanlamaSistemi && (
              <div className="bg-white rounded-2xl border border-outline-variant/20 p-6">
                <h2 className="font-bold text-on-surface mb-4 flex items-center gap-2 font-headline">
                  <ThumbsUp className="w-4 h-4 text-primary" />
                  {t('puan.title')}
                  {yorumlar.length > 0 && (
                    <span className="text-xs font-semibold bg-tertiary-fixed text-tertiary px-2 py-0.5 rounded-full">
                      {avgPuan.toFixed(1)} / 5
                    </span>
                  )}
                </h2>

                {yorumlar.length > 0 ? (
                  <div className="flex gap-6 mb-6">
                    <div className="text-center flex-shrink-0">
                      <p className="text-4xl font-bold text-on-surface font-headline">{avgPuan.toFixed(1)}</p>
                      <StarsLight rating={avgPuan} count={0} />
                      <p className="text-xs text-on-surface-variant mt-1 font-body">{yorumlar.length} {t('puan.count')}</p>
                    </div>
                    <div className="flex-1 space-y-1.5 self-center">
                      {dagilim.map(({ star, count }) => {
                        const pct = yorumlar.length > 0 ? (count / yorumlar.length) * 100 : 0;
                        return (
                          <div key={star} className="flex items-center gap-2">
                            <span className="text-xs text-on-surface-variant w-3 text-right">{star}</span>
                            <Star className="w-3 h-3 text-amber-400 fill-amber-400 flex-shrink-0" />
                            <div className="flex-1 h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                              <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-xs text-on-surface-variant w-5">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-on-surface-variant italic mb-4 font-body">{t('puan.none')}</p>
                )}

                {/* Form durumu */}
                {!currentUser ? (
                  <div className="border-t border-outline-variant/20 pt-4">
                    <Link
                      to="/giris"
                      className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline font-medium font-body"
                    >
                      {t('puan.loginPrompt')}
                    </Link>
                  </div>
                ) : kullaniciPuanVerdi ? (
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-sm text-primary font-medium flex items-center gap-2 font-body">
                    {t('puan.yourRating')} <StarsLight rating={kullanicininPuani} count={0} />
                  </div>
                ) : onayliMusteri === null ? (
                  <div className="border-t border-outline-variant/20 pt-4 text-sm text-on-surface-variant font-body">{t('puan.checking')}</div>
                ) : !onayliMusteri ? (
                  <div className="bg-surface-container-low border border-outline-variant/20 rounded-xl p-4 text-sm text-on-surface-variant font-body">
                    {t('puan.eligibility')}
                  </div>
                ) : (
                  <form onSubmit={handlePuanGonder} className="border-t border-outline-variant/20 pt-4">
                    <p className="text-sm font-semibold text-on-surface mb-3 font-headline">{t('puan.formTitle')}</p>
                    <div className="mb-3">
                      <label className="block text-xs text-on-surface-variant mb-1 font-body">{t('puan.starLabel')}</label>
                      <StarPicker value={puan} onChange={setPuan} />
                    </div>
                    {puan === 1 && (
                      <div className="mb-3">
                        <label className="block text-xs text-on-surface-variant mb-1 font-body">
                          {t('puan.aciklamaLabel')} <span className="text-red-500">*</span>
                          <span className="ml-1 text-outline-variant">({aciklama.trim().length}/100 {t('puan.aciklamaRequired')})</span>
                        </label>
                        <textarea
                          value={aciklama}
                          onChange={(e) => setAciklama(e.target.value)}
                          rows={4}
                          placeholder={t('puan.aciklamaPlaceholder')}
                          className="w-full px-3 py-2 border border-outline-variant rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary font-body"
                        />
                      </div>
                    )}
                    <button
                      type="submit"
                      disabled={yorumLoading}
                      className="bg-primary hover:bg-primary-container text-on-primary text-sm font-semibold px-4 py-2 rounded-xl transition disabled:opacity-60 font-headline"
                    >
                      {yorumLoading ? t('common.sending') : t('puan.submit')}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* ── Sağ dar: Firma bilgi kartları ────────────────── */}
          <div className="space-y-4">

            {/* Hakkında */}
            <div className="bg-white rounded-2xl p-6 border border-outline-variant/20">
              <h3 className="font-headline font-bold text-on-surface mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">info</span> {t('firmaProfile.about')}
              </h3>
              {firma.tanitimMetni ? (
                <p className="text-on-surface-variant text-sm leading-relaxed whitespace-pre-line font-body">
                  {firma.tanitimMetni}
                </p>
              ) : (
                <p className="text-on-surface-variant text-sm italic font-body">
                  {t('firmaProfile.noAbout')}
                </p>
              )}
            </div>

            {/* Firma Bilgileri kartı */}
            <div className="bg-white rounded-2xl p-6 border border-outline-variant/20">
              <h3 className="font-headline font-bold text-on-surface mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">business</span> {t('firmaProfile.details')}
              </h3>
              <div className="space-y-3 text-sm">
                {sehir && (
                  <div className="flex items-center gap-3 text-on-surface-variant font-body">
                    <span className="material-symbols-outlined text-primary text-lg">location_city</span>
                    {sehir}{firma.ilce ? `, ${firma.ilce}` : ''}
                  </div>
                )}
                {ilkKategori && (
                  <div className="flex items-center gap-3 text-on-surface-variant font-body">
                    <span className="material-symbols-outlined text-primary text-lg">category</span>
                    {CAT_MAP[ilkKategori] || ilkKategori}
                  </div>
                )}
                {firma.firmaType && (
                  <div className="flex items-center gap-3 text-on-surface-variant font-body">
                    <span className="material-symbols-outlined text-primary text-lg">
                      {firma.firmaType === 'uretici' ? 'factory' : 'store'}
                    </span>
                    {firma.firmaType === 'uretici' ? t('firmaProfile.producer') : t('firmaProfile.seller')}
                  </div>
                )}
                {firma.vergiNo && (
                  <div className="flex items-center gap-3 text-on-surface-variant font-body">
                    <span className="material-symbols-outlined text-primary text-lg">tag</span>
                    <span className="font-mono tracking-wider">{maskVergiNo(firma.vergiNo)}</span>
                  </div>
                )}
                {firma.olusturmaTarihi && (
                  <div className="flex items-center gap-3 text-on-surface-variant font-body">
                    <span className="material-symbols-outlined text-primary text-lg">event</span>
                    {formatDate(firma.olusturmaTarihi)}
                  </div>
                )}
              </div>
            </div>

            {/* İletişim kartı */}
            <div className="bg-white rounded-2xl p-6 border border-outline-variant/20">
              <h3 className="font-headline font-bold text-on-surface mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">contact_page</span> {t('firmaProfile.contact')}
              </h3>

              <Link
                to={`/talep-olustur?firma=${id}`}
                className="flex items-center justify-center gap-2 w-full bg-primary hover:bg-primary-container text-on-primary font-bold py-3 rounded-xl transition text-sm shadow-sm font-headline"
              >
                <Send className="w-4 h-4" /> {t('common.getQuote')}
              </Link>

              {firma.whatsapp && (
                <a
                  href={`https://wa.me/${firma.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(
                    `Merhaba, ModülerPazar'dan ulaşıyorum. ${firma.name} firmanız hakkında bilgi almak istiyorum.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackWhatsAppClick(firma.id)}
                  className="flex items-center justify-center gap-2 w-full mt-2 bg-[#25D366] hover:bg-[#1da851] text-white font-bold py-3 rounded-xl transition text-sm shadow-sm font-headline"
                >
                  <span className="material-symbols-outlined text-lg">chat</span>
                  WhatsApp ile İletişime Geç
                </a>
              )}

              {firma.website && (
                <a
                  href={firma.website.startsWith('http') ? firma.website : `https://${firma.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full mt-2 border border-outline-variant/30 text-on-surface-variant hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 py-2.5 rounded-xl transition text-sm font-medium font-body"
                >
                  <Globe className="w-4 h-4" /> {t('firmaProfile.website')}
                </a>
              )}

              <p className="text-xs text-on-surface-variant text-center mt-3 leading-relaxed font-body">
                {t('firmaProfile.contactNote')}
              </p>
            </div>

            {/* Teklif İste (sticky sidebar CTA) */}
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 text-center sticky top-28">
              <p className="text-primary font-medium text-sm mb-4 font-headline">Bu firmadan ücretsiz teklif alın</p>
              <Link
                to={`/talep-olustur?firma=${id}`}
                className="w-full inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-container text-on-primary font-bold py-3 rounded-xl transition-colors font-headline text-sm"
              >
                <span className="material-symbols-outlined text-lg">request_quote</span>
                {t('common.getQuote')}
              </Link>
            </div>

            {/* Doğrulama Rozeti */}
            {firma.verified && (
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-primary font-headline">{t('firmaProfile.verifiedFirm')}</p>
                  <p className="text-xs text-primary/70 mt-0.5 leading-relaxed font-body">
                    {t('firmaProfile.verifiedDesc')}
                  </p>
                </div>
              </div>
            )}

            {/* Tüm Firmalara Dön */}
            <Link
              to="/firmalar"
              className="flex items-center justify-center gap-2 w-full border border-outline-variant/30 text-on-surface-variant hover:border-primary hover:text-primary py-2.5 rounded-xl transition text-xs font-medium font-body"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> {t('firmaProfile.seeAll')}
            </Link>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
