import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import {
  Sparkles, MapPin, Building2, Ruler, Banknote,
  Zap, Shield, Wallet, ChevronRight, Search,
  MessageSquare, AlertCircle, Bot,
} from 'lucide-react';
import { CATEGORIES } from '../data/categories';
import Header from '../components/Header';
import Footer from '../components/Footer';

/* ─── Sabitler ────────────────────────────────────────────── */
const CITIES = [
  'Adana','Adıyaman','Afyonkarahisar','Ağrı','Amasya','Ankara','Antalya','Artvin',
  'Aydın','Balıkesir','Bilecik','Bingöl','Bitlis','Bolu','Burdur','Bursa','Çanakkale',
  'Çankırı','Çorum','Denizli','Diyarbakır','Edirne','Elazığ','Erzincan','Erzurum',
  'Eskişehir','Gaziantep','Giresun','Gümüşhane','Hakkari','Hatay','Isparta','Mersin',
  'İstanbul','İzmir','Kars','Kastamonu','Kayseri','Kırklareli','Kırşehir','Kocaeli',
  'Konya','Kütahya','Malatya','Manisa','Kahramanmaraş','Mardin','Muğla','Muş',
  'Nevşehir','Niğde','Ordu','Rize','Sakarya','Samsun','Siirt','Sinop','Sivas',
  'Tekirdağ','Tokat','Trabzon','Tunceli','Şanlıurfa','Uşak','Van','Yozgat',
  'Zonguldak','Aksaray','Bayburt','Karaman','Kırıkkale','Batman','Şırnak',
  'Bartın','Ardahan','Iğdır','Yalova','Karabük','Kilis','Osmaniye','Düzce',
];

const BUDGET_RANGES = [
  { value: '50k_alti',  label: '50.000 ₺ altı' },
  { value: '50k_100k',  label: '50.000 – 100.000 ₺' },
  { value: '100k_250k', label: '100.000 – 250.000 ₺' },
  { value: '250k_ustu', label: '250.000 ₺ üzeri' },
];

const AMAC_OPTIONS = [
  { value: 'konut',    label: 'Konut / Yaşam Alanı' },
  { value: 'is_yeri',  label: 'İş Yeri / Ofis' },
  { value: 'depo',     label: 'Depo / Antrepo' },
  { value: 'tarim',    label: 'Tarımsal Yapı' },
  { value: 'diger',    label: 'Diğer' },
];

const ONCELIK_OPTIONS = [
  {
    value: 'hiz',
    label: 'Hız',
    Icon: Zap,
    desc: 'Hızlı teslimat ve montaj',
  },
  {
    value: 'dayaniklilik',
    label: 'Dayanıklılık',
    Icon: Shield,
    desc: 'Uzun ömürlü, sağlam yapı',
  },
  {
    value: 'maliyet',
    label: 'Maliyet',
    Icon: Wallet,
    desc: 'Ekonomik çözüm',
  },
] as const;

type OncelikValue = typeof ONCELIK_OPTIONS[number]['value'];

/* ─── AI Sistem Promptu ───────────────────────────────────── */
const SYSTEM_PROMPT = `Sen ModülerPazar'ın yapı danışmanısın. Türkiye'deki modüler yapı sektörünü çok iyi biliyorsun. Kullanıcının şehrine göre:
- O bölgenin iklim özelliklerini (yağış, kar, deprem riski, sıcaklık) biliyorsun
- Zemin yapısı ve temel gereksinimleri hakkında genel bilgi veriyorsun
- Bütçe ve kullanım amacına göre en uygun yapı tipini öneriyorsun
- Prefabrik, çelik yapı, konteyner, tiny house avantaj/dezavantajlarını karşılaştırıyorsun
- Tahmini maliyet aralığı veriyorsun (m² başına TL)
- Türkçe, samimi ve anlaşılır dil kullan
- Yanıtı şu başlıklarla ver: 🌍 Bölge Analizi | 🏗️ Önerilen Yapı Tipi | 💰 Tahmini Maliyet | ⚠️ Dikkat Edilecekler`;

