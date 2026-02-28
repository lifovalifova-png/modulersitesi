import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight, Building, Container, Home, Hammer, TreePine, Recycle, Star,
  Zap, Search, CheckSquare, FileText, BarChart2,
  UserPlus, ClipboardList, Handshake,
  ShieldCheck, Tag, MapPin, Lock,
  Sparkles, SendHorizontal, MessageSquare,
  type LucideIcon,
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import FlashDealsCarousel from '../components/FlashDealsCarousel';
import { CATEGORIES } from '../data/categories';

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

/* ─── İstatistikler ──────────────────────────────────────── */
const STATS = [
  { label: 'Aktif İlan',    value: '2.500+' },
  { label: 'Kayıtlı Firma', value: '850+'   },
  { label: 'Mutlu Müşteri', value: '12.000+'},
  { label: 'Şehir',         value: '81'     },
];

/* ─── Nasıl Çalışır adımları ─────────────────────────────── */
const CUSTOMER_STEPS = [
  { icon: Search,      title: 'İlan Ara',      desc: 'Kategori, konum ve fiyat aralığına göre ilanları filtrele.' },
  { icon: CheckSquare, title: '2 Firma Seç',   desc: 'Beğendiğin ilanlardan en fazla 2 firma seç.' },
  { icon: FileText,    title: 'Teklif Al',     desc: 'Tek tıkla her iki firmaya teklif talebi gönder.' },
  { icon: BarChart2,   title: 'Karşılaştır',  desc: 'Gelen teklifleri yan yana karşılaştır, en iyisini seç.' },
];

const PRODUCER_STEPS = [
  { icon: UserPlus,       title: 'Üye Ol',          desc: 'Firma bilgilerinle ücretsiz kayıt ol, kimliğini doğrulat.' },
  { icon: ClipboardList,  title: 'İlan Ver',         desc: 'Ürün ve hizmetlerini fotoğraf ve detaylarla listele.' },
  { icon: Handshake,      title: 'Müşteriye Ulaş',  desc: 'Gelen teklif taleplerini değerlendir, anlaş.' },
];

