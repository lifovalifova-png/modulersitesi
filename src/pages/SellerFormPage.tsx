import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, addDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { CATEGORIES } from '../data/categories';
import { sanitizeText, sanitizeUrl } from '../utils/sanitize';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEOMeta from '../components/SEOMeta';
import { sendFirmaBasvuruEmail } from '../lib/emailjs';
import {
  Factory, Store, Check, CheckCircle, AlertCircle, Loader2,
  Globe, MessageCircle, ChevronRight, ChevronLeft, MapPin,
} from 'lucide-react';

/* ─── Veri ───────────────────────────────────────────────────── */

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

const FIRMA_YAPILARI = [
  { value: 'sahis',   label: 'Şahıs Şirketi' },
  { value: 'limited', label: 'Limited Şirket' },
  { value: 'anonim',  label: 'Anonim Şirket'  },
  { value: 'diger',   label: 'Diğer'           },
];

/* ─── Tipler ─────────────────────────────────────────────────── */

interface FormState {
  firmaType:       'uretici' | 'satici' | '';
  firmaAdi:        string;
  vergiNo:         string;
  firmaYapisi:     string;
  telefon:         string;
  eposta:          string;
  website:         string;
  whatsapp:        string;
  sehir:           string;
  kategoriler:     string[];
  hizmetBolgeleri: string[];
  tanitimMetni:    string;
  gorselUrl:       string;
  kvkkOnay:        boolean;
  kullanimOnay:    boolean;
}

type Errors = Partial<Record<keyof FormState | 'submit', string>>;

const EMPTY: FormState = {
  firmaType: '', firmaAdi: '', vergiNo: '', firmaYapisi: '',
  telefon: '', eposta: '', website: '', whatsapp: '',
  sehir: '',
  kategoriler: [], hizmetBolgeleri: [],
  tanitimMetni: '', gorselUrl: '',
  kvkkOnay: false, kullanimOnay: false,
};

/* ─── Helpers ────────────────────────────────────────────────── */

const inp = 'w-full px-3 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent';

function Field({ label, required, error, hint, children }: {
  label: string; required?: boolean; error?: string; hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        {hint && <span className="text-gray-400 font-normal ml-1 text-xs">{hint}</span>}
      </label>
      {children}
      {error && (
        <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
          <AlertCircle className="w-3 h-3 flex-shrink-0" />{error}
        </p>
      )}
    </div>
  );
}

function toggle<T>(arr: T[], val: T): T[] {
  return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
}

/* ─── Adım göstergesi ────────────────────────────────────────── */

const STEPS = [
  { n: 1, label: 'Firma Bilgileri' },
  { n: 2, label: 'Kategori & Bölge' },
  { n: 3, label: 'Tanıtım' },
  { n: 4, label: 'Onay & Gönder' },
];