/* ─── Kategori tahmini ────────────────────────────────────── */
function extractSlug(text: string): string {
  const t = text.toLowerCase();
  if (t.includes('konteyner'))                             return 'yasam-konteynerleri';
  if (t.includes('tiny house') || t.includes('tiny-house')) return 'tiny-house';
  if (t.includes('çelik') || t.includes('celik'))         return 'celik-yapilar';
  if (t.includes('ahşap') || t.includes('ahsap'))         return 'ahsap-yapilar';
  if (t.includes('özel proje') || t.includes('ozel'))     return 'ozel-projeler';
  return 'prefabrik';
}

/* ─── Markdown bileşen stilleri ──────────────────────────── */
const mdComponents: Components = {
  h1: ({ children }) => (
    <h1 className="text-lg font-bold text-gray-900 mt-5 mb-2 first:mt-0">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-base font-bold text-gray-800 mt-5 mb-2 first:mt-0">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-sm font-semibold text-gray-700 mt-3 mb-1">{children}</h3>
  ),
  p: ({ children }) => (
    <p className="text-sm text-gray-600 leading-relaxed mb-3">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="space-y-1.5 mb-3 ml-1">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="space-y-1.5 mb-3 ml-5 list-decimal">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="text-sm text-gray-600 flex items-start gap-2">
      <span className="mt-2 w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
      <span>{children}</span>
    </li>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-gray-800">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="italic text-gray-600">{children}</em>
  ),
  hr: () => <hr className="border-gray-200 my-4" />,
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-emerald-300 pl-4 my-3 text-sm text-gray-500 italic">
      {children}
    </blockquote>
  ),
};

/* ─── Form state tipi ─────────────────────────────────────── */
interface FormState {
  sehir:    string;
  amac:     string;
  alan:     string;
  butce:    string;
  oncelik:  OncelikValue | '';
}

const EMPTY_FORM: FormState = {
  sehir: '', amac: '', alan: '', butce: '', oncelik: '',
};

