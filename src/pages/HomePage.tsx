import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  collection, query, where,
  onSnapshot, orderBy, limit,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  ArrowRight, ChevronRight, Search, CheckSquare, FileText, BarChart2,
  UserPlus, ClipboardList, Handshake,
  ShieldCheck, Tag, MapPin, Lock,
  Sparkles, MessageSquare,
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEOMeta from '../components/SEOMeta';
import FlashDealsCarousel from '../components/FlashDealsCarousel';
import IlanMiniCard from '../components/IlanMiniCard';
import HeroIlanKarti from '@/components/HeroIlanKarti';
import { CATEGORIES, CATEGORY_NAME_KEYS } from '@/data/categories';
import { CITIES } from '@/data/sehirler';
import { useLanguage } from '../context/LanguageContext';
import { useFeatureFlags } from '../hooks/useFeatureFlags';
import type { Ilan } from '../hooks/useIlanlar';
import type { Etkinlik } from '../types/etkinlik';
import { TUR_LABELS, TUR_COLORS } from '../types/etkinlik';

/* ─── CountUp: 0'dan hedefe sayma animasyonu ────────────── */
/* Material Symbols ikonları — kategori kartları için */
const CATEGORY_MATERIAL_ICONS: Record<string, string> = {
  'prefabrik':           'home',
  'celik-yapilar':       'construction',
  'yasam-konteynerleri': 'inventory_2',
  'ikinci-el':           'recycling',
  'ozel-projeler':       'architecture',
  'ahsap-yapilar':       'park',
  'tiny-house':          'cottage',
};

/* Kategori gradient renkleri */
const CATEGORY_GRADIENTS: Record<string, string> = {
  'prefabrik':           'from-emerald-500 to-emerald-700',
  'celik-yapilar':       'from-blue-500 to-blue-700',
  'yasam-konteynerleri': 'from-orange-500 to-orange-700',
  'ikinci-el':           'from-violet-500 to-violet-700',
  'ozel-projeler':       'from-rose-500 to-rose-700',
  'ahsap-yapilar':       'from-amber-600 to-amber-800',
  'tiny-house':          'from-teal-500 to-teal-700',
};

/* Foto katmanı olan kategoriler — yoksa gradient+ikon render'ına düşer */
const CATEGORY_IMAGES: Record<string, string> = {
  'prefabrik':           '/categories/prefabrik.webp',
  'celik-yapilar':       '/categories/celik-yapilar.webp',
  'yasam-konteynerleri': '/categories/yasam-konteynerleri.webp',
  'ahsap-yapilar':       '/categories/ahsap-yapilar.webp',
  'tiny-house':          '/categories/tiny-house.webp',
};

/* Hero arka planı — Ken Burns crossfade sırası (5 görsel, ~6sn/görsel) */
const HERO_BG_IMAGES = [
  '/categories/prefabrik.webp',
  '/categories/celik-yapilar.webp',
  '/categories/yasam-konteynerleri.webp',
  '/categories/ahsap-yapilar.webp',
  '/categories/tiny-house.webp',
];

/* ─── AI rate limit — localStorage kalıcılığı ───────────── */
const RL_KEY = 'mp_chat_rl';

function loadRemaining(): number {
  try {
    const raw = localStorage.getItem(RL_KEY);
    if (!raw) return 10;
    const { date, remaining } = JSON.parse(raw);
    if (date !== new Date().toDateString()) return 10;
    return typeof remaining === 'number' ? remaining : 10;
  } catch {
    return 10;
  }
}

function saveRemaining(remaining: number) {
  try {
    localStorage.setItem(RL_KEY, JSON.stringify({ date: new Date().toDateString(), remaining }));
  } catch { /* ignore */ }
}

/* ─── Kategori çıkarımı ──────────────────────────────────── */
function extractSlug(text: string): string {
  const t = text.toLowerCase();
  if (t.includes('konteyner'))                              return 'yasam-konteynerleri';
  if (t.includes('tiny house') || t.includes('tiny-house')) return 'tiny-house';
  if (t.includes('çelik') || t.includes('celik'))          return 'celik-yapilar';
  if (t.includes('ahşap') || t.includes('ahsap'))          return 'ahsap-yapilar';
  if (t.includes('özel proje') || t.includes('ozel'))      return 'ozel-projeler';
  return 'prefabrik';
}