function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center mb-8">
      {STEPS.map((s, i) => (
        <div key={s.n} className="flex items-center">
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
              current === s.n
                ? 'bg-emerald-600 text-white'
                : current > s.n
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-gray-100 text-gray-400'
            }`}>
              {current > s.n ? <Check className="w-4 h-4" /> : s.n}
            </div>
            <span className={`text-xs mt-1 hidden sm:block font-medium ${
              current === s.n ? 'text-emerald-700' : current > s.n ? 'text-emerald-600' : 'text-gray-400'
            }`}>{s.label}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`h-0.5 w-10 sm:w-16 mx-1 mb-4 sm:mb-5 transition-colors ${
              current > s.n ? 'bg-emerald-300' : 'bg-gray-200'
            }`} />
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── Sayfa ──────────────────────────────────────────────────── */

export default function SellerFormPage() {
  const { currentUser } = useAuth();

  const [form,   setForm]   = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [step,   setStep]   = useState(1);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  const set = <K extends keyof FormState>(key: K, val: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: val }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  /* Firestore'dan kayıtlı kullanıcı bilgilerini ön-doldur */
  useEffect(() => {
    if (!currentUser) return;
    getDoc(doc(db, 'users', currentUser.uid)).then((snap) => {
      if (!snap.exists()) return;
      const d = snap.data();
      setForm((f) => ({
        ...f,
        ...(d.firmaAdi  ? { firmaAdi: d.firmaAdi } : {}),
        ...(d.vergiNo   ? { vergiNo:  d.vergiNo  } : {}),
        ...(d.sehir     ? { sehir:    d.sehir    } : {}),
        ...(d.saticiTipi === 'uretici' ? { firmaType: 'uretici' } :
            d.saticiTipi === 'bayi'    ? { firmaType: 'satici'  } : {}),
        ...(Array.isArray(d.kategoriler) && d.kategoriler.length > 0 ? {
          kategoriler: CATEGORIES
            .filter((c) => d.kategoriler.includes(c.name))
            .map((c) => c.slug),
        } : {}),
      }));
    }).catch(() => {});
  }, [currentUser]);

  /* ── Adım bazlı doğrulama ───────────────────────────────────── */

  function validateStep(n: number): boolean {
    const e: Errors = {};
    if (n === 1) {
      if (!form.firmaType)                            e.firmaType   = 'Firma türü seçiniz.';
      if (!form.firmaAdi.trim())                      e.firmaAdi    = 'Firma adı zorunludur.';
      if (!/^\d{10}$/.test(form.vergiNo))             e.vergiNo     = 'Tam olarak 10 rakam giriniz.';
      if (!form.firmaYapisi)                          e.firmaYapisi = 'Firma yapısı seçiniz.';
      if (!/^[0-9+\s()\-]{10,}$/.test(form.telefon)) e.telefon     = 'Geçerli bir telefon giriniz.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.eposta)) e.eposta = 'Geçerli bir e-posta giriniz.';
      if (!form.sehir)                                e.sehir       = 'Şehir seçimi zorunludur.';
    }
    if (n === 2) {
      if (form.kategoriler.length === 0) e.kategoriler = 'En az bir kategori seçiniz.';
    }
    if (n === 4) {
      if (!form.kvkkOnay)     e.kvkkOnay     = 'KVKK metnini kabul etmelisiniz.';
      if (!form.kullanimOnay) e.kullanimOnay = 'Kullanım koşullarını kabul etmelisiniz.';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleNext() {
    if (!validateStep(step)) return;
    setStep((s) => s + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleBack() {
    setStep((s) => s - 1);
    setErrors({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ── Gönderim ──────────────────────────────────────────────── */

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateStep(4)) return;
    setStatus('loading');
    try {
      await addDoc(collection(db, 'firms'), {
        userId:          currentUser?.uid ?? null,
        firmaType:       form.firmaType,
        name:            sanitizeText(form.firmaAdi, 150),
        vergiNo:         form.vergiNo.trim(),
        firmaYapisi:     form.firmaYapisi,
        phone:           form.telefon.trim(),
        eposta:          form.eposta.trim().toLowerCase(),
        website:         sanitizeUrl(form.website),
        whatsapp:        form.whatsapp.trim(),
        city:            form.sehir,
        category:        form.kategoriler[0] ?? '',
        kategoriler:     form.kategoriler,
        hizmetBolgeleri: form.hizmetBolgeleri,
        tanitimMetni:    sanitizeText(form.tanitimMetni, 2000),
        gorselUrl:       sanitizeUrl(form.gorselUrl),
        status:          'pending',
        verified:        false,
        olusturmaTarihi: serverTimestamp(),
      });
      /* Admin e-posta bildirimi — fire and forget */
      sendFirmaBasvuruEmail({
        firmaAdi:    form.firmaAdi,
        eposta:      form.eposta,
        telefon:     form.telefon,
        sehir:       form.sehir,
        kategoriler: form.kategoriler
          .map((slug) => CATEGORIES.find((c) => c.slug === slug)?.name ?? slug)
          .join(', '),
      }).catch(() => {});
      setStatus('success');
    } catch {
      setErrors({ submit: 'Bir hata oluştu. Lütfen tekrar deneyin.' });
      setStatus('idle');
    }
  }

  /* ── Başarı ────────────────────────────────────────────────── */

  if (status === 'success') {
    return (
      <>
        <Header />
        <main className="min-h-[70vh] flex items-center justify-center px-4 bg-gray-50">
          <div className="text-center max-w-md py-16">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Başvurunuz Alındı!</h2>
            <p className="text-gray-500 mb-2">Firma kaydınız incelemeye alındı.</p>
            <p className="text-gray-500 mb-8">
              <strong className="text-gray-700">24 saat içinde</strong>{' '}
              <span className="font-medium text-gray-700">{form.eposta}</span>{' '}
              adresine dönüş yapılacaktır.
            </p>
            <Link
              to="/"
              className="inline-block bg-emerald-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition"
            >
              Ana Sayfaya Dön
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  /* ── Wizard ────────────────────────────────────────────────── */

  return (
    <>
      <SEOMeta
        title="Satıcı Kaydı — Firmanızı Listeleyin | ModülerPazar"
        description="ModülerPazar'da firmanızı ücretsiz listeleyin. Binlerce alıcıya ulaşın, teklif alın. Prefabrik, çelik yapı, konteyner ve tiny house üreticileri için."
        url="/satici-formu"
      />
      <Header />
      <main className="bg-gray-50 min-h-screen py-10">
        <div className="max-w-2xl mx-auto px-4">

          <div className="text-center mb-6">
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-2">
              Ücretsiz Kayıt Ol
            </h1>
            <p className="text-sm text-gray-500">
              Binlerce alıcıya firmanızı tanıtın, ücretsiz ilan verin.
            </p>
          </div>

          <StepBar current={step} />

          <form onSubmit={handleSubmit} noValidate>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">

              {/* ══ ADIM 1: FİRMA BİLGİLERİ ══════════════════════ */}
              {step === 1 && (
                <div className="space-y-5">
                  <h2 className="text-base font-semibold text-gray-800 mb-1">Firma Bilgileri</h2>

                  {/* Firma Türü */}
                  <Field label="Firma Türü" required error={errors.firmaType}>
                    <div className="grid grid-cols-2 gap-3 mt-1">
                      {([
                        { value: 'uretici', label: 'Üretici',       Icon: Factory, desc: 'Kendi ürünlerini üretiyor' },
                        { value: 'satici',  label: 'Satıcı / Bayi', Icon: Store,   desc: 'Distribütör ya da bayi'   },
                      ] as const).map(({ value, label, Icon, desc }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => set('firmaType', value)}
                          className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-center transition ${
                            form.firmaType === value
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                              : 'border-gray-200 hover:border-gray-300 text-gray-600'
                          }`}
                        >
                          <Icon className="w-7 h-7" />
                          <span className="font-semibold text-sm">{label}</span>
                          <span className="text-xs text-gray-400 leading-tight">{desc}</span>
                        </button>
                      ))}
                    </div>
                  </Field>

                  <Field label="Firma Adı" required error={errors.firmaAdi}>
                    <input
                      type="text"
                      value={form.firmaAdi}
                      onChange={(e) => set('firmaAdi', e.target.value)}
                      placeholder="Örn: ABC Prefabrik Ltd. Şti."
                      className={inp}
                    />
                  </Field>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="Vergi Numarası" required error={errors.vergiNo} hint="10 hane">
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={10}
                        value={form.vergiNo}
                        onChange={(e) => set('vergiNo', e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="1234567890"
                        className={inp}
                      />
                    </Field>
                    <Field label="Firma Yapısı" required error={errors.firmaYapisi}>
                      <select
                        value={form.firmaYapisi}
                        onChange={(e) => set('firmaYapisi', e.target.value)}
                        className={inp + ' bg-white'}
                      >
                        <option value="">Seçiniz…</option>
                        {FIRMA_YAPILARI.map((f) => (
                          <option key={f.value} value={f.value}>{f.label}</option>
                        ))}
                      </select>
                    </Field>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="Telefon" required error={errors.telefon}>
                      <input
                        type="tel"
                        value={form.telefon}
                        onChange={(e) => set('telefon', e.target.value)}
                        placeholder="05XX XXX XX XX"
                        className={inp}
                      />
                    </Field>
                    <Field label="E-posta" required error={errors.eposta}>
                      <input
                        type="email"
                        value={form.eposta}
                        onChange={(e) => set('eposta', e.target.value)}
                        placeholder="firma@email.com"
                        className={inp}
                      />
                    </Field>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="Website" hint="opsiyonel">
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        <input
                          type="url"
                          value={form.website}
                          onChange={(e) => set('website', e.target.value)}
                          placeholder="https://firmaniz.com"
                          className={inp + ' pl-9'}
                        />
                      </div>
                    </Field>
                    <Field label="WhatsApp" hint="opsiyonel">
                      <div className="relative">
                        <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        <input
                          type="tel"
                          value={form.whatsapp}
                          onChange={(e) => set('whatsapp', e.target.value)}
                          placeholder="05XX XXX XX XX"
                          className={inp + ' pl-9'}
                        />
                      </div>
                    </Field>
                  </div>

                  <Field label="Şehir" required error={errors.sehir}>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      <select
                        value={form.sehir}
                        onChange={(e) => set('sehir', e.target.value)}
                        className={inp + ' pl-9 bg-white'}
                      >
                        <option value="">Şehir seçin…</option>
                        {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </Field>
                </div>
              )}

              {/* ══ ADIM 2: KATEGORİ VE HİZMET BÖLGESİ ═══════════ */}
              {step === 2 && (
                <div className="space-y-6">
                  <h2 className="text-base font-semibold text-gray-800 mb-1">Kategori ve Hizmet Bölgesi</h2>

                  <Field label="Ürün Kategorileri" required error={errors.kategoriler}>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {CATEGORIES.map((cat) => {
                        const sel = form.kategoriler.includes(cat.slug);
                        return (
                          <button
                            key={cat.slug}
                            type="button"
                            onClick={() => set('kategoriler', toggle(form.kategoriler, cat.slug))}
                            className={`inline-flex items-center gap-1 px-3 py-2 rounded-full border text-sm font-medium transition min-h-[36px] ${
                              sel
                                ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                : 'border-gray-200 text-gray-600 hover:border-gray-300'
                            }`}
                          >
                            {sel && <Check className="w-3 h-3" />}
                            {cat.name}
                          </button>
                        );
                      })}
                    </div>
                  </Field>

                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      Hizmet Verilen Bölgeler
                      <span className="text-gray-400 font-normal ml-1 text-xs">(birden fazla seçilebilir)</span>
                    </p>
                    <div className="border border-gray-200 rounded-lg p-3 max-h-48 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5">
                      {CITIES.map((city) => {
                        const sel = form.hizmetBolgeleri.includes(city);
                        return (
                          <label key={city} className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={sel}
                              onChange={() => set('hizmetBolgeleri', toggle(form.hizmetBolgeleri, city))}
                              className="w-4 h-4 rounded text-emerald-600 border-gray-300 focus:ring-emerald-500"
                            />
                            <span className="text-sm text-gray-600">{city}</span>
                          </label>
                        );
                      })}
                    </div>
                    {form.hizmetBolgeleri.length > 0 && (
                      <p className="text-xs text-emerald-600 mt-1">{form.hizmetBolgeleri.length} il seçildi</p>
                    )}
                  </div>
                </div>
              )}

              {/* ══ ADIM 3: TANITIM ════════════════════════════════ */}
              {step === 3 && (
                <div className="space-y-5">
                  <h2 className="text-base font-semibold text-gray-800 mb-1">Firma Tanıtımı</h2>

                  <Field label="Tanıtım Metni" hint="opsiyonel">
                    <textarea
                      value={form.tanitimMetni}
                      onChange={(e) => set('tanitimMetni', e.target.value)}
                      rows={5}
                      maxLength={1000}
                      placeholder="Firmanızı ve sunduğunuz hizmetleri kısaca tanıtın…"
                      className={inp + ' resize-none'}
                    />
                    <p className="text-xs text-gray-400 mt-1 text-right">{form.tanitimMetni.length} / 1000</p>
                  </Field>

                  <Field label="Firma Görsel URL" hint="opsiyonel">
                    <input
                      type="url"
                      value={form.gorselUrl}
                      onChange={(e) => set('gorselUrl', e.target.value)}
                      placeholder="https://example.com/gorsel.jpg"
                      className={inp}
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Firmanızı temsil eden bir görsel URL'si ekleyebilirsiniz.
                    </p>
                  </Field>

                  {form.gorselUrl && (
                    <div className="rounded-xl overflow-hidden border border-gray-200">
                      <img
                        src={form.gorselUrl}
                        alt="Firma görseli önizleme"
                        loading="lazy"
                        className="w-full h-48 object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* ══ ADIM 4: ONAYLAR ════════════════════════════════ */}
              {step === 4 && (
                <div className="space-y-5">
                  <h2 className="text-base font-semibold text-gray-800 mb-1">Onay ve Gönder</h2>

                  {/* Özet */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="font-semibold text-gray-700 mb-3 text-sm">Başvuru Özeti</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-gray-600">
                      <span className="text-gray-400">Firma Adı</span>
                      <span className="font-medium text-gray-800">{form.firmaAdi}</span>
                      <span className="text-gray-400">E-posta</span>
                      <span className="font-medium text-gray-800">{form.eposta}</span>
                      <span className="text-gray-400">Telefon</span>
                      <span className="font-medium text-gray-800">{form.telefon}</span>
                      <span className="text-gray-400">Şehir</span>
                      <span className="font-medium text-gray-800">{form.sehir}</span>
                      <span className="text-gray-400">Kategoriler</span>
                      <span className="font-medium text-gray-800">
                        {form.kategoriler
                          .map((slug) => CATEGORIES.find((c) => c.slug === slug)?.name ?? slug)
                          .join(', ')}
                      </span>
                    </div>
                  </div>

                  {/* KVKK */}
                  <div>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.kvkkOnay}
                        onChange={(e) => set('kvkkOnay', e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded text-emerald-600 border-gray-300 focus:ring-emerald-500"
                      />
                      <span className="text-sm text-gray-600 leading-relaxed">
                        <Link to="/kvkk" target="_blank" className="text-emerald-600 hover:underline font-medium">
                          KVKK Aydınlatma Metni
                        </Link>
                        'ni okudum, kişisel verilerimin işlenmesine onay veriyorum.
                        <span className="text-red-500 ml-0.5">*</span>
                      </span>
                    </label>
                    {errors.kvkkOnay && (
                      <p className="mt-1 ml-7 text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />{errors.kvkkOnay}
                      </p>
                    )}
                  </div>

                  {/* Kullanım Koşulları */}
                  <div>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.kullanimOnay}
                        onChange={(e) => set('kullanimOnay', e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded text-emerald-600 border-gray-300 focus:ring-emerald-500"
                      />
                      <span className="text-sm text-gray-600 leading-relaxed">
                        <Link to="/kullanim-kosullari" target="_blank" className="text-emerald-600 hover:underline font-medium">
                          Kullanım Koşulları
                        </Link>
                        'nı okudum ve kabul ediyorum.
                        <span className="text-red-500 ml-0.5">*</span>
                      </span>
                    </label>
                    {errors.kullanimOnay && (
                      <p className="mt-1 ml-7 text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />{errors.kullanimOnay}
                      </p>
                    )}
                  </div>

                  {errors.submit && (
                    <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-4 py-3 rounded-lg">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />{errors.submit}
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* ── Navigasyon butonları ─────────────────────────── */}
            <div className="flex gap-3 mt-5">
              {step > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex items-center gap-2 border border-gray-300 text-gray-700 px-5 py-3 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
                >
                  <ChevronLeft className="w-4 h-4" />Geri
                </button>
              )}

              {step < 4 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-emerald-700 transition"
                >
                  İleri <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-emerald-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {status === 'loading' ? (
                    <><Loader2 className="w-4 h-4 animate-spin" />Gönderiliyor…</>
                  ) : (
                    <><CheckCircle className="w-4 h-4" />Başvuruyu Gönder</>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </>
  );
}