/* ─── Sayfa ───────────────────────────────────────────────── */
export default function YapiAsistaniPage() {
  const navigate = useNavigate();

  const [form,       setForm]       = useState<FormState>(EMPTY_FORM);
  const [aiResponse, setAiResponse] = useState('');
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [suggested,  setSuggested]  = useState('prefabrik');

  const set = (field: keyof FormState, val: string) =>
    setForm((p) => ({ ...p, [field]: val }));

  const canSubmit = !!(form.sehir && form.amac && form.butce && form.oncelik);

  /* ── API çağrısı ──────────────────────────────────────── */
  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!canSubmit) return;

    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
    if (!apiKey) {
      setError(
        'API anahtarı yapılandırılmamış. Lütfen VITE_ANTHROPIC_API_KEY ortam değişkenini ayarlayın.',
      );
      return;
    }

    setLoading(true);
    setError('');
    setAiResponse('');

    const amacLabel     = AMAC_OPTIONS.find((a) => a.value === form.amac)?.label ?? form.amac;
    const butceLabel    = BUDGET_RANGES.find((b) => b.value === form.butce)?.label ?? form.butce;
    const oncelikLabel  = ONCELIK_OPTIONS.find((o) => o.value === form.oncelik)?.label ?? form.oncelik;

    const userMessage = [
      `Şehir: ${form.sehir}`,
      `Yapı Amacı: ${amacLabel}`,
      form.alan ? `Kullanım Alanı: ${form.alan} m²` : null,
      `Bütçe: ${butceLabel}`,
      `Öncelik: ${oncelikLabel}`,
      '',
      'Bu bilgilere göre bana en uygun modüler yapı tipini öner.',
    ].filter((l) => l !== null).join('\n');

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type':                          'application/json',
          'x-api-key':                             apiKey,
          'anthropic-version':                     '2023-06-01',
          'anthropic-dangerous-direct-browser-calls': 'true',
        },
        body: JSON.stringify({
          model:      'claude-sonnet-4-6',
          max_tokens: 1024,
          system:     SYSTEM_PROMPT,
          messages:   [{ role: 'user', content: userMessage }],
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(
          (errData as { error?: { message?: string } }).error?.message ??
          `API hatası: ${res.status}`,
        );
      }

      const data = await res.json() as {
        content?: Array<{ type: string; text: string }>;
      };
      const text = data.content?.[0]?.text ?? '';
      setAiResponse(text);
      setSuggested(extractSlug(text));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bilinmeyen hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Önerilen kategori adı ────────────────────────────── */
  const suggestedCatName = CATEGORIES.find((c) => c.slug === suggested)?.name ?? 'Prefabrik';

  /* ── Render ─────────────────────────────────────────────── */
  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 bg-gray-50 py-10">
        <div className="max-w-6xl mx-auto px-4">

          {/* ── Hero ─────────────────────────────────────── */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              Claude AI Destekli
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
              Yapı Asistanı
            </h1>
            <p className="text-gray-500 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
              Şehrinizi ve bütçenizi girin, size en uygun modüler yapı çözümünü önerelim.
              Bölge iklimi, zemin özellikleri ve bütçeye göre kişiselleştirilmiş tavsiye alın.
            </p>
          </div>

          {/* ── İki kolon düzeni ──────────────────────────── */}
          <div className="grid lg:grid-cols-5 gap-6 items-start">

            {/* ── Sol: Form ─────────────────────────────── */}
            <div className="lg:col-span-2 lg:sticky lg:top-6">
              <form
                onSubmit={handleSubmit}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5"
              >
                {/* Şehir */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-emerald-600" />
                      Şehir <span className="text-red-500">*</span>
                    </span>
                  </label>
                  <select
                    value={form.sehir}
                    onChange={(e) => set('sehir', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="">Seçiniz…</option>
                    {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* Yapı amacı */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-emerald-600" />
                      Yapı Amacı <span className="text-red-500">*</span>
                    </span>
                  </label>
                  <select
                    value={form.amac}
                    onChange={(e) => set('amac', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="">Seçiniz…</option>
                    {AMAC_OPTIONS.map((a) => (
                      <option key={a.value} value={a.value}>{a.label}</option>
                    ))}
                  </select>
                </div>

                {/* Kullanım alanı */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <Ruler className="w-4 h-4 text-emerald-600" />
                      Kullanım Alanı (m²)
                      <span className="text-xs text-gray-400 font-normal">isteğe bağlı</span>
                    </span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="9999"
                    value={form.alan}
                    onChange={(e) => set('alan', e.target.value)}
                    placeholder="örn. 80"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>

                {/* Bütçe */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <Banknote className="w-4 h-4 text-emerald-600" />
                      Bütçe Aralığı <span className="text-red-500">*</span>
                    </span>
                  </label>
                  <select
                    value={form.butce}
                    onChange={(e) => set('butce', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="">Seçiniz…</option>
                    {BUDGET_RANGES.map((b) => (
                      <option key={b.value} value={b.value}>{b.label}</option>
                    ))}
                  </select>
                </div>

                {/* Öncelik — 3 kart */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Önceliğiniz <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {ONCELIK_OPTIONS.map(({ value, label, Icon, desc }) => {
                      const selected = form.oncelik === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => set('oncelik', value)}
                          className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-center transition ${
                            selected
                              ? 'border-emerald-500 bg-emerald-50'
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                        >
                          <Icon
                            className={`w-5 h-5 ${selected ? 'text-emerald-600' : 'text-gray-400'}`}
                          />
                          <span className={`text-xs font-semibold ${selected ? 'text-emerald-700' : 'text-gray-700'}`}>
                            {label}
                          </span>
                          <span className="text-xs text-gray-400 leading-tight">{desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={!canSubmit || loading}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading
                    ? <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Analiz ediliyor…
                      </>
                    : <>
                        <Sparkles className="w-4 h-4" />
                        Öneri Al
                      </>
                  }
                </button>

                {!canSubmit && (
                  <p className="text-xs text-center text-gray-400">
                    * ile işaretli alanları doldurunuz
                  </p>
                )}
              </form>
            </div>

            {/* ── Sağ: AI yanıtı ────────────────────────── */}
            <div className="lg:col-span-3">

              {/* Empty state */}
              {!aiResponse && !loading && !error && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Bot className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-2 text-lg">
                    Yapı Asistanınız Hazır
                  </h3>
                  <p className="text-sm text-gray-500 max-w-sm mx-auto mb-8 leading-relaxed">
                    Formu doldurup "Öneri Al" butonuna tıklayın.
                    Size özel bölge analizi ve yapı önerisi hazırlayalım.
                  </p>
                  <div className="grid sm:grid-cols-2 gap-3 text-left">
                    {[
                      { emoji: '🌍', text: 'Bölge iklimine göre yapı analizi' },
                      { emoji: '🏗️', text: 'En uygun yapı tipi önerisi' },
                      { emoji: '💰', text: 'm² başına maliyet tahmini' },
                      { emoji: '⚠️', text: 'Dikkat edilmesi gerekenler' },
                    ].map((item) => (
                      <div
                        key={item.text}
                        className="flex items-center gap-3 bg-gray-50 rounded-xl p-3.5"
                      >
                        <span className="text-xl">{item.emoji}</span>
                        <span className="text-sm text-gray-600">{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Loading */}
              {loading && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
                  <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin block" />
                  </div>
                  <p className="font-semibold text-gray-800">Yapı analizi yapılıyor…</p>
                  <p className="text-sm text-gray-400 mt-1">
                    {form.sehir} için bölge verileri işleniyor
                  </p>
                </div>
              )}

              {/* Hata */}
              {error && (
                <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm text-red-700">Hata oluştu</p>
                      <p className="text-sm text-red-600 mt-1">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* AI yanıtı */}
              {aiResponse && (
                <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm overflow-hidden">

                  {/* Başlık bandı */}
                  <div className="bg-gradient-to-r from-emerald-50 to-blue-50 px-6 py-4 border-b border-emerald-100 flex items-center gap-3">
                    <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">Yapı Öneriniz Hazır</p>
                      <p className="text-xs text-gray-500">
                        {form.sehir}
                        {form.amac && ` · ${AMAC_OPTIONS.find((a) => a.value === form.amac)?.label}`}
                        {form.alan && ` · ${form.alan} m²`}
                      </p>
                    </div>
                  </div>

                  {/* Markdown içerik */}
                  <div className="px-6 py-6">
                    <ReactMarkdown components={mdComponents}>
                      {aiResponse}
                    </ReactMarkdown>
                  </div>

                  {/* Uyarı notu */}
                  <div className="mx-6 mb-5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800">
                    Bu öneri bilgi amaçlıdır. Kesin karar vermeden önce bir yapı uzmanına danışmanızı tavsiye ederiz.
                  </div>

                  {/* Aksiyon butonları */}
                  <div className="px-6 pb-6 flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => navigate(`/kategori/${suggested}`)}
                      className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-emerald-700 transition"
                    >
                      <Search className="w-4 h-4" />
                      {suggestedCatName} İlanlarına Bak
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => navigate('/talep-olustur')}
                      className="flex-1 flex items-center justify-center gap-2 border border-emerald-600 text-emerald-600 py-3 rounded-xl text-sm font-semibold hover:bg-emerald-50 transition"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Firmalardan Teklif İste
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