/* ─── Bileşen ────────────────────────────────────────────── */
export default function HomePage() {
  const navigate = useNavigate();
  const { lang, t } = useLanguage();
  const { flags } = useFeatureFlags();
  const [activeTab, setActiveTab] = useState<'customer' | 'producer'>('customer');

  /* ─── Hero arama (şehir + kategori dropdown → CategoryPage) ─── */
  const [heroCity, setHeroCity] = useState('');
  const [heroCat,  setHeroCat]  = useState('');

  function handleHeroSearch() {
    const qs   = heroCity ? `?sehir=${encodeURIComponent(heroCity)}` : '';
    const path = heroCat ? `/kategori/${heroCat}` : '/ilanlar';
    navigate(`${path}${qs}`);
  }

  /* ─── Firestore gerçek sayılar ───────────────────────────── */

  /* ─── Kayan Haber Bandı ───────────────────────────────────── */
  interface MiniHaber { id: string; baslikTr: string; baslikEn: string; kaynak: string }
  const [haberler, setHaberler] = useState<MiniHaber[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, 'haberler'),
      where('yayinda', '==', true),
      orderBy('tarih', 'desc'),
      limit(5),
    );
    const unsub = onSnapshot(q, (snap) => {
      const raw = snap.docs.map((d) => {
        const data = d.data() as Record<string, unknown>;
        return {
          id: d.id,
          baslikTr: (data.baslikTr ?? data.baslik ?? '') as string,
          baslikEn: (data.baslikEn ?? '') as string,
          kaynak: (data.kaynak ?? '') as string,
        };
      });
      const seen = new Set<string>();
      const docs = raw.filter((h) => {
        const key = h.baslikTr.trim().toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      setHaberler(docs);
    }, (err) => {
      console.error('Haber bandı hata:', err);
    });
    return unsub;
  }, []);

  /* ─── Son ilanlar — Hero sağ paneli (ilk 6) + "Son Eklenen" grid (6-18) ─── */
  const [sonIlanlar, setSonIlanlar] = useState<Ilan[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, 'ilanlar'),
      where('status', '==', 'aktif'),
      orderBy('tarih', 'desc'),
      limit(18),
    );
    const unsub = onSnapshot(q, (snap) => {
      setSonIlanlar(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Ilan)));
    });
    return () => unsub();
  }, []);

  /* ─── Yaklaşan etkinlikler (3 adet) ────────────────────────── */
  const [yakinEtkinlikler, setYakinEtkinlikler] = useState<Etkinlik[]>([]);

  useEffect(() => {
    const now = new Date();
    const nowTs = { seconds: Math.floor(now.getTime() / 1000), nanoseconds: 0 };
    const q = query(
      collection(db, 'etkinlikler'),
      where('durum', '==', 'yayinda'),
      where('bitisTarihi', '>=', nowTs),
      orderBy('bitisTarihi', 'asc'),
      limit(3),
    );
    const unsub = onSnapshot(q, (snap) => {
      setYakinEtkinlikler(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Etkinlik)));
    }, () => {});
    return unsub;
  }, []);

  /* ─── Translated data arrays ────────────────────────────── */
  const CUSTOMER_STEPS = [
    { icon: Search,      title: t('step.b1.title'), desc: t('step.b1.desc'), materialIcon: 'search' },
    { icon: CheckSquare, title: t('step.b2.title'), desc: t('step.b2.desc'), materialIcon: 'compare_arrows' },
    { icon: FileText,    title: t('step.b3.title'), desc: t('step.b3.desc'), materialIcon: 'description' },
    { icon: BarChart2,   title: t('step.b4.title'), desc: t('step.b4.desc'), materialIcon: 'handshake' },
  ];

  const PRODUCER_STEPS = [
    { icon: UserPlus,      title: t('step.s1.title'), desc: t('step.s1.desc'), materialIcon: 'person_add' },
    { icon: ClipboardList, title: t('step.s2.title'), desc: t('step.s2.desc'), materialIcon: 'post_add' },
    { icon: Handshake,     title: t('step.s3.title'), desc: t('step.s3.desc'), materialIcon: 'payments' },
  ];

  const TRUST_ITEMS = [
    { icon: ShieldCheck, title: t('why.verified.title'),  desc: t('why.verified.desc'),  color: 'bg-emerald-100 text-emerald-600', materialIcon: 'verified_user' },
    { icon: Tag,         title: t('why.freeQuote.title'), desc: t('why.freeQuote.desc'), color: 'bg-blue-100 text-blue-600', materialIcon: 'sell' },
    { icon: MapPin,      title: t('why.regional.title'),  desc: t('why.regional.desc'),  color: 'bg-amber-100 text-amber-600', materialIcon: 'pin_drop' },
    { icon: Lock,        title: t('why.kvkk.title'),      desc: t('why.kvkk.desc'),      color: 'bg-purple-100 text-purple-600', materialIcon: 'lock' },
  ];

  /* AI widget state */
  const [aiQuery,     setAiQuery]     = useState('');
  const [aiResponse,  setAiResponse]  = useState('');
  const [aiLoading,   setAiLoading]   = useState(false);
  const [aiError,     setAiError]     = useState('');
  const [aiSlug,      setAiSlug]      = useState('prefabrik');
  const [aiRemaining, setAiRemaining] = useState<number>(() => loadRemaining());
  const resultRef = useRef<HTMLDivElement>(null);

  const handleAsk = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const q = aiQuery.trim();
    if (!q || aiRemaining === 0) return;
    setAiLoading(true);
    setAiResponse('');
    setAiError('');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: q }),
      });
      const data = await res.json() as {
        reply?:     string;
        remaining?: number;
        error?:     string;
      };

      const serverRemaining = data.remaining ?? (aiRemaining - 1);

      if (!res.ok) {
        const rem = res.status === 429 ? 0 : serverRemaining;
        setAiRemaining(rem);
        saveRemaining(rem);
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }

      setAiRemaining(serverRemaining);
      saveRemaining(serverRemaining);
      const text = data.reply ?? '';
      setAiResponse(text);
      setAiSlug(extractSlug(text));
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Bir hata oluştu.');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen font-body">
      <SEOMeta
        title="ModülerPazar — Türkiye'nin Modüler Yapı Pazaryeri"
        description="Prefabrik ev, çelik yapı, konteyner ev ve tiny house ilanları. Doğrulanmış firmalardan ücretsiz teklif alın."
        url="/"
      />
      <Header />

      <main className="flex-1">

        {/* ── Hero ─────────────────────────────────────────── */}
        <section className="relative overflow-hidden bg-on-surface">
          {/* Ken Burns crossfade arka plan — 5 kategori görseli */}
          <div className="absolute inset-0" aria-hidden="true">
            {HERO_BG_IMAGES.map((src, i) => (
              <img
                key={src}
                src={src}
                alt=""
                aria-hidden="true"
                loading={i === 0 ? 'eager' : 'lazy'}
                fetchPriority={i === 0 ? 'high' : undefined}
                style={{ animationDelay: `${i * 6}s` }}
                className={`hero-kb-layer${i === 0 ? ' hero-kb-layer--first' : ''}`}
              />
            ))}
          </div>
          {/* Okunabilirlik overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-on-surface/90 via-on-surface/80 to-on-surface/70" />

          {/* ── Kayan Haber Bandı ────── */}
          {haberler.length > 0 && (
            <div className="relative w-full bg-white/5 backdrop-blur-sm border-b border-white/10 py-2.5 overflow-hidden">
              <div className="max-w-7xl mx-auto px-4 flex items-center gap-4">
                <span className="bg-tertiary-fixed text-tertiary font-bold px-3 py-1 rounded-full text-sm whitespace-nowrap flex-shrink-0 font-headline">
                  <span className="material-symbols-outlined text-base align-middle mr-1" aria-hidden="true">newspaper</span>
                  {t('haber.sektorHaberleri')}
                </span>
                <div className="overflow-hidden flex-1">
                  <div className="flex gap-6 animate-marquee whitespace-nowrap">
                    {[...haberler, ...haberler].map((h, i) => (
                      <span key={`${h.id}-${i}`} className="flex items-center gap-6 flex-shrink-0">
                        <Link
                          to={`/haberler/${h.id}`}
                          className="text-white/80 text-sm font-body hover:text-tertiary-fixed hover:underline transition"
                        >
                          {lang === 'en' ? (h.baslikEn || h.baslikTr) : h.baslikTr}
                        </Link>
                        <span className="text-tertiary-fixed/60">|</span>
                      </span>
                    ))}
                  </div>
                </div>
                <Link to="/haberler" className="text-tertiary-fixed font-semibold text-sm whitespace-nowrap flex-shrink-0 hover:text-white transition font-body">
                  {t('haber.tumunuGor')} →
                </Link>
              </div>
            </div>
          )}

          <div className="relative max-w-7xl mx-auto px-4 py-8 md:py-10">
            {/* ── ÜST BLOK ─────────────────────────────────── */}
            <div className="max-w-3xl mb-6 md:mb-8">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-white mb-2.5 leading-tight font-headline">
                {t('hero.title')}
              </h1>
              <p className="text-sm md:text-base text-white/70 mb-5 font-body leading-relaxed">
                {t('hero.subtitle')}
              </p>

              {/* Arama: şehir + kategori dropdown → CategoryPage yönlendirme */}
              <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" aria-hidden="true" />
                  <select
                    value={heroCity}
                    onChange={(e) => setHeroCity(e.target.value)}
                    aria-label={lang === 'en' ? 'Select city' : 'Şehir seçin'}
                    className="w-full appearance-none pl-9 pr-8 py-3 bg-white/10 backdrop-blur border border-white/20 rounded-xl text-sm text-white font-body focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white/15 transition [&>option]:text-on-surface"
                  >
                    <option value="">{lang === 'en' ? 'All cities' : 'Tüm şehirler'}</option>
                    {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="relative flex-1">
                  <select
                    value={heroCat}
                    onChange={(e) => setHeroCat(e.target.value)}
                    aria-label={lang === 'en' ? 'Select category' : 'Kategori seçin'}
                    className="w-full appearance-none px-3 pr-8 py-3 bg-white/10 backdrop-blur border border-white/20 rounded-xl text-sm text-white font-body focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white/15 transition [&>option]:text-on-surface"
                  >
                    <option value="">{lang === 'en' ? 'All categories' : 'Tüm kategoriler'}</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat.slug} value={cat.slug}>{t(CATEGORY_NAME_KEYS[cat.slug])}</option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={handleHeroSearch}
                  className="flex-shrink-0 flex items-center justify-center gap-2 bg-primary text-on-primary px-6 py-3 rounded-xl font-bold hover:bg-primary-container transition font-headline text-sm"
                >
                  <Search className="w-4 h-4" aria-hidden="true" />
                  {lang === 'en' ? 'View Listings' : 'İlanları Gör'}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/satici-formu')}
                  className="flex-shrink-0 flex items-center justify-center bg-transparent text-white border border-white/30 px-6 py-3 rounded-xl font-bold hover:bg-white/10 transition font-headline text-sm"
                >
                  {t('hero.btnPostAd')}
                </button>
              </div>

              {/* AI Asistanı — ikincil ama fark edilir vurgulu kutu */}
              {flags.aiAsistan && (
                <div className="mt-4 bg-white/10 border border-white/15 rounded-xl p-3.5">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Sparkles className="w-4 h-4 text-primary-container" aria-hidden="true" />
                    <span className="text-xs font-bold text-white font-headline">
                      {lang === 'en' ? 'AI Assistant — Describe your project' : 'Yapay Zeka Asistanı — Projenizi anlatın'}
                    </span>
                  </div>
                  <form onSubmit={handleAsk} className="flex gap-2">
                    <input
                      type="text"
                      value={aiQuery}
                      onChange={(e) => setAiQuery(e.target.value)}
                      placeholder={aiRemaining === 0 ? t('ai.placeholderExhausted') : t('ai.placeholder')}
                      disabled={aiRemaining === 0}
                      aria-label="AI asistana soru sor"
                      className="flex-1 min-w-0 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-xs text-white placeholder-white/40 font-body focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white/15 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <button
                      type="submit"
                      disabled={!aiQuery.trim() || aiLoading || aiRemaining === 0}
                      aria-label={t('ai.btnAsk')}
                      className="flex-shrink-0 flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white px-3.5 py-2 rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed text-xs whitespace-nowrap font-headline font-semibold"
                    >
                      {aiLoading
                        ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        : <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                      }
                      <span className="hidden sm:inline">{t('ai.btnAsk')}</span>
                    </button>
                  </form>
                  <p className="mt-1.5 text-[11px] text-white/40 font-body">
                    {aiRemaining === 0
                      ? t('ai.queryExhausted')
                      : t('ai.queryRemaining').replace('{n}', String(aiRemaining))
                    }
                  </p>
                </div>
              )}
            </div>

            {/* ── İKİLİ PANEL ──────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Sol: Popüler Kategoriler */}
              <div className="lg:col-span-1 bg-white/10 backdrop-blur-lg border border-white/15 rounded-3xl p-5 shadow-2xl">
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-xl text-primary-container" aria-hidden="true">trending_up</span>
                  <p className="text-white font-bold font-headline text-sm">{lang === 'en' ? 'Popular Categories' : 'Popüler Kategoriler'}</p>
                </div>
                <div className="space-y-2">
                  {CATEGORIES.slice(0, 5).map((cat) => (
                    <Link
                      key={cat.slug}
                      to={`/kategori/${cat.slug}`}
                      className="flex items-center gap-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-3 py-2.5 transition group"
                    >
                      <span className="material-symbols-outlined text-xl text-primary-container" aria-hidden="true">
                        {CATEGORY_MATERIAL_ICONS[cat.slug] || 'home'}
                      </span>
                      <span className="flex-1 min-w-0 text-white font-semibold text-sm font-headline truncate group-hover:text-primary-container transition">
                        {t(CATEGORY_NAME_KEYS[cat.slug])}
                      </span>
                      <ChevronRight className="flex-none w-4 h-4 text-white/40 group-hover:text-white/70 transition" aria-hidden="true" />
                    </Link>
                  ))}
                </div>
              </div>

              {/* Sağ: 6 yatay ilan kartı (2×3) */}
              <div className="lg:col-span-2 bg-white/10 backdrop-blur-lg border border-white/15 rounded-3xl p-5 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-headline font-bold text-base">{lang === 'en' ? 'Modular Building Solutions' : 'Modüler Yapı Çözümleri'}</h3>
                  <Link to="/ilanlar" className="text-primary-container text-xs hover:text-white transition-colors flex items-center gap-1 font-body">
                    {lang === 'en' ? 'View All' : 'Tümü'} <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </Link>
                </div>

                {sonIlanlar.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {sonIlanlar.slice(0, 6).map((ilan) => (
                      <HeroIlanKarti key={ilan.id} ilan={ilan} />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 text-center">
                    <span className="material-symbols-outlined text-white/20 text-5xl mb-3">storefront</span>
                    <p className="text-white/60 text-sm font-medium font-headline">{lang === 'en' ? 'No listings yet' : 'Henüz ilan yok'}</p>
                    <p className="text-white/30 text-xs mt-1 font-body">{lang === 'en' ? 'Listings will appear here automatically' : 'İlanlar buraya otomatik eklenecek'}</p>
                    <Link to="/satici-formu"
                          className="mt-4 bg-primary hover:bg-primary-container text-on-primary text-xs font-bold px-4 py-2 rounded-full transition-colors font-headline">
                      {lang === 'en' ? 'Post the First Listing' : 'İlk İlanı Siz Verin'}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── AI Sonuç Kutusu ─────── */}
        {flags.aiAsistan && (aiResponse || aiLoading || aiError) && (
          <div ref={resultRef} className="bg-white border-b border-outline-variant/30 shadow-sm">
            <div className="max-w-3xl mx-auto px-4 py-6">
              {aiLoading && (
                <div className="flex items-center justify-center gap-3 py-4 text-on-surface-variant">
                  <span className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  <span className="text-sm font-medium font-body">{t('ai.analyzing')}</span>
                </div>
              )}
              {aiError && !aiLoading && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-sm text-red-700 font-body">
                  {aiError}
                </div>
              )}
              {aiResponse && !aiLoading && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-primary" aria-hidden="true" />
                    <span className="text-xs font-semibold text-primary uppercase tracking-wide font-headline">
                      {t('ai.resultLabel')}
                    </span>
                  </div>
                  <p className="text-sm text-on-surface leading-relaxed whitespace-pre-line mb-4 font-body">
                    {aiResponse}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <button
                      onClick={() => navigate('/talep-olustur')}
                      className="flex-1 flex items-center justify-center gap-2 bg-primary text-on-primary py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-container transition font-body"
                    >
                      <MessageSquare className="w-4 h-4" aria-hidden="true" />
                      {t('ai.btnQuote')}
                    </button>
                    <button
                      onClick={() => navigate(`/kategori/${aiSlug}`)}
                      className="flex-1 flex items-center justify-center gap-2 border border-primary text-primary py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/5 transition font-body"
                    >
                      <Search className="w-4 h-4" aria-hidden="true" />
                      {t('ai.btnViewAds')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Flaş Fırsatlar ───────────────────────────────── */}
        <FlashDealsCarousel />

        {/* ── Son Eklenen İlanlar ──────────────────────────── */}
        {sonIlanlar.length > 6 && (
          <section className="py-14 md:py-20 bg-surface-container-lowest">
            <div className="max-w-7xl mx-auto px-4">
              <div className="flex items-end justify-between gap-6 mb-8">
                <div>
                  <h2 className="text-2xl md:text-3xl font-extrabold text-on-surface font-headline">
                    {t('home.latestTitle')}
                  </h2>
                  <p className="text-on-surface-variant mt-1 font-body text-sm">
                    {t('home.latestDesc')}
                  </p>
                </div>
                <Link
                  to="/ilanlar"
                  className="inline-flex items-center gap-1.5 text-primary font-bold text-sm hover:underline font-headline whitespace-nowrap"
                >
                  Tümünü Gör <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {sonIlanlar.slice(6, 18).map((ilan) => (
                  <IlanMiniCard key={ilan.id} ilan={ilan} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Yaklaşan Fuarlar & Etkinlikler ──────────────── */}
        {yakinEtkinlikler.length > 0 && (
          <section className="py-14 md:py-20 bg-surface-container-low">
            <div className="max-w-7xl mx-auto px-4">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl md:text-3xl font-extrabold text-on-surface font-headline">
                    Yaklaşan Fuarlar ve Etkinlikler
                  </h2>
                  <p className="text-on-surface-variant mt-1 font-body text-sm">
                    Sektörün önemli buluşma noktalarını kaçırmayın
                  </p>
                </div>
                <Link
                  to="/etkinlikler"
                  className="hidden sm:inline-flex items-center gap-1.5 text-primary font-bold text-sm hover:underline font-headline"
                >
                  Tümünü Gör <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {yakinEtkinlikler.map((etk) => (
                  <Link
                    key={etk.id}
                    to={`/etkinlikler/${etk.slug || etk.id}`}
                    className="group bg-white rounded-2xl overflow-hidden border border-outline-variant/20 hover:shadow-xl transition-all duration-300"
                  >
                    <div className="aspect-video overflow-hidden bg-surface-container-low relative">
                      <img
                        src={etk.kapakGorseli || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=500&fit=crop'}
                        alt={etk.baslik}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur rounded-xl px-3 py-1.5 text-center shadow-sm">
                        <p className="text-xs font-bold text-primary font-headline leading-none">
                          {new Date(etk.baslangicTarihi.seconds * 1000).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                      <span className={`absolute top-3 right-3 text-[10px] font-bold px-2 py-1 rounded-full ${TUR_COLORS[etk.tur]} font-headline`}>
                        {TUR_LABELS[etk.tur]}
                      </span>
                    </div>
                    <div className="p-5">
                      <h3 className="font-headline font-bold text-on-surface text-base leading-snug line-clamp-2 group-hover:text-primary transition-colors mb-2">
                        {etk.baslik}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-on-surface-variant font-body">
                        <span className="material-symbols-outlined text-sm text-primary">location_on</span>
                        {etk.mekan}, {etk.sehir}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              <div className="sm:hidden text-center mt-6">
                <Link
                  to="/etkinlikler"
                  className="inline-flex items-center gap-1.5 text-primary font-bold text-sm hover:underline font-headline"
                >
                  Tümünü Gör <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* ── Kategoriler ──────────────────────────────────── */}
        <section className="py-14 md:py-20 bg-surface-container-lowest">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-4xl font-extrabold text-on-surface font-headline">{t('cats.title')}</h2>
              <p className="text-on-surface-variant mt-2 font-body">{t('cats.subtitle')}</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {CATEGORIES.map((category) => {
                const gradient = CATEGORY_GRADIENTS[category.slug] || 'from-gray-500 to-gray-700';
                const materialIcon = CATEGORY_MATERIAL_ICONS[category.slug] || 'home';
                const image = CATEGORY_IMAGES[category.slug];
                const label = t(CATEGORY_NAME_KEYS[category.slug]);
                return (
                  <Link
                    key={category.slug}
                    to={`/kategori/${category.slug}`}
                    className={`group relative rounded-2xl p-6 overflow-hidden aspect-[4/3] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${
                      image ? 'flex flex-col justify-end' : `bg-gradient-to-br ${gradient}`
                    }`}
                  >
                    {image ? (
                      <>
                        <img
                          src={image}
                          alt={label}
                          loading="lazy"
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                        <h3 className="font-bold text-white text-base font-headline relative z-10">
                          {label}
                        </h3>
                      </>
                    ) : (
                      <>
                        {/* Decorative circle */}
                        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full" />
                        <span className="material-symbols-outlined text-4xl text-white/90 mb-3 block group-hover:scale-110 transition-transform" aria-hidden="true" style={{ fontVariationSettings: "'FILL' 1" }}>
                          {materialIcon}
                        </span>
                        <h3 className="font-bold text-white text-base font-headline relative z-10">
                          {label}
                        </h3>
                      </>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Nasıl Çalışır? ───────────────────────────────── */}
        <section className="py-14 md:py-20 bg-surface-container-low">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-4xl font-extrabold text-on-surface font-headline">{t('how.title')}</h2>
              <p className="text-on-surface-variant mt-2 font-body">{t('how.subtitle')}</p>
            </div>

            {/* Tab seçici */}
            <div className="flex justify-center mb-10">
              <div className="inline-flex bg-white border border-outline-variant/30 rounded-2xl p-1.5 shadow-sm">
                <button
                  onClick={() => setActiveTab('customer')}
                  aria-pressed={activeTab === 'customer'}
                  className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all font-headline ${
                    activeTab === 'customer'
                      ? 'bg-primary text-on-primary shadow-md'
                      : 'text-on-surface-variant hover:text-primary'
                  }`}
                >
                  {t('how.tabBuyer')}
                </button>
                <button
                  onClick={() => setActiveTab('producer')}
                  aria-pressed={activeTab === 'producer'}
                  className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all font-headline ${
                    activeTab === 'producer'
                      ? 'bg-primary text-on-primary shadow-md'
                      : 'text-on-surface-variant hover:text-primary'
                  }`}
                >
                  {t('how.tabSeller')}
                </button>
              </div>
            </div>

            {/* Müşteri adımları */}
            {activeTab === 'customer' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {CUSTOMER_STEPS.map((step, i) => (
                  <div key={step.title} className="relative bg-white rounded-3xl p-6 shadow-sm border border-outline-variant/20 hover:shadow-lg transition-shadow">
                    {i < CUSTOMER_STEPS.length - 1 && (
                      <div className="hidden lg:block absolute top-10 left-full w-6 border-t-2 border-dashed border-primary/20 z-10" />
                    )}
                    <div className="flex items-center gap-3 mb-4">
                      <span className="w-9 h-9 rounded-full bg-primary text-on-primary text-sm font-bold flex items-center justify-center flex-shrink-0 font-headline">
                        {i + 1}
                      </span>
                      <div className="w-11 h-11 bg-primary/10 rounded-2xl flex items-center justify-center">
                        <span className="material-symbols-outlined text-2xl text-primary" aria-hidden="true">{step.materialIcon}</span>
                      </div>
                    </div>
                    <h3 className="font-bold text-on-surface mb-1 font-headline">{step.title}</h3>
                    <p className="text-sm text-on-surface-variant font-body">{step.desc}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Üretici adımları */}
            {activeTab === 'producer' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
                {PRODUCER_STEPS.map((step, i) => (
                  <div key={step.title} className="relative bg-white rounded-3xl p-6 shadow-sm border border-outline-variant/20 hover:shadow-lg transition-shadow">
                    {i < PRODUCER_STEPS.length - 1 && (
                      <div className="hidden sm:block absolute top-10 left-full w-6 border-t-2 border-dashed border-primary/20 z-10" />
                    )}
                    <div className="flex items-center gap-3 mb-4">
                      <span className="w-9 h-9 rounded-full bg-primary text-on-primary text-sm font-bold flex items-center justify-center flex-shrink-0 font-headline">
                        {i + 1}
                      </span>
                      <div className="w-11 h-11 bg-primary/10 rounded-2xl flex items-center justify-center">
                        <span className="material-symbols-outlined text-2xl text-primary" aria-hidden="true">{step.materialIcon}</span>
                      </div>
                    </div>
                    <h3 className="font-bold text-on-surface mb-1 font-headline">{step.title}</h3>
                    <p className="text-sm text-on-surface-variant font-body">{step.desc}</p>
                  </div>
                ))}
              </div>
            )}

            {/* CTA */}
            <div className="text-center mt-10">
              {activeTab === 'customer' ? (
                <Link
                  to="/kategori/prefabrik"
                  className="inline-flex items-center gap-2 bg-primary text-on-primary px-7 py-3.5 rounded-2xl font-bold hover:bg-primary-container transition font-headline"
                >
                  {t('how.ctaBuyer')} <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>
              ) : (
                <Link
                  to="/satici-formu"
                  className="inline-flex items-center gap-2 bg-primary text-on-primary px-7 py-3.5 rounded-2xl font-bold hover:bg-primary-container transition font-headline"
                >
                  {t('how.ctaSeller')} <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* ── Neden ModülerPazar? ───────────────────────────── */}
        <section className="py-14 md:py-20 bg-surface-container-lowest">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-4xl font-extrabold text-on-surface font-headline">{t('why.title')}</h2>
              <p className="text-on-surface-variant mt-2 font-body">{t('why.subtitle')}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {TRUST_ITEMS.map((item) => (
                <div
                  key={item.title}
                  className="bg-white border border-outline-variant/20 rounded-3xl p-6 hover:shadow-lg transition-shadow"
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${item.color}`}>
                    <span className="material-symbols-outlined text-2xl" aria-hidden="true">{item.materialIcon}</span>
                  </div>
                  <h3 className="font-bold text-on-surface mb-2 font-headline">{item.title}</h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed font-body">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Hakkımızda (kısa) ────────────────────────────── */}
        <section className="py-14 md:py-20 bg-surface-container-low">
          <div className="max-w-7xl mx-auto px-4">
            <span className="text-xs font-bold text-primary uppercase tracking-widest mb-2 block font-headline">
              Hakkımızda
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-on-surface mb-3 font-headline">
              Türkiye'nin Modüler Yapı Pazarı
            </h2>
            <p className="text-on-surface-variant text-sm leading-relaxed mb-5 font-body">
              ModülerPazar, alıcıları ve üreticileri tek platformda buluşturan dijital
              pazaryeridir. Doğrulanmış firmalar, ücretsiz teklif alma ve yapay zeka
              destekli öneri sistemiyle modüler yapı sürecinizi kolaylaştırıyoruz.
            </p>
            <Link
              to="/hakkimizda"
              className="inline-flex items-center gap-1.5 text-primary font-bold hover:underline text-sm font-headline"
            >
              Daha fazla bilgi al <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* ── CTA — Firma ──────────────────────────────────── */}
        <section className="py-14 md:py-20 bg-on-surface text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent" />
          <div className="relative max-w-7xl mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-4xl font-extrabold mb-4 font-headline">
              {t('firmCta.title')}
            </h2>
            <p className="text-white/60 mb-8 max-w-2xl mx-auto font-body">
              {t('firmCta.subtitle')}
            </p>
            <Link
              to="/satici-formu"
              className="inline-flex items-center gap-2 bg-primary text-on-primary px-8 py-4 rounded-2xl font-bold hover:bg-primary-container transition font-headline text-lg"
            >
              {t('firmCta.btn')} <ArrowRight className="w-5 h-5" aria-hidden="true" />
            </Link>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
