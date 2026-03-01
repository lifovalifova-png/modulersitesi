import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { collection, addDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { CATEGORIES } from '../data/categories';
import { sanitizeText, sanitizeUrl } from '../utils/sanitize';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import {
  Factory, Store, Check, CheckCircle, AlertCircle, Loader2, Globe, MessageCircle,
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
  ilce:            string;
  mahalle:         string;
  caddeSokak:      string;
  binaNo:          string;
  postaKodu:       string;
  kategoriler:     string[];
  hizmetBolgeleri: string[];
  tanitimMetni:    string;
  kvkkOnay:        boolean;
  kullanimOnay:    boolean;
}

type Errors = Partial<Record<keyof FormState | 'submit', string>>;

const EMPTY: FormState = {
  firmaType: '', firmaAdi: '', vergiNo: '', firmaYapisi: '',
  telefon: '', eposta: '', website: '', whatsapp: '',
  sehir: '', ilce: '', mahalle: '', caddeSokak: '', binaNo: '', postaKodu: '',
  kategoriler: [], hizmetBolgeleri: [],
  tanitimMetni: '', kvkkOnay: false, kullanimOnay: false,
};

/* ─── Helpers ────────────────────────────────────────────────── */

const inp = 'w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent';

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
          <AlertCircle className="w-3 h-3 flex-shrink-0" aria-hidden="true" />{error}
        </p>
      )}
    </div>
  );
}

function Divider() {
  return <div className="border-t border-gray-100 -mx-6 md:-mx-8" />;
}

function SectionHead({ n, title }: { n: number; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-7 h-7 rounded-full bg-emerald-600 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
        {n}
      </span>
      <h2 className="text-base font-semibold text-gray-800">{title}</h2>
    </div>
  );
}

function toggle<T>(arr: T[], val: T): T[] {
  return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
}

/* ─── Sayfa ──────────────────────────────────────────────────── */