/* ─── Güven artırıcı özellikler ──────────────────────────── */
const TRUST_ITEMS = [
  {
    icon: ShieldCheck,
    title: 'Doğrulanmış Firmalar',
    desc: 'Her firma kimlik ve ticari sicil doğrulamasından geçer. Güvensiz satıcıya ulaşamazsın.',
    color: 'bg-emerald-100 text-emerald-600',
  },
  {
    icon: Tag,
    title: 'Ücretsiz Teklif Sistemi',
    desc: 'Platform üzerinden teklif almak tamamen ücretsizdir. Gizli ücret yok.',
    color: 'bg-blue-100 text-blue-600',
  },
  {
    icon: MapPin,
    title: 'Bölge Bazlı Eşleşme',
    desc: 'Bulunduğun bölgedeki firmalarla eşleş, gereksiz nakliye maliyeti ödeme.',
    color: 'bg-amber-100 text-amber-600',
  },
  {
    icon: Lock,
    title: 'KVKK Uyumlu Güvenlik',
    desc: 'Kişisel verilerinin işlenmesi Türk KVKK mevzuatına tam uyumlu şekilde yürütülür.',
    color: 'bg-purple-100 text-purple-600',
  },
];

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
  const [activeTab, setActiveTab] = useState<'customer' | 'producer'>('customer');

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
        <section className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-800 text-white py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4">
            <div className="max-w-3xl">

              {/* Öne çıkan badge */}
              <div className="inline-flex items-center gap-2 bg-amber-400 text-amber-900 text-sm font-bold px-4 py-1.5 rounded-full mb-6">
                <Zap className="w-4 h-4" aria-hidden="true" />
                Aynı anda 2 firmadan teklif al, en iyisini seç!
              </div>

              <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
                Modüler Yapı Çözümlerinde Türkiye'nin En Büyük Pazarı
              </h1>
              <p className="text-lg md:text-xl text-emerald-100 mb-8">
                Prefabrik evler, konteynerler, tiny house ve daha fazlası.
                Binlerce ilan arasından size uygun olanı bulun veya kendi ilanınızı verin.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/satici-formu"
                  className="bg-white text-emerald-700 px-6 py-3 rounded-lg font-semibold hover:bg-emerald-50 transition text-center"
                >
                  Ücretsiz İlan Ver
                </Link>
                <Link
                  to="/kategori/prefabrik"
                  className="bg-emerald-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-400 transition text-center flex items-center justify-center gap-2"
                >
                  İlanları Keşfet <ArrowRight className="w-5 h-5" aria-hidden="true" />
                </Link>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
              {STATS.map((stat) => (
                <div key={stat.label} className="bg-white/10 backdrop-blur rounded-lg p-4 text-center">
                  <div className="text-2xl md:text-3xl font-bold">{stat.value}</div>
                  <div className="text-emerald-200 text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Flaş Fırsatlar (Hero'nun hemen altı) ────────── */}
        <FlashDealsCarousel />

        {/* ── Kategoriler ──────────────────────────────────── */}
        <section className="py-12 md:py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Kategoriler</h2>
              <p className="text-gray-600 mt-1">İhtiyacınıza uygun kategoriyi seçin</p>
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
                    <p className="text-sm text-gray-500 mt-1">{category.count} ilan</p>
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
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Nasıl Çalışır?</h2>
              <p className="text-gray-600 mt-2">Hem alıcı hem satıcı için basit ve hızlı</p>
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
                  Alıcı / Müşteri
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
                  Üretici / Firma
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
                  Hemen İlan Ara <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>
              ) : (
                <Link
                  to="/satici-formu"
                  className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition"
                >
                  Ücretsiz Üye Ol <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* ── Yapı Asistanı Widget ─────────────────────────── */}
        <section className="py-12 md:py-16 bg-gradient-to-br from-emerald-600 to-emerald-800">
          <div className="max-w-3xl mx-auto px-4">

            {/* Başlık */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
                <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                Claude AI Destekli
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                Size Uygun Yapıyı Bulalım
              </h2>
              <p className="text-emerald-100 text-sm md:text-base">
                Şehrinizi ve ihtiyacınızı yazın, size özel öneri alalım
              </p>
            </div>

            {/* Input + Buton */}
            <form onSubmit={handleAsk} className="flex gap-2">
              <input
                type="text"
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                placeholder='örn. "Ankara\'da 80 m² yazlık prefabrik" veya "İzmir\'de ucuz depo"'
                className="flex-1 bg-white rounded-xl px-4 py-3.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50 shadow-sm"
              />
              <button
                type="submit"
                disabled={!aiQuery.trim() || aiLoading}
                className="flex-shrink-0 flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-amber-900 font-bold px-5 py-3.5 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm text-sm"
              >
                {aiLoading
                  ? <span className="w-4 h-4 border-2 border-amber-700/30 border-t-amber-900 rounded-full animate-spin" />
                  : <SendHorizontal className="w-4 h-4" aria-hidden="true" />
                }
                <span className="hidden sm:inline">Öneri Al</span>
              </button>
            </form>

            {/* Sonuç kutusu */}
            {(aiResponse || aiLoading || aiError) && (
              <div ref={resultRef} className="mt-4">

                {/* Loading */}
                {aiLoading && (
                  <div className="bg-white/10 backdrop-blur rounded-2xl px-6 py-8 text-center text-white">
                    <span className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block mb-3" />
                    <p className="text-sm font-medium">Analiz ediliyor…</p>
                  </div>
                )}

                {/* Hata */}
                {aiError && !aiLoading && (
                  <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 text-sm text-red-700">
                    {aiError}
                  </div>
                )}

                {/* Yanıt */}
                {aiResponse && !aiLoading && (
                  <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                    <div className="flex items-center gap-2.5 px-5 py-3.5 bg-emerald-50 border-b border-emerald-100">
                      <Sparkles className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                      <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">
                        Yapı Asistanı Önerisi
                      </span>
                    </div>
                    <div className="px-5 py-5">
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                        {aiResponse}
                      </p>
                    </div>
                    <div className="px-5 pb-5 flex flex-col sm:flex-row gap-2.5">
                      <button
                        onClick={() => navigate('/talep-olustur')}
                        className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-700 transition"
                      >
                        <MessageSquare className="w-4 h-4" aria-hidden="true" />
                        Teklif İste
                      </button>
                      <button
                        onClick={() => navigate(`/kategori/${aiSlug}`)}
                        className="flex-1 flex items-center justify-center gap-2 border border-emerald-600 text-emerald-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-50 transition"
                      >
                        <Search className="w-4 h-4" aria-hidden="true" />
                        İlanları Gör
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* ── Neden ModülerPazar? ───────────────────────────── */}
        <section className="py-12 md:py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Neden ModülerPazar?</h2>
              <p className="text-gray-600 mt-2">
                Güvenli, şeffaf ve ücretsiz — modüler yapı alım-satımında tek adres
              </p>
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
              Firmanız mı var? Hemen İlan Verin!
            </h2>
            <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
              Binlerce potansiyel müşteriye ulaşın. İlk ilanınız ücretsiz!
            </p>
            <Link
              to="/satici-formu"
              className="inline-flex items-center gap-2 bg-emerald-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-emerald-500 transition"
            >
              Şimdi Başla <ArrowRight className="w-5 h-5" aria-hidden="true" />
            </Link>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
