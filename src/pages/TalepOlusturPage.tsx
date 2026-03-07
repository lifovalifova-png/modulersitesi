import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner';
import { CheckCircle, Lock, ImageIcon, CalendarDays, MapPin } from 'lucide-react';
import { CATEGORIES } from '../data/categories';
import { db } from '../lib/firebase';
import { sendTalepEmail } from '../lib/emailjs';
import { sanitizeText, sanitizeUrl } from '../utils/sanitize';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Disclaimer from '../components/Disclaimer';

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
  { value: '0_100k',    label: '0 – 100.000 TL'           },
  { value: '100k_250k', label: '100.000 – 250.000 TL'     },
  { value: '250k_500k', label: '250.000 – 500.000 TL'     },
  { value: '500k_1m',   label: '500.000 – 1.000.000 TL'   },
  { value: '1m_1m5',    label: '1.000.000 – 1.500.000 TL' },
  { value: '1m5_2m',    label: '1.500.000 – 2.000.000 TL' },
  { value: '2m_ustu',   label: '2.000.000 TL ve üzeri'    },
];

/* ─── Tipler ──────────────────────────────────────────────── */
interface FormState {
  kategori: string;
  sehir: string;
  ilce: string;
  butce: string;
  metrekare: string;
  aciklama: string;
  teslimTarihi: string;
  foto1: string;
  foto2: string;
  foto3: string;
  ad: string;
  telefon: string;
  email: string;
  kvkk: boolean;
  kosullar: boolean;
}

type Errors = Partial<Record<keyof FormState, string>>;

const EMPTY: FormState = {
  kategori: '', sehir: '', ilce: '', butce: '', metrekare: '',
  aciklama: '', teslimTarihi: '', foto1: '', foto2: '', foto3: '',
  ad: '', telefon: '', email: '', kvkk: false, kosullar: false,
};

