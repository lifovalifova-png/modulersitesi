import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle, AlertCircle, Loader2, ChevronRight, ChevronLeft,
  Factory, Store, Check,
} from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { CATEGORIES } from '../data/categories';
import Header from '../components/Header';
import Footer from '../components/Footer';

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

const STEPS = ['Firma Bilgileri', 'İletişim ve Konum', 'Ürün ve Hizmetler'];

/* ─── Form state tipi ────────────────────────────────────────── */

interface FormState {
  firmaType:       'uretici' | 'satici' | '';
  firmaAdi:        string;
  vergiNo:         string;
  firmaYapisi:     string;
  yetkiliAdi:      string;
  telefon:         string;
  eposta:          string;
  sehir:           string;
  ilce:            string;
  adres:           string;
  kategoriler:     string[];
  hizmetBolgeleri: string[];
  tanitimMetni:    string;
  kvkkOnay:        boolean;
  kullanimOnay:    boolean;
}

const EMPTY: FormState = {
  firmaType: '', firmaAdi: '', vergiNo: '', firmaYapisi: '',
  yetkiliAdi: '', telefon: '', eposta: '', sehir: '', ilce: '', adres: '',
  kategoriler: [], hizmetBolgeleri: [],
  tanitimMetni: '', kvkkOnay: false, kullanimOnay: false,
};

/* ─── Helpers ────────────────────────────────────────────────── */

const cls = 'w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent';

function Field({ label, required, error, children }: {
  label: string; required?: boolean; error?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && (
        <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />{error}
        </p>
      )}
    </div>
  );
}

function toggle<T>(arr: T[], val: T): T[] {
  return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
}

/* ─── Sayfa ──────────────────────────────────────────────────── */

