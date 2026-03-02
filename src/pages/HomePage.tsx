import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight, Building, Container, Home, Hammer, TreePine, Recycle, Star,
  Zap, Search, CheckSquare, FileText, BarChart2,
  UserPlus, ClipboardList, Handshake,
  ShieldCheck, Tag, MapPin, Lock,
  Sparkles, MessageSquare,
  type LucideIcon,
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import FlashDealsCarousel from '../components/FlashDealsCarousel';
import { CATEGORIES } from '../data/categories';
import { useLanguage } from '../context/LanguageContext';

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
  const [activeTab, setActiveTab] = useState<'customer' | 'producer'>('customer');

  /* ─── Translated data arrays ────────────────────────────── */
  const STATS = [
    { label: t('stats.activeAds'),       target: 2500,  suffix: '+' },
    { label: t('stats.registeredFirms'), target: 850,   suffix: '+' },
    { label: t('stats.happyCustomers'),  target: 12000, suffix: '+' },
    { label: t('stats.cities'),          target: 81,    suffix: ''  },
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
  const [aiQuery,    setAiQuery]    = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading,  setAiLoading]  = useState(false);
  const [aiError,    setAiError]    = useState('');
  const [aiSlug,     setAiSlug]     = useState('prefabrik');
  const resultRef = useRef<HTMLDivElement>(null);

  const handleAsk = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const q = aiQuery.trim();
    if (!q) return;
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
        content?: Array<{ text: string }>;
        error?:   { message?: string } | string;
      };
      if (!res.ok) {
        const msg = typeof data.error === 'string'
          ? data.error
          : (data.error as { message?: string })?.message ?? `HTTP ${res.status}`;
        throw new Error(msg);
      }
      const text = data.content?.[0]?.text ?? '';
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
              <form onSubmit={handleAsk} className="flex gap-2">
                <div className="relative flex-1">
                  <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" aria-hidden="true" />
                  <input
                    type="text"
                    value={aiQuery}
                    onChange={(e) => setAiQuery(e.target.value)}
                    placeholder={t('ai.placeholder')}
                    className="w-full pl-9 pr-3 py-3 bg-white/15 backdrop-blur border border-white/30 rounded-xl text-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/40 focus:bg-white/20 transition"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!aiQuery.trim() || aiLoading}
                  className="flex-shrink-0 flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-amber-900 font-bold px-4 py-3 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed text-sm whitespace-nowrap"
                >
                  {aiLoading
                    ? <span className="w-4 h-4 border-2 border-amber-700/30 border-t-amber-900 rounded-full animate-spin" />
                    : <Sparkles className="w-4 h-4" aria-hidden="true" />
                  }
                  <span className="hidden sm:inline">{t('ai.btnAsk')}</span>
                </button>
              </form>
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
        {(aiResponse || aiLoading || aiError) && (
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
