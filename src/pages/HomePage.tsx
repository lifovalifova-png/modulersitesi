import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  collection, query, where, getCountFromServer,
  onSnapshot, orderBy, limit,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  ArrowRight, Building, Container, Home, Hammer, TreePine, Recycle, Star,
  Zap, Search, CheckSquare, FileText, BarChart2,
  UserPlus, ClipboardList, Handshake,
  ShieldCheck, Tag, MapPin, Lock,
  Sparkles, MessageSquare, Newspaper, Calendar,
  type LucideIcon,
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEOMeta from '../components/SEOMeta';
import FlashDealsCarousel from '../components/FlashDealsCarousel';
import { CATEGORIES } from '../data/categories';
import { useLanguage } from '../context/LanguageContext';
import { useFeatureFlags } from '../hooks/useFeatureFlags';

/* ─── CountUp: 0'dan hedefe sayma animasyonu ────────────── */
function StatCounter({ target, suffix, active }: { target: number; suffix: string; active: boolean }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active) return;
    let frame = 0;
    const totalFrames = 80; // ~1.3s @60fps
    const timer = setInterval(() => {
      frame++;
      // easeOutQuart
      const ease = 1 - Math.pow(1 - frame / totalFrames, 4);
      setCount(frame >= totalFrames ? target : Math.round(ease * target));
      if (frame >= totalFrames) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [target, active]);
  return <>{count.toLocaleString('tr-TR')}{suffix}</>;
}