export default function SellerFormPage() {
  const [step,    setStep]    = useState(0);
  const [form,    setForm]    = useState<FormState>(EMPTY);
  const [errors,  setErrors]  = useState<Partial<Record<keyof FormState, string>>>({});
  const [status,  setStatus]  = useState<'idle' | 'loading' | 'success'>('idle');

  const set = <K extends keyof FormState>(key: K, val: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  /* ── Doğrulama ─────────────────────────────────────────────── */

  function validateStep(s: number): boolean {
    const e: typeof errors = {};

    if (s === 0) {
      if (!form.firmaType)  e.firmaType  = 'Lütfen firma türü seçin.';
      if (!form.firmaAdi.trim())  e.firmaAdi  = 'Firma adı zorunludur.';
      if (!/^\d{10}$/.test(form.vergiNo)) e.vergiNo = 'Vergi numarası tam olarak 10 rakam olmalıdır.';
      if (!form.firmaYapisi) e.firmaYapisi = 'Firma yapısı seçiniz.';
    }

    if (s === 1) {
      if (!form.yetkiliAdi.trim()) e.yetkiliAdi = 'Yetkili adı soyadı zorunludur.';
      if (!/^[0-9+\s()-]{10,}$/.test(form.telefon)) e.telefon = 'Geçerli bir telefon numarası girin.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.eposta)) e.eposta = 'Geçerli bir e-posta adresi girin.';
      if (!form.sehir) e.sehir = 'Şehir seçimi zorunludur.';
    }

    if (s === 2) {
      if (form.kategoriler.length === 0) e.kategoriler = 'En az bir kategori seçiniz.';
      if (!form.kvkkOnay)     e.kvkkOnay     = 'KVKK metnini kabul etmelisiniz.';
      if (!form.kullanimOnay) e.kullanimOnay = 'Kullanım koşullarını kabul etmelisiniz.';
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function next() {
    if (validateStep(step)) setStep((s) => s + 1);
  }

  function back() {
    setErrors({});
    setStep((s) => s - 1);
  }

  /* ── Gönderim ──────────────────────────────────────────────── */

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateStep(2)) return;
    setStatus('loading');
    try {
      await addDoc(collection(db, 'firmBasvurulari'), {
        firmaType:       form.firmaType,
        firmaAdi:        form.firmaAdi.trim(),
        vergiNo:         form.vergiNo,
        firmaYapisi:     form.firmaYapisi,
        yetkiliAdi:      form.yetkiliAdi.trim(),
        telefon:         form.telefon.trim(),
        eposta:          form.eposta.trim(),
        sehir:           form.sehir,
        ilce:            form.ilce.trim(),
        adres:           form.adres.trim(),
        kategoriler:     form.kategoriler,
        hizmetBolgeleri: form.hizmetBolgeleri,
        tanitimMetni:    form.tanitimMetni.trim(),
        durum:           'beklemede',
        olusturmaTarihi: serverTimestamp(),
      });
      setStatus('success');
    } catch {
      setErrors({ firmaAdi: 'Bir hata oluştu. Lütfen tekrar deneyin.' });
      setStatus('idle');
    }
  }

  /* ── Başarı ekranı ─────────────────────────────────────────── */

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
              <span className="font-medium text-gray-700">{form.eposta}</span> adresine
              dönüş yapılacaktır.
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
      <main className="bg-gray-50 py-10 min-h-screen">
        <div className="max-w-2xl mx-auto px-4">

          {/* Başlık */}
          <div className="text-center mb-8">
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-2">
              Ücretsiz Kayıt Ol
            </h1>
            <p className="text-gray-500 text-sm">Binlerce alıcıya firmanızı tanıtın.</p>
          </div>

          {/* Adım göstergesi */}
          <div className="flex items-center mb-8">
            {STEPS.map((label, i) => (
              <div key={i} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                    i < step  ? 'bg-emerald-500 text-white'
                    : i === step ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                    : 'bg-gray-200 text-gray-500'
                  }`}>
                    {i < step ? <Check className="w-4 h-4" /> : i + 1}
                  </div>
                  <span className={`mt-1 text-xs font-medium hidden sm:block ${i === step ? 'text-emerald-700' : 'text-gray-400'}`}>
                    {label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 rounded transition-colors ${i < step ? 'bg-emerald-400' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>

          {/* Kart */}
          <form onSubmit={handleSubmit} noValidate>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 space-y-5">

              <h2 className="text-lg font-bold text-gray-900 pb-3 border-b border-gray-100">
                {step + 1}. {STEPS[step]}
              </h2>

              {/* ══ ADIM 1 ══════════════════════════════════════════ */}
              {step === 0 && (
                <>
                  {/* Firma türü */}
                  <Field label="Firma Türü" required error={errors.firmaType}>
                    <div className="grid grid-cols-2 gap-3 mt-1">
                      {([
                        { value: 'uretici', label: 'Üretici',     Icon: Factory, desc: 'Kendi ürünlerini üretiyor' },
                        { value: 'satici',  label: 'Satıcı / Bayi', Icon: Store,   desc: 'Distribütör ya da bayi'  },
                      ] as const).map(({ value, label, Icon, desc }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => { set('firmaType', value); setErrors((e) => ({ ...e, firmaType: undefined })); }}
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

                  {/* Firma adı */}
                  <Field label="Firma Adı" required error={errors.firmaAdi}>
                    <input
                      type="text"
                      value={form.firmaAdi}
                      onChange={(e) => set('firmaAdi', e.target.value)}
                      placeholder="Örn: ABC Prefabrik Ltd. Şti."
                      className={cls}
                    />
                  </Field>

                  {/* Vergi no */}
                  <Field label="Vergi Numarası" required error={errors.vergiNo}>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={10}
                      value={form.vergiNo}
                      onChange={(e) => set('vergiNo', e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="10 haneli vergi numarası"
                      className={cls}
                    />
                  </Field>

                  {/* Firma yapısı */}
                  <Field label="Firma Yapısı" required error={errors.firmaYapisi}>
                    <select
                      value={form.firmaYapisi}
                      onChange={(e) => set('firmaYapisi', e.target.value)}
                      className={cls + ' bg-white'}
                    >
                      <option value="">Seçiniz…</option>
                      {FIRMA_YAPILARI.map((f) => (
                        <option key={f.value} value={f.value}>{f.label}</option>
                      ))}
                    </select>
                  </Field>
                </>
              )}

              {/* ══ ADIM 2 ══════════════════════════════════════════ */}
              {step === 1 && (
                <>
                  <Field label="Yetkili Adı Soyadı" required error={errors.yetkiliAdi}>
                    <input
                      type="text"
                      value={form.yetkiliAdi}
                      onChange={(e) => set('yetkiliAdi', e.target.value)}
                      placeholder="Ad Soyad"
                      className={cls}
                    />
                  </Field>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="Telefon" required error={errors.telefon}>
                      <input
                        type="tel"
                        value={form.telefon}
                        onChange={(e) => set('telefon', e.target.value)}
                        placeholder="05XX XXX XX XX"
                        className={cls}
                      />
                    </Field>
                    <Field label="E-posta" required error={errors.eposta}>
                      <input
                        type="email"
                        value={form.eposta}
                        onChange={(e) => set('eposta', e.target.value)}
                        placeholder="firma@email.com"
                        className={cls}
                      />
                    </Field>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="Şehir" required error={errors.sehir}>
                      <select
                        value={form.sehir}
                        onChange={(e) => set('sehir', e.target.value)}
                        className={cls + ' bg-white'}
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
                        className={cls}
                      />
                    </Field>
                  </div>

                  <Field label="Adres">
                    <textarea
                      value={form.adres}
                      onChange={(e) => set('adres', e.target.value)}
                      rows={3}
                      placeholder="Açık adres"
                      className={cls + ' resize-none'}
                    />
                  </Field>
                </>
              )}

              {/* ══ ADIM 3 ══════════════════════════════════════════ */}
              {step === 2 && (
                <>
                  {/* Kategoriler — çoklu seçim chip */}
                  <Field label="Ürün Kategorileri" required error={errors.kategoriler}>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {CATEGORIES.map((cat) => {
                        const sel = form.kategoriler.includes(cat.slug);
                        return (
                          <button
                            key={cat.slug}
                            type="button"
                            onClick={() => set('kategoriler', toggle(form.kategoriler, cat.slug))}
                            className={`px-3 py-1.5 rounded-full border text-sm font-medium transition ${
                              sel
                                ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                : 'border-gray-200 text-gray-600 hover:border-gray-300'
                            }`}
                          >
                            {sel && <Check className="inline w-3 h-3 mr-1" />}
                            {cat.name}
                          </button>
                        );
                      })}
                    </div>
                  </Field>

                  {/* Hizmet bölgeleri */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hizmet Verilen Bölgeler
                      <span className="ml-1 text-xs text-gray-400 font-normal">(birden fazla seçilebilir)</span>
                    </label>
                    <div className="border border-gray-200 rounded-lg p-3 max-h-44 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5">
                      {CITIES.map((city) => {
                        const sel = form.hizmetBolgeleri.includes(city);
                        return (
                          <label key={city} className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={sel}
                              onChange={() => set('hizmetBolgeleri', toggle(form.hizmetBolgeleri, city))}
                              className="w-3.5 h-3.5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                            />
                            <span className="text-sm text-gray-600">{city}</span>
                          </label>
                        );
                      })}
                    </div>
                    {form.hizmetBolgeleri.length > 0 && (
                      <p className="text-xs text-emerald-600 mt-1">
                        {form.hizmetBolgeleri.length} il seçildi
                      </p>
                    )}
                  </div>

                  {/* Tanıtım metni */}
                  <Field label="Firma Tanıtım Metni">
                    <textarea
                      value={form.tanitimMetni}
                      onChange={(e) => set('tanitimMetni', e.target.value)}
                      rows={4}
                      maxLength={1000}
                      placeholder="Firmanızı ve sunduğunuz hizmetleri kısaca tanıtın…"
                      className={cls + ' resize-none'}
                    />
                    <p className="text-xs text-gray-400 mt-1 text-right">
                      {form.tanitimMetni.length} / 1000
                    </p>
                  </Field>

                  {/* Onaylar */}
                  <div className="space-y-3 pt-2 border-t border-gray-100">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.kvkkOnay}
                        onChange={(e) => set('kvkkOnay', e.target.checked)}
                        className="mt-0.5 w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                      />
                      <span className="text-sm text-gray-600">
                        <Link to="/kvkk" target="_blank" className="text-emerald-600 hover:underline">
                          KVKK Aydınlatma Metni
                        </Link>
                        'ni okudum ve kişisel verilerimin işlenmesine onay veriyorum.
                        <span className="text-red-500 ml-0.5">*</span>
                      </span>
                    </label>
                    {errors.kvkkOnay && (
                      <p className="text-xs text-red-600 flex items-center gap-1 pl-7">
                        <AlertCircle className="w-3 h-3" />{errors.kvkkOnay}
                      </p>
                    )}

                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.kullanimOnay}
                        onChange={(e) => set('kullanimOnay', e.target.checked)}
                        className="mt-0.5 w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                      />
                      <span className="text-sm text-gray-600">
                        <Link to="/kullanim-kosullari" target="_blank" className="text-emerald-600 hover:underline">
                          Kullanım Koşulları
                        </Link>
                        'nı okudum ve kabul ediyorum.
                        <span className="text-red-500 ml-0.5">*</span>
                      </span>
                    </label>
                    {errors.kullanimOnay && (
                      <p className="text-xs text-red-600 flex items-center gap-1 pl-7">
                        <AlertCircle className="w-3 h-3" />{errors.kullanimOnay}
                      </p>
                    )}
                  </div>

                  {/* Genel hata (Firestore) */}
                  {errors.firmaAdi && status === 'idle' && (
                    <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-4 py-3 rounded-lg">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />{errors.firmaAdi}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Navigasyon butonları */}
            <div className="flex justify-between mt-5">
              {step > 0 ? (
                <button
                  type="button"
                  onClick={back}
                  className="flex items-center gap-1.5 px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Geri
                </button>
              ) : <div />}

              {step < STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={next}
                  className="flex items-center gap-1.5 px-6 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition"
                >
                  İleri
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="flex items-center gap-2 px-8 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
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
