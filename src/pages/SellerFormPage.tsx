import { useState, useRef, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { CATEGORIES } from '../data/categories';
import Header from '../components/Header';
import Footer from '../components/Footer';
import {
  Factory, Store, Check, CheckCircle, AlertCircle, Loader2,
} from 'lucide-react';

/* ─── Leaflet icon fix (Vite) ────────────────────────────────── */
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

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

/* Yaklaşık şehir merkezi koordinatları */
const CITY_COORDS: Record<string, [number, number]> = {
  'Adana':[37.00,35.32],'Adıyaman':[37.76,38.27],'Afyonkarahisar':[38.76,30.54],
  'Ağrı':[39.72,43.05],'Amasya':[40.65,35.83],'Ankara':[39.93,32.85],
  'Antalya':[36.90,30.70],'Artvin':[41.18,41.82],'Aydın':[37.84,27.84],
  'Balıkesir':[39.65,27.88],'Bilecik':[40.15,29.98],'Bingöl':[38.88,40.50],
  'Bitlis':[38.40,42.11],'Bolu':[40.74,31.61],'Burdur':[37.72,30.29],
  'Bursa':[40.18,29.06],'Çanakkale':[40.15,26.41],'Çankırı':[40.60,33.61],
  'Çorum':[40.55,34.96],'Denizli':[37.77,29.09],'Diyarbakır':[37.91,40.22],
  'Edirne':[41.68,26.56],'Elazığ':[38.68,39.22],'Erzincan':[39.75,39.50],
  'Erzurum':[39.90,41.27],'Eskişehir':[39.78,30.52],'Gaziantep':[37.06,37.38],
  'Giresun':[40.91,38.39],'Gümüşhane':[40.46,39.48],'Hakkari':[37.57,43.74],
  'Hatay':[36.40,36.35],'Isparta':[37.76,30.55],'Mersin':[36.80,34.64],
  'İstanbul':[41.01,28.96],'İzmir':[38.42,27.14],'Kars':[40.61,43.10],
  'Kastamonu':[41.38,33.78],'Kayseri':[38.73,35.49],'Kırklareli':[41.73,27.22],
  'Kırşehir':[39.15,34.17],'Kocaeli':[40.85,29.88],'Konya':[37.87,32.48],
  'Kütahya':[39.42,29.98],'Malatya':[38.35,38.31],'Manisa':[38.61,27.43],
  'Kahramanmaraş':[37.57,36.94],'Mardin':[37.31,40.73],'Muğla':[37.22,28.36],
  'Muş':[38.73,41.49],'Nevşehir':[38.62,34.72],'Niğde':[37.97,34.68],
  'Ordu':[40.98,37.88],'Rize':[41.02,40.52],'Sakarya':[40.77,30.40],
  'Samsun':[41.29,36.33],'Siirt':[37.94,41.95],'Sinop':[42.02,35.15],
  'Sivas':[39.75,37.02],'Tekirdağ':[40.98,27.51],'Tokat':[40.31,36.56],
  'Trabzon':[41.00,39.72],'Tunceli':[39.10,39.55],'Şanlıurfa':[37.16,38.79],
  'Uşak':[38.68,29.41],'Van':[38.49,43.38],'Yozgat':[39.82,34.80],
  'Zonguldak':[41.45,31.79],'Aksaray':[38.37,34.04],'Bayburt':[40.25,40.22],
  'Karaman':[37.18,33.22],'Kırıkkale':[39.85,33.51],'Batman':[37.88,41.13],
  'Şırnak':[37.52,42.46],'Bartın':[41.64,32.34],'Ardahan':[41.11,42.70],
  'Iğdır':[39.92,44.04],'Yalova':[40.65,29.27],'Karabük':[41.20,32.62],
  'Kilis':[36.72,37.12],'Osmaniye':[37.07,36.25],'Düzce':[40.84,31.16],
};

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
  sehir:           string;
  ilce:            string;
  adres:           string;
  kategoriler:     string[];
  hizmetBolgeleri: string[];
  tanitimMetni:    string;
  kvkkOnay:        boolean;
  kullanimOnay:    boolean;
}

type Errors = Partial<Record<keyof FormState | 'submit', string>>;

