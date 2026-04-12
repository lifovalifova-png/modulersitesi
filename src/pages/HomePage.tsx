import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  collection, query, where, getCountFromServer,
  onSnapshot, orderBy, limit,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  ArrowRight, Search, CheckSquare, FileText, BarChart2,
  UserPlus, ClipboardList, Handshake,
  ShieldCheck, Tag, MapPin, Lock,
  Sparkles, MessageSquare,
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEOMeta from '../components/SEOMeta';
import FlashDealsCarousel from '../components/FlashDealsCarousel';
import { CATEGORIES, CATEGORY_NAME_KEYS } from '../data/categories';
import { useLanguage } from '../context/LanguageContext';
import { useFeatureFlags } from '../hooks/useFeatureFlags';
import type { Ilan } from '../hooks/useIlanlar';

/* ─── CountUp: 0'dan hedefe sayma animasyonu ────────────── */
function StatCounter({ target, suffix, active }: { target: number; suffix: string; active: boolean }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active) return;
    let frame = 0;
    const totalFrames = 80;
    const timer = setInterval(() => {
      frame++;
      const ease = 1 - Math.pow(1 - frame / totalFrames, 4);
      setCount(frame >= totalFrames ? target : Math.round(ease * target));
      if (frame >= totalFrames) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [target, active]);
  return <>{count.toLocaleString('tr-TR')}{suffix}</>;
}

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

  /* ─── Firestore gerçek sayılar ───────────────────────────── */
  const [ilanCount,  setIlanCount]  = useState(0);
  const [firmaCount, setFirmaCount] = useState(0);

  useEffect(() => {
    Promise.all([
      getCountFromServer(query(collection(db, 'ilanlar'), where('status', '==', 'aktif'))),
      getCountFromServer(query(collection(db, 'firms'),   where('status', '==', 'approved'))),
    ]).then(([ilanSnap, firmaSnap]) => {
      setIlanCount(ilanSnap.data().count);
      setFirmaCount(firmaSnap.data().count);
    }).catch(() => {});
  }, []);

  /* ─── Kayan Haber Bandı ───────────────────────────────────── */
  interface MiniHaber { id: string; baslik: string; baslikEn?: string; kaynak: string }
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
        const data = d.data() as { baslik: string; baslikEn?: string; kaynak: string };
        return { id: d.id, baslik: data.baslik, baslikEn: data.baslikEn, kaynak: data.kaynak };
      });
      const seen = new Set<string>();
      const docs = raw.filter((h) => {
        const key = h.baslik.trim().toLowerCase();
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

  /* ─── Son 8 ilan (Hero grid) ──────────────────────────────── */
  const [sonIlanlar, setSonIlanlar] = useState<Ilan[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, 'ilanlar'),
      where('status', '==', 'aktif'),
      orderBy('tarih', 'desc'),
      limit(8),
    );
    const unsub = onSnapshot(q, (snap) => {
      setSonIlanlar(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Ilan)));
    });
    return () => unsub();
  }, []);

  /* ─── Translated data arrays ────────────────────────────── */
  const STATS = [
    { label: t('stats.activeAds'),       target: ilanCount,  suffix: '+', icon: 'real_estate_agent' },
    { label: t('stats.registeredFirms'), target: firmaCount, suffix: '+', icon: 'business' },
    { label: t('stats.happyCustomers'),  target: 12000,      suffix: '+', icon: 'groups' },
    { label: t('stats.cities'),          target: 81,         suffix: '',  icon: 'location_city' },
  ];

  const [statsActive, setStatsActive] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setStatsActive(true); obs.disconnect(); } },
      { threshold: 0.4 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

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
        title="ModülerPazar — Türkiye'nin En Büyük Modüler Yapı Pazarı"
        description="Prefabrik ev, çelik yapı, konteyner ev, tiny house ilanları. Türkiye genelinde 2500+ ilan, 850+ firma. Aynı anda 2 firmadan ücretsiz teklif alın."
        url="/"
      />
      <Header />

      <main className="flex-1">

        {/* ── Hero ─────────────────────────────────────────── */}
        <section className="relative overflow-hidden bg-on-surface">
          {/* Background image overlay */}
          <div
            className="absolute inset-0 bg-cover bg-center opacity-20"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1920&h=800&fit=crop')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-on-surface via-on-surface/90 to-on-surface/70" />

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
                          {lang === 'en' ? (h.baslikEn || h.baslik) : h.baslik}
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

          <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-24">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Sol: Metin */}
              <div>
                <div className="inline-flex items-center gap-2 bg-secondary-container text-on-secondary-container text-sm font-bold px-4 py-1.5 rounded-full mb-6 font-headline">
                  <span className="material-symbols-outlined text-base" aria-hidden="true">bolt</span>
                  {t('hero.badge')}
                </div>

                <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-white mb-5 leading-tight font-headline">
                  {t('hero.title')}
                </h1>
                <p className="text-lg md:text-xl text-white/70 mb-8 font-body leading-relaxed">
                  {t('hero.subtitle')}
                </p>

                {/* CTA butonları */}
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                  <Link
                    to="/satici-formu"
                    className="bg-primary text-on-primary px-7 py-3.5 rounded-2xl font-bold hover:bg-primary-container transition text-center font-headline text-base"
                  >
                    {t('hero.btnPostAd')}
                  </Link>
                  <Link
                    to="/kategori/prefabrik"
                    className="bg-white/10 backdrop-blur text-white border border-white/20 px-7 py-3.5 rounded-2xl font-bold hover:bg-white/20 transition text-center flex items-center justify-center gap-2 font-headline text-base"
                  >
                    {t('hero.btnExplore')} <ArrowRight className="w-5 h-5" aria-hidden="true" />
                  </Link>
                </div>

                {/* ── AI Mini Input ──────────────────────────── */}
                {flags.aiAsistan ? (
                  <>
                    <form onSubmit={handleAsk} className="flex gap-2">
                      <div className="relative flex-1">
                        <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" aria-hidden="true" />
                        <input
                          type="text"
                          value={aiQuery}
                          onChange={(e) => setAiQuery(e.target.value)}
                          placeholder={aiRemaining === 0 ? 'Yarın tekrar deneyin…' : t('ai.placeholder')}
                          disabled={aiRemaining === 0}
                          aria-label="AI asistana soru sor"
                          className="w-full pl-9 pr-3 py-3 bg-white/10 backdrop-blur border border-white/20 rounded-xl text-sm text-white placeholder-white/40 font-body focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white/15 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={!aiQuery.trim() || aiLoading || aiRemaining === 0}
                        className="flex-shrink-0 flex items-center gap-2 bg-tertiary-fixed hover:bg-yellow-300 text-tertiary font-bold px-4 py-3 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed text-sm whitespace-nowrap font-headline"
                      >
                        {aiLoading
                          ? <span className="w-4 h-4 border-2 border-tertiary/30 border-t-tertiary rounded-full animate-spin" />
                          : <Sparkles className="w-4 h-4" aria-hidden="true" />
                        }
                        <span className="hidden sm:inline">{t('ai.btnAsk')}</span>
                      </button>
                    </form>

                    <p className="mt-2 text-xs text-white/40 font-body">
                      {aiRemaining === 0
                        ? t('ai.queryExhausted')
                        : t('ai.queryRemaining').replace('{n}', String(aiRemaining))
                      }
                    </p>
                  </>
                ) : (
                  <p className="mt-2 text-xs text-white/40 font-body">
                    Bu özellik şu anda kullanılamıyor.
                  </p>
                )}
              </div>

              {/* Sağ: İkili Panel */}
              <div className="hidden lg:flex gap-4">
                {/* Sol dar: Popüler kategoriler */}
                <div className="w-1/3 bg-white/10 backdrop-blur-lg border border-white/15 rounded-3xl p-6 shadow-2xl">
                  <div className="flex items-center gap-2 mb-5">
                    <span className="material-symbols-outlined text-2xl text-secondary-container" aria-hidden="true">trending_up</span>
                    <div>
                      <p className="text-white font-bold font-headline text-sm">{lang === 'en' ? 'Popular This Week' : 'Bu Hafta Popüler'}</p>
                      <p className="text-white/50 text-xs font-body">{lang === 'en' ? 'Top categories' : 'En çok görüntülenen'}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {CATEGORIES.slice(0, 5).map((cat) => (
                      <Link
                        key={cat.slug}
                        to={`/kategori/${cat.slug}`}
                        className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-3 py-2.5 transition group"
                      >
                        <span className="material-symbols-outlined text-xl text-secondary-container" aria-hidden="true">
                          {CATEGORY_MATERIAL_ICONS[cat.slug] || 'home'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-semibold text-xs font-headline truncate group-hover:text-secondary-container transition">
                            {t(CATEGORY_NAME_KEYS[cat.slug])}
                          </p>
                          <p className="text-white/40 text-[10px] font-body">{cat.count} {t('cats.listings')}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Sağ geniş: Son ilanlar grid */}
                <div className="w-2/3 bg-white/10 backdrop-blur-lg border border-white/15 rounded-3xl p-6 shadow-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-headline font-bold text-lg">{lang === 'en' ? 'Modular Building Solutions' : 'Modüler Yapı Çözümleri'}</h3>
                    <Link to="/kategori/prefabrik" className="text-secondary-container text-xs hover:text-white transition-colors flex items-center gap-1 font-body">
                      {lang === 'en' ? 'View All' : 'Tümü'} <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </Link>
                  </div>

                  {sonIlanlar.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2 overflow-y-auto max-h-72 scrollbar-hide">
                      {sonIlanlar.map((ilan) => (
                        <Link
                          key={ilan.id}
                          to={`/ilan/${ilan.id}`}
                          className="bg-white/10 hover:bg-white/20 backdrop-blur border border-white/10 rounded-xl p-3 transition-all group"
                        >
                          {ilan.gorseller?.[0] ? (
                            <div className="aspect-video rounded-lg overflow-hidden mb-2">
                              <img src={ilan.gorseller[0]} alt={ilan.baslik}
                                   className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                   loading="lazy" />
                            </div>
                          ) : (
                            <div className="aspect-video rounded-lg bg-white/5 flex items-center justify-center mb-2">
                              <span className="material-symbols-outlined text-white/30 text-2xl">home</span>
                            </div>
                          )}
                          <p className="text-white text-xs font-semibold line-clamp-1 font-headline">{ilan.baslik}</p>
                          <p className="text-secondary-container text-xs font-bold mt-0.5 font-headline">
                            {ilan.fiyat ? `₺${ilan.fiyat.toLocaleString('tr-TR')}` : (lang === 'en' ? 'Ask price' : 'Fiyat sorun')}
                          </p>
                          <p className="text-white/50 text-[10px] mt-0.5 font-body">{ilan.sehir}</p>
                        </Link>
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
          </div>
        </section>

        {/* ── Stats Bar ───────────────────────────────────── */}
        <div ref={statsRef} className="bg-surface-container-low border-b border-outline-variant/30">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {STATS.map((stat) => (
                <div key={stat.label} className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-2xl text-primary" aria-hidden="true">{stat.icon}</span>
                  </div>
                  <div>
                    <div className="text-2xl font-extrabold text-on-surface font-headline">
                      <StatCounter target={stat.target} suffix={stat.suffix} active={statsActive} />
                    </div>
                    <div className="text-on-surface-variant text-xs font-body">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

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
                return (
                  <Link
                    key={category.slug}
                    to={`/kategori/${category.slug}`}
                    className={`group relative bg-gradient-to-br ${gradient} rounded-2xl p-6 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300`}
                  >
                    {/* Decorative circle */}
                    <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full" />
                    <span className="material-symbols-outlined text-4xl text-white/90 mb-3 block group-hover:scale-110 transition-transform" aria-hidden="true" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {materialIcon}
                    </span>
                    <h3 className="font-bold text-white text-base font-headline relative z-10">
                      {t(CATEGORY_NAME_KEYS[category.slug])}
                    </h3>
                    <p className="text-white/70 text-sm mt-1 font-body relative z-10">{category.count} {t('cats.listings')}</p>
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
            <div className="flex flex-col md:flex-row items-center gap-8 md:gap-14">
              <div className="flex-1">
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
              <div className="flex-1 grid grid-cols-2 gap-3 w-full">
                {[
                  { materialIcon: 'verified_user', text: 'Doğrulanmış Firmalar',  color: 'bg-emerald-100 text-emerald-600' },
                  { materialIcon: 'sell',          text: 'Ücretsiz Teklif',        color: 'bg-blue-100 text-blue-600'       },
                  { materialIcon: 'smart_toy',     text: 'AI Destekli Öneri',      color: 'bg-amber-100 text-amber-600'     },
                  { materialIcon: 'lock',          text: 'KVKK Uyumlu',            color: 'bg-purple-100 text-purple-600'   },
                ].map(({ materialIcon, text, color }) => (
                  <div
                    key={text}
                    className="flex items-center gap-3 bg-white rounded-2xl p-4 border border-outline-variant/20 shadow-sm"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                      <span className="material-symbols-outlined text-xl" aria-hidden="true">{materialIcon}</span>
                    </div>
                    <span className="text-sm font-semibold text-on-surface font-headline">{text}</span>
                  </div>
                ))}
              </div>
            </div>
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