/* ─── Sayfa ───────────────────────────────────────────────── */
export default function TalepOlusturPage() {
  const navigate = useNavigate();
  const [form,       setForm]       = useState<FormState>(EMPTY);
  const [done,       setDone]       = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors,     setErrors]     = useState<Errors>({});

  const set = (field: keyof FormState, val: string | boolean) =>
    setForm((p) => ({ ...p, [field]: val }));

  /* ── Doğrulama ────────────────────────────────────────── */
  function validate(): boolean {
    const e: Errors = {};
    if (!form.kategori)          e.kategori   = 'Proje tipi seçiniz.';
    if (!form.sehir)             e.sehir      = 'Şehir seçiniz.';
    if (!form.butce)             e.butce      = 'Bütçe aralığı seçiniz.';
    if (!form.aciklama.trim())   e.aciklama   = 'Proje açıklaması zorunludur.';
    if (!form.ad.trim())         e.ad         = 'Ad soyad zorunludur.';
    if (!form.telefon.trim())    e.telefon    = 'Telefon numarası zorunludur.';
    if (!form.email.trim())      e.email      = 'E-posta adresi zorunludur.';
    if (!form.kvkk)              e.kvkk       = 'KVKK metnini onaylamanız gereklidir.';
    if (!form.kosullar)          e.kosullar   = 'Kullanım koşullarını onaylamanız gereklidir.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  /* ── Gönder ───────────────────────────────────────────── */
  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) {
      toast.error('Lütfen zorunlu alanları doldurunuz.');
      return;
    }
    setSubmitting(true);
    try {
      const fotograflar = [form.foto1, form.foto2, form.foto3]
        .map(sanitizeUrl)
        .filter(Boolean);
      await addDoc(collection(db, 'taleplar'), {
        kategori:           form.kategori,
        sehir:              form.sehir,
        ilce:               sanitizeText(form.ilce, 100),
        butce:              form.butce,
        metrekare:          form.metrekare,
        aciklama:           sanitizeText(form.aciklama, 1000),
        teslimTarihi:       form.teslimTarihi,
        fotograflar,
        ad:                 sanitizeText(form.ad, 100),
        telefon:            form.telefon.trim(),
        email:              form.email.trim().toLowerCase(),
        status:             'beklemede',
        firmaGonderilenler: [],
        firmaKabulEdenler:  [],
        tarih:              serverTimestamp(),
      });

      /* EmailJS bildirimi — hata oluşursa sessizce geç, talep kaydedildi */
      try {
        await sendTalepEmail({
          kategori: form.kategori,
          sehir:    form.sehir,
          butce:    form.butce,
          aciklama: sanitizeText(form.aciklama, 1000),
          ad:       sanitizeText(form.ad, 100),
          telefon:  form.telefon.trim(),
          email:    form.email.trim().toLowerCase(),
        });
      } catch (err) {
        console.error('Email gönderilemedi:', err);
      }

      /* Google Sheets webhook — fire & forget, hata oluşursa sessizce geç */
      void fetch('/api/sheets-export', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kategori: form.kategori,
          sehir:    form.sehir,
          butce:    form.butce,
          tarih:    new Date().toISOString(),
          ad:       sanitizeText(form.ad, 100),
          telefon:  form.telefon.trim(),
          email:    form.email.trim().toLowerCase(),
          status:   'beklemede',
        }),
      }).catch(() => { /* webhook hatası kullanıcıyı etkilemez */ });

      setDone(true);
    } catch {
      toast.error('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Yardımcılar ──────────────────────────────────────── */
  const inputBase = 'w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent';
  const inp  = (f: keyof FormState) => `${inputBase} ${errors[f] ? 'border-red-400 bg-red-50' : 'border-gray-300'}`;
  const Err  = ({ f }: { f: keyof FormState }) =>
    errors[f] ? <p className="text-xs text-red-500 mt-1">{errors[f]}</p> : null;
  const today = new Date().toISOString().split('T')[0];

  /* ── Başarı ekranı ────────────────────────────────────── */
  if (done) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 bg-gray-50 flex items-center justify-center py-16 px-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-9 h-9 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Talebiniz Alındı!</h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-8">
              Projenize uygun firmalar bilgilendirilecek ve en kısa sürede sizinle
              iletişime geçecekler. Firma tekliflerini e-posta veya telefon
              yoluyla alacaksınız.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => { setDone(false); setForm(EMPTY); setErrors({}); }}
                className="border border-emerald-600 text-emerald-600 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-emerald-50 transition"
              >
                Yeni Talep Oluştur
              </button>
              <button
                onClick={() => navigate('/')}
                className="bg-emerald-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-emerald-700 transition"
              >
                Ana Sayfaya Dön
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  /* ── Form ─────────────────────────────────────────────── */
  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 bg-gray-50 py-10">
        <div className="max-w-2xl mx-auto px-4">

          {/* Breadcrumb */}
          <nav className="text-sm text-gray-500 mb-6 flex items-center gap-2">
            <Link to="/" className="hover:text-emerald-600 transition">Ana Sayfa</Link>
            <span>/</span>
            <span className="text-gray-800">Teklif İste</span>
          </nav>

          <h1 className="text-2xl font-bold text-gray-900 mb-1">Teklif İste</h1>
          <p className="text-sm text-gray-500 mb-4">
            Projenizi tanımlayın; size uygun firmalar tekliflerini iletsin.
            Kişisel bilgileriniz yalnızca talebinizi kabul eden firmalarla paylaşılır.
          </p>

          <div className="mb-8">
            <Disclaimer />
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-6">

            {/* ── 1. Proje Bilgileri ─────────────────────── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wide flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                Proje Bilgileri
              </h2>

              {/* Proje tipi */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Proje Tipi <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.kategori}
                  onChange={(e) => set('kategori', e.target.value)}
                  className={inp('kategori')}
                >
                  <option value="">Seçiniz…</option>
                  {CATEGORIES.map((c) => (
                    <option key={c.slug} value={c.slug}>{c.name}</option>
                  ))}
                </select>
                <Err f="kategori" />
              </div>

              {/* Şehir + İlçe */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Şehir <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.sehir}
                    onChange={(e) => set('sehir', e.target.value)}
                    className={inp('sehir')}
                  >
                    <option value="">Seçiniz…</option>
                    {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <Err f="sehir" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">İlçe</label>
                  <input
                    value={form.ilce}
                    onChange={(e) => set('ilce', e.target.value)}
                    placeholder="İsteğe bağlı"
                    className={`${inputBase} border-gray-300`}
                  />
                </div>
              </div>

              {/* Bütçe + Metrekare */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tahmini Bütçe <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.butce}
                    onChange={(e) => set('butce', e.target.value)}
                    className={inp('butce')}
                  >
                    <option value="">Seçiniz…</option>
                    {BUDGET_RANGES.map((b) => (
                      <option key={b.value} value={b.value}>{b.label}</option>
                    ))}
                  </select>
                  <Err f="butce" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Metrekare / Boyut
                  </label>
                  <input
                    value={form.metrekare}
                    onChange={(e) => set('metrekare', e.target.value)}
                    placeholder="örn. 80 m² veya 6×12 m"
                    className={`${inputBase} border-gray-300`}
                  />
                </div>
              </div>

              {/* Açıklama */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Proje Açıklaması <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={form.aciklama}
                  onChange={(e) => set('aciklama', e.target.value)}
                  placeholder="Kullanım amacı, özel gereksinimler, tercihleriniz, kurulum detayları…"
                  className={`${inp('aciklama')} resize-none`}
                />
                <Err f="aciklama" />
              </div>

              {/* Teslim tarihi */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                  <CalendarDays className="w-4 h-4 text-gray-400" />
                  Tercih Edilen Teslim Tarihi
                </label>
                <input
                  type="date"
                  value={form.teslimTarihi}
                  onChange={(e) => set('teslimTarihi', e.target.value)}
                  min={today}
                  className={`${inputBase} border-gray-300`}
                />
              </div>
            </div>

            {/* ── 2. Fotoğraflar ────────────────────────── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-3">
              <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wide flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-emerald-600" />
                Referans Görseller
                <span className="text-xs text-gray-400 font-normal normal-case">(isteğe bağlı, maks. 3 URL)</span>
              </h2>
              {(['foto1', 'foto2', 'foto3'] as const).map((f, i) => (
                <input
                  key={f}
                  value={form[f]}
                  onChange={(e) => set(f, e.target.value)}
                  placeholder={`Görsel URL ${i + 1} — https://...`}
                  className={`${inputBase} border-gray-300`}
                />
              ))}
            </div>

            {/* ── 3. İletişim Bilgileri ─────────────────── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              <div>
                <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wide flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-600" />
                  İletişim Bilgileri
                </h2>
                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Bilgileriniz gizli tutulur; yalnızca talebinizi kabul eden firmalarla paylaşılır.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ad Soyad <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.ad}
                  onChange={(e) => set('ad', e.target.value)}
                  placeholder="Adınız Soyadınız"
                  className={inp('ad')}
                />
                <Err f="ad" />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefon <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={form.telefon}
                    onChange={(e) => set('telefon', e.target.value)}
                    placeholder="05XX XXX XX XX"
                    className={inp('telefon')}
                  />
                  <Err f="telefon" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    E-posta <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => set('email', e.target.value)}
                    placeholder="ornek@email.com"
                    className={inp('email')}
                  />
                  <Err f="email" />
                </div>
              </div>
            </div>

            {/* ── 4. Onaylar ────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.kvkk}
                  onChange={(e) => set('kvkk', e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-emerald-600"
                />
                <span className={`text-sm ${errors.kvkk ? 'text-red-600' : 'text-gray-600'}`}>
                  <Link to="/kvkk" target="_blank" className="text-emerald-600 hover:underline">
                    KVKK Aydınlatma Metni
                  </Link>'ni okudum ve kişisel verilerimin işlenmesini onaylıyorum.
                  <span className="text-red-500 ml-1">*</span>
                </span>
              </label>
              <Err f="kvkk" />

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.kosullar}
                  onChange={(e) => set('kosullar', e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-emerald-600"
                />
                <span className={`text-sm ${errors.kosullar ? 'text-red-600' : 'text-gray-600'}`}>
                  <Link to="/kullanim-kosullari" target="_blank" className="text-emerald-600 hover:underline">
                    Kullanım Koşulları
                  </Link>'nı okudum ve kabul ediyorum.
                  <span className="text-red-500 ml-1">*</span>
                </span>
              </label>
              <Err f="kosullar" />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-emerald-600 text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-emerald-700 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Gönderiliyor…</>
                : 'Teklif İste →'
              }
            </button>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