const EMPTY: FormState = {
  firmaType: '', firmaAdi: '', vergiNo: '', firmaYapisi: '',
  telefon: '', eposta: '', sehir: '', ilce: '', adres: '',
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

/* ─── Harita: şehre uç ───────────────────────────────────────── */

function FlyToCity({ city }: { city: string }) {
  const map = useMap();
  useEffect(() => {
    const pos = CITY_COORDS[city];
    if (pos) map.flyTo(pos, 12, { duration: 1 });
  }, [city, map]);
  return null;
}

/* ─── Sayfa ──────────────────────────────────────────────────── */

export default function SellerFormPage() {
  const [form,    setForm]    = useState<FormState>(EMPTY);
  const [coords,  setCoords]  = useState({ lat: 39.0, lng: 35.0 });
  const [errors,  setErrors]  = useState<Errors>({});
  const [status,  setStatus]  = useState<'idle' | 'loading' | 'success'>('idle');

  const markerRef = useRef<L.Marker>(null);

  const set = <K extends keyof FormState>(key: K, val: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: val }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  /* Şehir seçilince koordinatı da güncelle */
  const handleSehir = (city: string) => {
    set('sehir', city);
    const pos = CITY_COORDS[city];
    if (pos) setCoords({ lat: pos[0], lng: pos[1] });
  };

  /* Sürüklenebilir pin */
  const onDragEnd = useCallback(() => {
    const m = markerRef.current;
    if (m) {
      const { lat, lng } = m.getLatLng();
      setCoords({ lat, lng });
    }
  }, []);

  /* ── Doğrulama ─────────────────────────────────────────────── */

  function validate(): boolean {
    const e: Errors = {};
    if (!form.firmaType)                           e.firmaType   = 'Firma türü seçiniz.';
    if (!form.firmaAdi.trim())                     e.firmaAdi    = 'Firma adı zorunludur.';
    if (!/^\d{10}$/.test(form.vergiNo))            e.vergiNo     = 'Tam olarak 10 rakam giriniz.';
    if (!form.firmaYapisi)                         e.firmaYapisi = 'Firma yapısı seçiniz.';
    if (!/^[0-9+\s()\-]{10,}$/.test(form.telefon)) e.telefon     = 'Geçerli bir telefon giriniz.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.eposta)) e.eposta = 'Geçerli bir e-posta giriniz.';
    if (!form.sehir)                               e.sehir       = 'Şehir seçimi zorunludur.';
    if (form.kategoriler.length === 0)             e.kategoriler = 'En az bir kategori seçiniz.';
    if (!form.kvkkOnay)                            e.kvkkOnay    = 'KVKK metnini kabul etmelisiniz.';
    if (!form.kullanimOnay)                        e.kullanimOnay = 'Kullanım koşullarını kabul etmelisiniz.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  /* ── Gönderim ──────────────────────────────────────────────── */

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) {
      // İlk hatalı alana scroll
      setTimeout(() => {
        document.querySelector('[data-error]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
      return;
    }
    setStatus('loading');
    try {
      await addDoc(collection(db, 'firms'), {
        firmaType:       form.firmaType,
        name:            form.firmaAdi.trim(),
        vergiNo:         form.vergiNo,
        firmaYapisi:     form.firmaYapisi,
        phone:           form.telefon.trim(),
        eposta:          form.eposta.trim(),
        city:            form.sehir,
        ilce:            form.ilce.trim(),
        address:         form.adres.trim(),
        lat:             coords.lat,
        lng:             coords.lng,
        category:        form.kategoriler[0] ?? '',
        kategoriler:     form.kategoriler,
        hizmetBolgeleri: form.hizmetBolgeleri,
        tanitimMetni:    form.tanitimMetni.trim(),
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

          {/* Sayfa başlığı */}
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

              {/* ══ 1. FİRMA TÜRÜ ══════════════════════════════════ */}
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

              {/* ══ 2. FİRMA BİLGİLERİ ═════════════════════════════ */}
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
                </div>
              </section>

              <Divider />

              {/* ══ 3. KONUM ════════════════════════════════════════ */}
              <section>
                <SectionHead n={3} title="Konum" />
                <div className="mt-4 space-y-4">

                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="Şehir" required error={errors.sehir}>
                      <select
                        value={form.sehir}
                        onChange={(e) => handleSehir(e.target.value)}
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

                  <Field label="Açık Adres">
                    <textarea
                      value={form.adres}
                      onChange={(e) => set('adres', e.target.value)}
                      rows={2}
                      placeholder="Mahalle, cadde, sokak, bina no…"
                      className={inp + ' resize-none'}
                    />
                  </Field>

                  {/* Harita */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      Harita Konumu
                      <span className="text-gray-400 font-normal ml-1 text-xs">
                        — pini sürükleyerek hassaslaştırın
                      </span>
                    </p>
                    <div className="rounded-xl overflow-hidden border border-gray-200 h-64">
                      <MapContainer
                        center={[39.0, 35.0]}
                        zoom={6}
                        style={{ height: '100%', width: '100%' }}
                        scrollWheelZoom={false}
                      >
                        <TileLayer
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        />
                        <FlyToCity city={form.sehir} />
                        <Marker
                          position={[coords.lat, coords.lng]}
                          draggable
                          ref={markerRef}
                          eventHandlers={{ dragend: onDragEnd }}
                        />
                      </MapContainer>
                    </div>
                    {/* Koordinat özeti */}
                    <p className="text-xs text-gray-400 mt-1">
                      {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                    </p>
                  </div>
                </div>
              </section>

              <Divider />

              {/* ══ 4. ÜRÜN VE HİZMETLER ═══════════════════════════ */}
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

              {/* ══ 5. ONAYLAR ══════════════════════════════════════ */}
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

                  {/* Firestore hatası */}
                  {errors.submit && (
                    <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-4 py-3 rounded-lg">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />{errors.submit}
                    </div>
                  )}
                </div>
              </section>

            </div>{/* /card */}

            {/* Gönder */}
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