/* ─── Kategori ikon eşlemesi ─────────────────────────────── */
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  'prefabrik':           Building,
  'celik-yapilar':       Hammer,
  'yasam-konteynerleri': Container,
  'ikinci-el':           Recycle,
  'ozel-projeler':       Star,
  'ahsap-yapilar':       TreePine,
  'tiny-house':          Home,
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
  const { t } = useLanguage();
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
    }).catch(() => { /* silent — StatCounter'da 0 kalır */ });
  }, []);

  /* ─── Sektör Haberleri ───────────────────────────────────── */
  interface MiniHaber {
    id: string; baslik: string; kaynak: string;
    kaynakUrl: string; gorselUrl?: string; bolge?: string;
    tarih: { seconds: number } | null;
  }
  const [haberler,     setHaberler]     = useState<MiniHaber[]>([]);
  const [haberlerTab,  setHaberlerTab]  = useState<'turkiye' | 'dunya'>('turkiye');
  const [haberLoading, setHaberLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'haberler'),
      where('yayinda', '==', true),
      orderBy('tarih', 'desc'),
      limit(20),
    );
    const unsub = onSnapshot(q, (snap) => {
      setHaberler(snap.docs.map((d) => ({ id: d.id, ...d.data() } as MiniHaber)));
      setHaberLoading(false);
    }, () => setHaberLoading(false));
    return unsub;
  }, []);

  const haberlerGoruntule = haberler
    .filter((h) => !h.bolge || h.bolge === haberlerTab)
    .slice(0, 4);

  function formatHaberTarih(t: { seconds: number } | null) {
    if (!t) return '';
    return new Date(t.seconds * 1000).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  }

  const HABER_GORSEL =
    'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=300&fit=crop';

  /* ─── Translated data arrays ────────────────────────────── */
  const STATS = [
    { label: t('stats.activeAds'),       target: ilanCount,  suffix: '+' },
    { label: t('stats.registeredFirms'), target: firmaCount, suffix: '+' },
    { label: t('stats.happyCustomers'),  target: 12000,      suffix: '+' },
    { label: t('stats.cities'),          target: 81,         suffix: ''  },
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
    { icon: Search,      title: t('step.b1.title'), desc: t('step.b1.desc') },
    { icon: CheckSquare, title: t('step.b2.title'), desc: t('step.b2.desc') },
    { icon: FileText,    title: t('step.b3.title'), desc: t('step.b3.desc') },
    { icon: BarChart2,   title: t('step.b4.title'), desc: t('step.b4.desc') },
  ];

  const PRODUCER_STEPS = [
    { icon: UserPlus,      title: t('step.s1.title'), desc: t('step.s1.desc') },
    { icon: ClipboardList, title: t('step.s2.title'), desc: t('step.s2.desc') },
    { icon: Handshake,     title: t('step.s3.title'), desc: t('step.s3.desc') },
  ];

  const TRUST_ITEMS = [
    { icon: ShieldCheck, title: t('why.verified.title'),  desc: t('why.verified.desc'),  color: 'bg-emerald-100 text-emerald-600' },
    { icon: Tag,         title: t('why.freeQuote.title'), desc: t('why.freeQuote.desc'), color: 'bg-blue-100 text-blue-600'       },
    { icon: MapPin,      title: t('why.regional.title'),  desc: t('why.regional.desc'),  color: 'bg-amber-100 text-amber-600'     },
    { icon: Lock,        title: t('why.kvkk.title'),      desc: t('why.kvkk.desc'),      color: 'bg-purple-100 text-purple-600'   },
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
    <div className="flex flex-col min-h-screen">
      <SEOMeta
        title="ModülerPazar — Türkiye'nin En Büyük Modüler Yapı Pazarı"
        description="Prefabrik ev, çelik yapı, konteyner ev, tiny house ilanları. Türkiye genelinde 2500+ ilan, 850+ firma. Aynı anda 2 firmadan ücretsiz teklif alın."
        url="/"
      />
      <Header />

      <main className="flex-1">

        {/* ── Hero ─────────────────────────────────────────── */}
        <section className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-800 text-white py-16 md:py-20">
          <div className="max-w-7xl mx-auto px-4">
            <div className="max-w-3xl">

              {/* Öne çıkan badge */}
              <div className="inline-flex items-center gap-2 bg-amber-400 text-amber-900 text-sm font-bold px-4 py-1.5 rounded-full mb-6">
                <Zap className="w-4 h-4" aria-hidden="true" />
                {t('hero.badge')}
              </div>

              <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
                {t('hero.title')}
              </h1>
              <p className="text-lg md:text-xl text-emerald-100 mb-8">
                {t('hero.subtitle')}
              </p>

              {/* CTA butonları */}
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link
                  to="/satici-formu"
                  className="bg-white text-emerald-700 px-6 py-3 rounded-lg font-semibold hover:bg-emerald-50 transition text-center"
                >
                  {t('hero.btnPostAd')}
                </Link>
                <Link
                  to="/kategori/prefabrik"
                  className="bg-emerald-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-400 transition text-center flex items-center justify-center gap-2"
                >
                  {t('hero.btnExplore')} <ArrowRight className="w-5 h-5" aria-hidden="true" />
                </Link>
              </div>

              {/* ── AI Mini Input ──────────────────────────── */}
              {flags.aiAsistan ? (
                <>
                  <form onSubmit={handleAsk} className="flex gap-2">
                    <div className="relative flex-1">
                      <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" aria-hidden="true" />
                      <input
                        type="text"
                        value={aiQuery}
                        onChange={(e) => setAiQuery(e.target.value)}
                        placeholder={aiRemaining === 0 ? 'Yarın tekrar deneyin…' : t('ai.placeholder')}
                        disabled={aiRemaining === 0}
                        className="w-full pl-9 pr-3 py-3 bg-white/15 backdrop-blur border border-white/30 rounded-xl text-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/40 focus:bg-white/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!aiQuery.trim() || aiLoading || aiRemaining === 0}
                      className="flex-shrink-0 flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-amber-900 font-bold px-4 py-3 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed text-sm whitespace-nowrap"
                    >
                      {aiLoading
                        ? <span className="w-4 h-4 border-2 border-amber-700/30 border-t-amber-900 rounded-full animate-spin" />
                        : <Sparkles className="w-4 h-4" aria-hidden="true" />
                      }
                      <span className="hidden sm:inline">{t('ai.btnAsk')}</span>
                    </button>
                  </form>

                  {/* Kalan hak göstergesi */}
                  <p className="mt-2 text-xs text-white/50">
                    {aiRemaining === 0
                      ? t('ai.queryExhausted')
                      : t('ai.queryRemaining').replace('{n}', String(aiRemaining))
                    }
                  </p>
                </>
              ) : (
                <p className="mt-2 text-xs text-white/50">
                  Bu özellik şu anda kullanılamıyor.
                </p>
              )}
            </div>

            {/* Stats */}
            <div ref={statsRef} className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10">
              {STATS.map((stat) => (
                <div key={stat.label} className="bg-white/10 backdrop-blur rounded-lg p-4 text-center">
                  <div className="text-2xl md:text-3xl font-bold">
                    <StatCounter target={stat.target} suffix={stat.suffix} active={statsActive} />
                  </div>
                  <div className="text-emerald-200 text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── AI Sonuç Kutusu (hero altında, beyaz bg) ─────── */}
        {flags.aiAsistan && (aiResponse || aiLoading || aiError) && (
          <div ref={resultRef} className="bg-white border-b border-gray-200 shadow-sm">
            <div className="max-w-3xl mx-auto px-4 py-6">

              {/* Loading */}
              {aiLoading && (
                <div className="flex items-center justify-center gap-3 py-4 text-gray-500">
                  <span className="w-5 h-5 border-2 border-emerald-300 border-t-emerald-600 rounded-full animate-spin" />
                  <span className="text-sm font-medium">{t('ai.analyzing')}</span>
                </div>
              )}

              {/* Hata */}
              {aiError && !aiLoading && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-sm text-red-700">
                  {aiError}
                </div>
              )}

              {/* Yanıt */}
              {aiResponse && !aiLoading && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                    <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">
                      {t('ai.resultLabel')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line mb-4">
                    {aiResponse}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <button
                      onClick={() => navigate('/talep-olustur')}
                      className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-700 transition"
                    >
                      <MessageSquare className="w-4 h-4" aria-hidden="true" />
                      {t('ai.btnQuote')}
                    </button>
                    <button
                      onClick={() => navigate(`/kategori/${aiSlug}`)}
                      className="flex-1 flex items-center justify-center gap-2 border border-emerald-600 text-emerald-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-50 transition"
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
        <section className="py-12 md:py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800">{t('cats.title')}</h2>
              <p className="text-gray-600 mt-1">{t('cats.subtitle')}</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {CATEGORIES.map((category) => {
                const Icon = CATEGORY_ICONS[category.slug];
                return (
                  <Link
                    key={category.slug}
                    to={`/kategori/${category.slug}`}
                    className="group bg-gray-50 hover:bg-emerald-50 border border-gray-200 hover:border-emerald-300 rounded-xl p-5 transition-all duration-200"
                  >
                    <div className={`${category.color} w-12 h-12 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                      {Icon && <Icon className="w-6 h-6 text-white" aria-hidden="true" />}
                    </div>
                    <h3 className="font-semibold text-gray-800 group-hover:text-emerald-700 transition">
                      {category.name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">{category.count} {t('cats.listings')}</p>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Nasıl Çalışır? ───────────────────────────────── */}
        <section className="py-12 md:py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800">{t('how.title')}</h2>
              <p className="text-gray-600 mt-2">{t('how.subtitle')}</p>
            </div>

            {/* Tab seçici */}
            <div className="flex justify-center mb-10">
              <div className="inline-flex bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
                <button
                  onClick={() => setActiveTab('customer')}
                  aria-pressed={activeTab === 'customer'}
                  className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    activeTab === 'customer'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'text-gray-600 hover:text-emerald-600'
                  }`}
                >
                  {t('how.tabBuyer')}
                </button>
                <button
                  onClick={() => setActiveTab('producer')}
                  aria-pressed={activeTab === 'producer'}
                  className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    activeTab === 'producer'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'text-gray-600 hover:text-emerald-600'
                  }`}
                >
                  {t('how.tabSeller')}
                </button>
              </div>
            </div>

            {/* Müşteri adımları */}
            {activeTab === 'customer' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {CUSTOMER_STEPS.map((step, i) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.title} className="relative bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                      {/* Bağlantı çizgisi */}
                      {i < CUSTOMER_STEPS.length - 1 && (
                        <div className="hidden lg:block absolute top-10 left-full w-6 border-t-2 border-dashed border-emerald-200 z-10" />
                      )}
                      <div className="flex items-center gap-3 mb-4">
                        <span className="w-8 h-8 rounded-full bg-emerald-600 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
                          {i + 1}
                        </span>
                        <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                          <Icon className="w-5 h-5 text-emerald-600" aria-hidden="true" />
                        </div>
                      </div>
                      <h3 className="font-semibold text-gray-800 mb-1">{step.title}</h3>
                      <p className="text-sm text-gray-500">{step.desc}</p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Üretici adımları */}
            {activeTab === 'producer' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
                {PRODUCER_STEPS.map((step, i) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.title} className="relative bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                      {i < PRODUCER_STEPS.length - 1 && (
                        <div className="hidden sm:block absolute top-10 left-full w-6 border-t-2 border-dashed border-emerald-200 z-10" />
                      )}
                      <div className="flex items-center gap-3 mb-4">
                        <span className="w-8 h-8 rounded-full bg-emerald-600 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
                          {i + 1}
                        </span>
                        <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                          <Icon className="w-5 h-5 text-emerald-600" aria-hidden="true" />
                        </div>
                      </div>
                      <h3 className="font-semibold text-gray-800 mb-1">{step.title}</h3>
                      <p className="text-sm text-gray-500">{step.desc}</p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* CTA */}
            <div className="text-center mt-10">
              {activeTab === 'customer' ? (
                <Link
                  to="/kategori/prefabrik"
                  className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition"
                >
                  {t('how.ctaBuyer')} <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>
              ) : (
                <Link
                  to="/satici-formu"
                  className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition"
                >
                  {t('how.ctaSeller')} <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* ── Neden ModülerPazar? ───────────────────────────── */}
        <section className="py-12 md:py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800">{t('why.title')}</h2>
              <p className="text-gray-600 mt-2">{t('why.subtitle')}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {TRUST_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="bg-gray-50 border border-gray-100 rounded-2xl p-6 hover:shadow-md transition-shadow"
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${item.color}`}>
                      <Icon className="w-6 h-6" aria-hidden="true" />
                    </div>
                    <h3 className="font-semibold text-gray-800 mb-2">{item.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Hakkımızda (kısa) ────────────────────────────── */}
        <section className="py-12 md:py-16 bg-emerald-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center gap-8 md:gap-14">
              <div className="flex-1">
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-2 block">
                  Hakkımızda
                </span>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3">
                  Türkiye'nin Modüler Yapı Pazarı
                </h2>
                <p className="text-gray-500 text-sm leading-relaxed mb-5">
                  ModülerPazar, alıcıları ve üreticileri tek platformda buluşturan dijital
                  pazaryeridir. Doğrulanmış firmalar, ücretsiz teklif alma ve yapay zeka
                  destekli öneri sistemiyle modüler yapı sürecinizi kolaylaştırıyoruz.
                </p>
                <Link
                  to="/hakkimizda"
                  className="inline-flex items-center gap-1.5 text-emerald-600 font-semibold hover:underline text-sm"
                >
                  Daha fazla bilgi al <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="flex-1 grid grid-cols-2 gap-3 w-full">
                {[
                  { icon: ShieldCheck, text: 'Doğrulanmış Firmalar',  color: 'bg-emerald-100 text-emerald-600' },
                  { icon: Tag,         text: 'Ücretsiz Teklif',        color: 'bg-blue-100 text-blue-600'       },
                  { icon: Sparkles,    text: 'AI Destekli Öneri',      color: 'bg-amber-100 text-amber-600'     },
                  { icon: Lock,        text: 'KVKK Uyumlu',            color: 'bg-purple-100 text-purple-600'   },
                ].map(({ icon: Icon, text, color }) => (
                  <div
                    key={text}
                    className="flex items-center gap-2 bg-white rounded-xl p-3 border border-gray-100 shadow-sm"
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Sektör Haberleri ─────────────────────────────── */}
        <section className="py-10 md:py-14 bg-white border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4">
            {/* Başlık */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Newspaper className="w-5 h-5 text-emerald-600" aria-hidden="true" />
                <h2 className="text-xl font-bold text-gray-900">Sektör Haberleri</h2>
              </div>
              <Link
                to="/haberler"
                className="flex items-center gap-1 text-sm text-emerald-600 hover:underline font-medium"
              >
                Tümünü Gör <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>

            {/* Bölge Tabs */}
            <div className="flex gap-2 mb-5">
              {([
                { key: 'turkiye', label: '🇹🇷 Türkiye'  },
                { key: 'dunya',   label: '🌍 Dünyadan' },
              ] as const).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setHaberlerTab(key)}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold transition ${
                    haberlerTab === key
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-emerald-50 hover:text-emerald-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Kartlar */}
            {haberLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : haberlerGoruntule.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Bu bölgede henüz haber yok.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {haberlerGoruntule.map((h) => (
                  <a
                    key={h.id}
                    href={h.kaynakUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex gap-3 bg-white rounded-xl border border-gray-100 shadow-sm p-3 hover:border-emerald-200 hover:shadow-md transition group"
                  >
                    <div className="w-20 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                      <img
                        src={h.gorselUrl || HABER_GORSEL}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                        onError={(e) => { (e.target as HTMLImageElement).src = HABER_GORSEL; }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-emerald-600 font-medium mb-1 truncate">{h.kaynak}</p>
                      <h3 className="text-sm font-semibold text-gray-800 leading-snug line-clamp-2 group-hover:text-emerald-700 transition">
                        {h.baslik}
                      </h3>
                      {h.tarih && (
                        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                          <Calendar className="w-3 h-3" aria-hidden="true" />
                          {formatHaberTarih(h.tarih)}
                        </p>
                      )}
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── CTA — Firma ──────────────────────────────────── */}
        <section className="py-12 md:py-16 bg-gray-900 text-white">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              {t('firmCta.title')}
            </h2>
            <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
              {t('firmCta.subtitle')}
            </p>
            <Link
              to="/satici-formu"
              className="inline-flex items-center gap-2 bg-emerald-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-emerald-500 transition"
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