export default function SellerFormPage() {
  const { currentUser } = useAuth();

  const [form,   setForm]   = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  /* Debounced map URL */
  const [mapUrl,   setMapUrl]  = useState('');
  const mapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const set = <K extends keyof FormState>(key: K, val: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: val }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  /* ── Firestore'dan kayıt bilgilerini ön-doldur ────────────── */
  useEffect(() => {
    if (!currentUser) return;
    getDoc(doc(db, 'users', currentUser.uid)).then((snap) => {
      if (!snap.exists()) return;
      const d = snap.data();
      setForm((f) => ({
        ...f,
        ...(d.firmaAdi  ? { firmaAdi: d.firmaAdi }  : {}),
        ...(d.vergiNo   ? { vergiNo:  d.vergiNo  }  : {}),
        ...(d.sehir     ? { sehir:    d.sehir    }  : {}),
        ...(d.saticiTipi === 'uretici' ? { firmaType: 'uretici' } :
            d.saticiTipi === 'bayi'    ? { firmaType: 'satici'  } : {}),
        ...(Array.isArray(d.kategoriler) && d.kategoriler.length > 0 ? {
          kategoriler: CATEGORIES
            .filter((c) => d.kategoriler.includes(c.name))
            .map((c) => c.slug),
        } : {}),
      }));
    }).catch(() => {/* sessizce geç */});
  }, [currentUser]);

  /* ── Debounced harita URL'si ───────────────────────────────── */
  useEffect(() => {
    if (!form.sehir) { setMapUrl(''); return; }
    if (mapTimer.current) clearTimeout(mapTimer.current);
    mapTimer.current = setTimeout(() => {
      const parts = [form.mahalle, form.caddeSokak, form.ilce, form.sehir]
        .map((s) => s.trim())
        .filter(Boolean);
      const q = parts.join(', ') + ', Türkiye';
      setMapUrl(`https://maps.google.com/maps?q=${encodeURIComponent(q)}&output=embed`);
    }, 800);
    return () => { if (mapTimer.current) clearTimeout(mapTimer.current); };
  }, [form.sehir, form.ilce, form.mahalle, form.caddeSokak]);

  /* ── Doğrulama ─────────────────────────────────────────────── */

  function validate(): boolean {
    const e: Errors = {};
    if (!form.firmaType)                            e.firmaType    = 'Firma türü seçiniz.';
    if (!form.firmaAdi.trim())                      e.firmaAdi     = 'Firma adı zorunludur.';
    if (!/^\d{10}$/.test(form.vergiNo))             e.vergiNo      = 'Tam olarak 10 rakam giriniz.';
    if (!form.firmaYapisi)                          e.firmaYapisi  = 'Firma yapısı seçiniz.';
    if (!/^[0-9+\s()\-]{10,}$/.test(form.telefon)) e.telefon      = 'Geçerli bir telefon giriniz.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.eposta)) e.eposta = 'Geçerli bir e-posta giriniz.';
    if (!form.sehir)                                e.sehir        = 'Şehir seçimi zorunludur.';
    if (form.kategoriler.length === 0)              e.kategoriler  = 'En az bir kategori seçiniz.';
    if (!form.kvkkOnay)                             e.kvkkOnay     = 'KVKK metnini kabul etmelisiniz.';
    if (!form.kullanimOnay)                         e.kullanimOnay = 'Kullanım koşullarını kabul etmelisiniz.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  /* ── Gönderim ──────────────────────────────────────────────── */

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) {
      setTimeout(() => {
        document.querySelector('[data-error]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
      return;
    }
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
        ilce:            sanitizeText(form.ilce, 100),
        mahalle:         sanitizeText(form.mahalle, 100),
        caddeSokak:      sanitizeText(form.caddeSokak, 150),
        binaNo:          sanitizeText(form.binaNo, 20),
        postaKodu:       form.postaKodu.trim(),
        category:        form.kategoriler[0] ?? '',
        kategoriler:     form.kategoriler,
        hizmetBolgeleri: form.hizmetBolgeleri,
        tanitimMetni:    sanitizeText(form.tanitimMetni, 2000),
        status:          'pending',
        verified:        false,
        olusturmaTarihi: serverTimestamp(),
      });
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
            <h1 className="text-2xl font-bold text-gray-900 mb-3">Başvurunuz Alındı!</h1>
            <p className="text-gray-500 mb-8">
              Firma kaydınız incelemeye alındı. En kısa sürede{' '}
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

  /* ── Form ──────────────────────────────────────────────────── */

  return (
    <>
      <Header />
      <main className="bg-gray-50 min-h-screen py-10">
        <div className="max-w-2xl mx-auto px-4">

          <div className="text-center mb-8">
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-2">
              Ücretsiz Kayıt Ol
            </h1>
            <p className="text-sm text-gray-500">
              Binlerce alıcıya firmanızı tanıtın, ücretsiz ilan verin.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 space-y-7">

              {/* ══ 1. FİRMA TÜRÜ ═════════════════════════════════ */}
              <section data-error={errors.firmaType ? '' : undefined}>
                <SectionHead n={1} title="Firma Türü" />
                <div className="grid grid-cols-2 gap-3 mt-4">
                  {([
                    { value: 'uretici', label: 'Üretici',      Icon: Factory, desc: 'Kendi ürünlerini üretiyor' },
                    { value: 'satici',  label: 'Satıcı / Bayi', Icon: Store,   desc: 'Distribütör ya da bayi'   },
                  ] as const).map(({ value, label, Icon, desc }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => set('firmaType', value)}
                      className={`flex flex-col items-center gap-2 p-5 rounded-xl border-2 text-center transition ${
                        form.firmaType === value
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      <Icon className="w-8 h-8" aria-hidden="true" />
                      <span className="font-semibold text-sm">{label}</span>
                      <span className="text-xs text-gray-400 leading-tight">{desc}</span>
                    </button>
                  ))}
                </div>
                {errors.firmaType && (
                  <p className="mt-2 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />{errors.firmaType}
                  </p>
                )}
              </section>

              <Divider />

              {/* ══ 2. FİRMA BİLGİLERİ ════════════════════════════ */}
              <section>
                <SectionHead n={2} title="Firma Bilgileri" />
                <div className="mt-4 space-y-4">

                  <Field label="Firma Adı" required error={errors.firmaAdi}>
                    <input
                      type="text"
                      value={form.firmaAdi}
                      onChange={(e) => set('firmaAdi', e.target.value)}
                      placeholder="Örn: ABC Prefabrik Ltd. Şti."
                      className={inp}
                      data-error={errors.firmaAdi ? '' : undefined}
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
                        data-error={errors.vergiNo ? '' : undefined}
                      />
                    </Field>

                    <Field label="Firma Yapısı" required error={errors.firmaYapisi}>
                      <select
                        value={form.firmaYapisi}
                        onChange={(e) => set('firmaYapisi', e.target.value)}
                        className={inp + ' bg-white'}
                        data-error={errors.firmaYapisi ? '' : undefined}
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
                        data-error={errors.telefon ? '' : undefined}
                      />
                    </Field>

                    <Field label="E-posta" required error={errors.eposta}>
                      <input
                        type="email"
                        value={form.eposta}
                        onChange={(e) => set('eposta', e.target.value)}
                        placeholder="firma@email.com"
                        className={inp}
                        data-error={errors.eposta ? '' : undefined}
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
                </div>
              </section>

              <Divider />

              {/* ══ 3. KONUM ══════════════════════════════════════ */}
              <section>
                <SectionHead n={3} title="Konum" />
                <div className="mt-4 space-y-4">

                  {/* Şehir + İlçe */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="Şehir" required error={errors.sehir}>
                      <select
                        value={form.sehir}
                        onChange={(e) => set('sehir', e.target.value)}
                        className={inp + ' bg-white'}
                        data-error={errors.sehir ? '' : undefined}
                      >
                        <option value="">Şehir seçin…</option>
                        {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </Field>

                    <Field label="İlçe">
                      <input
                        type="text"
                        value={form.ilce}
                        onChange={(e) => set('ilce', e.target.value)}
                        placeholder="İlçe adı"
                        className={inp}
                      />
                    </Field>
                  </div>

                  {/* Mahalle + Cadde/Sokak */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="Mahalle">
                      <input
                        type="text"
                        value={form.mahalle}
                        onChange={(e) => set('mahalle', e.target.value)}
                        placeholder="Mahalle adı"
                        className={inp}
                      />
                    </Field>

                    <Field label="Cadde / Sokak">
                      <input
                        type="text"
                        value={form.caddeSokak}
                        onChange={(e) => set('caddeSokak', e.target.value)}
                        placeholder="Cadde veya sokak adı"
                        className={inp}
                      />
                    </Field>
                  </div>

                  {/* Bina No/Daire + Posta Kodu */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="Bina No / Daire">
                      <input
                        type="text"
                        value={form.binaNo}
                        onChange={(e) => set('binaNo', e.target.value)}
                        placeholder="No: 12, Daire: 3"
                        className={inp}
                      />
                    </Field>

                    <Field label="Posta Kodu">
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={5}
                        value={form.postaKodu}
                        onChange={(e) => set('postaKodu', e.target.value.replace(/\D/g, '').slice(0, 5))}
                        placeholder="34000"
                        className={inp}
                      />
                    </Field>
                  </div>

                  {/* Google Maps önizleme — debounced */}
                  {mapUrl && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Konum Önizlemesi</p>
                      <div className="rounded-xl overflow-hidden border border-gray-200 h-64">
                        <iframe
                          key={mapUrl}
                          src={mapUrl}
                          width="100%"
                          height="100%"
                          style={{ border: 0 }}
                          allowFullScreen
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                          title="Konum harita önizlemesi"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </section>

              <Divider />

              {/* ══ 4. ÜRÜN VE HİZMETLER ══════════════════════════ */}
              <section>
                <SectionHead n={4} title="Ürün ve Hizmetler" />
                <div className="mt-4 space-y-5">

                  {/* Kategoriler */}
                  <Field label="Ürün Kategorileri" required error={errors.kategoriler}>
                    <div className="flex flex-wrap gap-2 mt-1" data-error={errors.kategoriler ? '' : undefined}>
                      {CATEGORIES.map((cat) => {
                        const sel = form.kategoriler.includes(cat.slug);
                        return (
                          <button
                            key={cat.slug}
                            type="button"
                            onClick={() => set('kategoriler', toggle(form.kategoriler, cat.slug))}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full border text-sm font-medium transition ${
                              sel
                                ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                : 'border-gray-200 text-gray-600 hover:border-gray-300'
                            }`}
                          >
                            {sel && <Check className="w-3 h-3" aria-hidden="true" />}
                            {cat.name}
                          </button>
                        );
                      })}
                    </div>
                  </Field>

                  {/* Hizmet bölgeleri */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      Hizmet Verilen Bölgeler
                      <span className="text-gray-400 font-normal ml-1 text-xs">(birden fazla seçilebilir)</span>
                    </p>
                    <div className="border border-gray-200 rounded-lg p-3 max-h-44 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5">
                      {CITIES.map((city) => {
                        const sel = form.hizmetBolgeleri.includes(city);
                        return (
                          <label key={city} className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={sel}
                              onChange={() => set('hizmetBolgeleri', toggle(form.hizmetBolgeleri, city))}
                              className="w-3.5 h-3.5 rounded text-emerald-600 border-gray-300 focus:ring-emerald-500"
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

                  {/* Tanıtım */}
                  <Field label="Firma Tanıtım Metni">
                    <textarea
                      value={form.tanitimMetni}
                      onChange={(e) => set('tanitimMetni', e.target.value)}
                      rows={4}
                      maxLength={1000}
                      placeholder="Firmanızı ve sunduğunuz hizmetleri kısaca tanıtın…"
                      className={inp + ' resize-none'}
                    />
                    <p className="text-xs text-gray-400 mt-1 text-right">{form.tanitimMetni.length} / 1000</p>
                  </Field>
                </div>
              </section>

              <Divider />

              {/* ══ 5. ONAYLAR ════════════════════════════════════ */}
              <section>
                <SectionHead n={5} title="Onaylar" />
                <div className="mt-4 space-y-3">

                  <div data-error={errors.kvkkOnay ? '' : undefined}>
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

                  <div data-error={errors.kullanimOnay ? '' : undefined}>
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
              </section>

            </div>{/* /card */}

            <button
              type="submit"
              disabled={status === 'loading'}
              className="mt-5 w-full flex items-center justify-center gap-2 bg-emerald-600 text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-emerald-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {status === 'loading' ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Gönderiliyor…</>
              ) : (
                <><CheckCircle className="w-4 h-4" />Başvuruyu Gönder</>
              )}
            </button>

          </form>
        </div>
      </main>
      <Footer />
    </>
  );
}
