import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { addDoc, collection, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { toast } from 'sonner';
import { CheckCircle, Lock, ImageIcon, CalendarDays, MapPin, Upload, X, AlertCircle, Loader2, LogIn } from 'lucide-react';
import { CATEGORIES } from '../data/categories';
import { db, storage } from '../lib/firebase';
import { sendTalepEmail } from '../lib/emailjs';
import { sanitizeText } from '../utils/sanitize';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEOMeta from '../components/SEOMeta';
import Disclaimer from '../components/Disclaimer';
import { trackEvent } from '../lib/analytics';
import { useFeatureFlags } from '../hooks/useFeatureFlags';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

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

/* Görsel yükleme — IlanOlusturPage ile aynı sınırlar */
const MAX_IMAGES   = 3;
const MAX_SIZE     = 5 * 1024 * 1024; // 5 MB
const ACCEPT_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ACCEPT_ATTR  = ACCEPT_TYPES.join(',');

/* ─── Tipler ──────────────────────────────────────────────── */
interface UploadItem {
  id:          string;
  file:        File;
  previewUrl:  string;
  storageUrl:  string;
  storagePath: string;
  progress:    number;
  status:      'uploading' | 'done' | 'error';
}

interface FormState {
  kategori: string;
  sehir: string;
  ilce: string;
  butce: string;
  metrekare: string;
  aciklama: string;
  teslimTarihi: string;
  ad: string;
  telefon: string;
  email: string;
  kvkk: boolean;
  kosullar: boolean;
}

type Errors = Partial<Record<keyof FormState, string>>;

const EMPTY: FormState = {
  kategori: '', sehir: '', ilce: '', butce: '', metrekare: '',
  aciklama: '', teslimTarihi: '',
  ad: '', telefon: '', email: '', kvkk: false, kosullar: false,
};

/* ─── Sayfa ───────────────────────────────────────────────── */
const TODAY = new Date().toISOString().slice(0, 10);
const LS_KEY = `talepLimit_${TODAY}`;

export default function TalepOlusturPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { currentUser, loading: authLoading } = useAuth();
  const { flags, loading: flagsLoading } = useFeatureFlags();
  const [form,             setForm]             = useState<FormState>(EMPTY);
  const [done,             setDone]             = useState(false);
  const [submitting,       setSubmitting]       = useState(false);
  const [errors,           setErrors]           = useState<Errors>({});
  /* Görseller */
  const [images,   setImages]   = useState<UploadItem[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef  = useRef<HTMLInputElement>(null);
  const objectUrlsRef = useRef<string[]>([]);   // unmount'ta revoke
  const [gunlukLimit,      setGunlukLimit]      = useState(1);
  // Senkron başlangıç: localStorage sayacı >= 1 ise hemen kilitli göster, flicker olmaz
  const [limitAsimi,       setLimitAsimi]       = useState(
    () => Number(localStorage.getItem(LS_KEY) ?? 0) >= 1,
  );

  useEffect(() => {
    // sinirsizTalep flag'i açıksa limiti devre dışı bırak
    if (flags.sinirsizTalep) {
      setLimitAsimi(false);
      return;
    }
    const count = Number(localStorage.getItem(LS_KEY) ?? 0);
    // Günlük limit'i Firestore'dan oku, ardından karşılaştır
    getDoc(doc(db, 'settings', 'limits')).then((snap) => {
      const limit = snap.exists()
        ? (snap.data() as { gunlukTeklifLimit?: number }).gunlukTeklifLimit ?? 1
        : 1;
      setGunlukLimit(limit);
      setLimitAsimi(count >= limit);
    }).catch(() => {
      setLimitAsimi(count >= 1);
    });
  }, [flags.sinirsizTalep]);

  const set = (field: keyof FormState, val: string | boolean) =>
    setForm((p) => ({ ...p, [field]: val }));

  /* ── ObjectURL temizle (memory leak önleme) ────────────── */
  useEffect(() => {
    return () => objectUrlsRef.current.forEach(URL.revokeObjectURL);
  }, []);

  /* ── Tek dosya yükleme (drop/seçim anında, submit'ten önce) ── */
  const uploadFile = useCallback((file: File) => {
    if (!currentUser) return;

    if (!ACCEPT_TYPES.includes(file.type)) {
      toast.error(`${file.name}: JPG, PNG veya WebP kullanın.`);
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error(`${file.name}: Maksimum 5 MB.`);
      return;
    }

    const id          = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const previewUrl  = URL.createObjectURL(file);
    const storagePath = `ilanlar/${currentUser.uid}/talep_${id}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

    objectUrlsRef.current.push(previewUrl);
    setImages((prev) => [...prev, {
      id, file, previewUrl, storagePath,
      storageUrl: '', progress: 0, status: 'uploading',
    }]);

    const task = uploadBytesResumable(ref(storage, storagePath), file, { contentType: file.type });

    task.on(
      'state_changed',
      (snap) => {
        const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
        setImages((prev) => prev.map((img) => img.id === id ? { ...img, progress: pct } : img));
      },
      (storageError) => {
        setImages((prev) => prev.map((img) => img.id === id ? { ...img, status: 'error' } : img));
        toast.error(`${file.name} yüklenemedi. (${storageError.code})`);
      },
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        setImages((prev) => prev.map((img) =>
          img.id === id ? { ...img, storageUrl: url, status: 'done', progress: 100 } : img,
        ));
      },
    );
  }, [currentUser]);

  /* ── Çoklu dosya işle ─────────────────────────────────── */
  function handleFiles(files: FileList | File[]) {
    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) {
      toast.error(`En fazla ${MAX_IMAGES} görsel ekleyebilirsiniz.`);
      return;
    }
    Array.from(files).slice(0, remaining).forEach(uploadFile);
  }

  /* ── Drag & Drop ──────────────────────────────────────── */
  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }

  /* ── Görsel sil ───────────────────────────────────────── */
  function removeImage(img: UploadItem) {
    URL.revokeObjectURL(img.previewUrl);
    objectUrlsRef.current = objectUrlsRef.current.filter((u) => u !== img.previewUrl);
    setImages((prev) => prev.filter((i) => i.id !== img.id));
    if (img.storageUrl) {
      deleteObject(ref(storage, img.storagePath)).catch(() => {});
    }
  }

  const uploading = images.some((i) => i.status === 'uploading');

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
    if (limitAsimi) {
      toast.error('Günlük teklif talebi limitinizi kullandınız. Yarın tekrar deneyin.');
      return;
    }
    if (uploading) {
      toast.error('Görseller yükleniyor, lütfen bekleyin.');
      return;
    }
    if (!validate()) {
      toast.error('Lütfen zorunlu alanları doldurunuz.');
      return;
    }
    setSubmitting(true);
    try {
      const fotograflar = images.filter((i) => i.status === 'done').map((i) => i.storageUrl);
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
      } catch {
        // Email bildirimi gönderilemedi — talep yine de kaydedildi
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

      trackEvent('talep_olusturuldu', { kategori: form.kategori, sehir: form.sehir });
      // Günlük sayacı güncelle
      const prev = Number(localStorage.getItem(LS_KEY) ?? 0);
      localStorage.setItem(LS_KEY, String(prev + 1));
      if (prev + 1 >= gunlukLimit) setLimitAsimi(true);
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

  /* ── Talep Havuzu kapalıysa bilgi mesajı göster ───────── */
  if (!flagsLoading && !flags.talepHavuzu) {
    return (
      <div className="flex flex-col min-h-screen">
        <SEOMeta title="Talep Oluştur — ModülerPazar" description="Modüler yapı teklif talebi oluşturun." />
        <Header />
        <main className="flex-1 bg-gray-50 flex items-center justify-center py-16 px-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 max-w-md w-full text-center">
            <Lock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Bu özellik şu anda kullanılamıyor</h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              Talep Havuzu özelliği geçici olarak kapatılmıştır. Lütfen daha sonra tekrar deneyin.
            </p>
            <button
              onClick={() => navigate('/')}
              className="bg-emerald-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-emerald-700 transition"
            >
              Ana Sayfaya Dön
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  /* ── Giriş zorunlu — görseller güvenli yüklensin diye ─── */
  if (!authLoading && !currentUser) {
    return (
      <div className="flex flex-col min-h-screen">
        <SEOMeta title="Talep Oluştur — ModülerPazar" description="Modüler yapı teklif talebi oluşturun." />
        <Header />
        <main className="flex-1 bg-gray-50 flex items-center justify-center py-16 px-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 max-w-md w-full text-center">
            <LogIn className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Talep oluşturmak için giriş yapın</h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              Görsellerinizi güvenle yükleyebilmek ve tekliflerinizi takip edebilmek için
              lütfen giriş yapın veya ücretsiz hesap oluşturun.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/giris"
                className="bg-emerald-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-emerald-700 transition"
              >
                Giriş Yap
              </Link>
              <Link
                to="/kayit"
                className="border border-emerald-600 text-emerald-600 px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-emerald-50 transition"
              >
                Hesap Oluştur
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

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
      <SEOMeta
        title="Ücretsiz Teklif Al — Modüler Yapı | ModülerPazar"
        description="Modüler yapı talebi oluşturun, doğrulanmış firmalardan ücretsiz teklif alın. Prefabrik, çelik yapı, konteyner ev ve daha fazlası."
        url="/talep-olustur"
      />
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

          {limitAsimi && (
            <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl px-4 py-4 text-sm">
              <p className="font-semibold text-amber-800">Günlük teklif talebi limitinizi kullandınız</p>
              <p className="text-amber-700 text-xs mt-1 leading-relaxed">
                Bugün için {gunlukLimit} teklif talebi hakkınızı kullandınız.
                Yarın tekrar teklif talep edebilirsiniz.
                Daha fazla talep için yakında gelecek ücretli planlarımıza göz atın.
              </p>
            </div>
          )}

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
                {t('talep.gorselSection')}
              </h2>
              <p className="text-xs text-gray-400">{t('talep.gorselInfo')}</p>

              {/* Drag-drop zone */}
              {images.length < MAX_IMAGES && (
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors select-none ${
                    dragOver
                      ? 'border-emerald-400 bg-emerald-50'
                      : 'border-gray-200 hover:border-emerald-300 hover:bg-gray-50'
                  }`}
                >
                  <ImageIcon className="w-10 h-10 mx-auto text-gray-300 mb-3" />
                  <p className="text-sm font-medium text-gray-600">{t('ilanOlustur.dragDrop')}</p>
                  <p className="text-xs text-gray-400 mt-1">JPG, PNG veya <span className="text-emerald-600 font-medium">WebP</span> (önerilen)</p>
                  <p className="text-xs text-gray-400 mt-0.5 mb-3">{t('ilanOlustur.or')}</p>
                  <span className="inline-flex items-center gap-1.5 bg-emerald-600 text-white text-xs font-medium px-4 py-2 rounded-lg hover:bg-emerald-700 transition pointer-events-none">
                    <Upload className="w-3.5 h-3.5" /> {t('ilanOlustur.fileSelect')}
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPT_ATTR}
                    multiple
                    className="hidden"
                    onChange={(e) => e.target.files && handleFiles(e.target.files)}
                  />
                </div>
              )}

              {/* Önizleme grid */}
              {images.length > 0 && (
                <div className={`grid grid-cols-3 sm:grid-cols-5 gap-3 ${images.length < MAX_IMAGES ? 'mt-4' : ''}`}>
                  {images.map((img) => (
                    <div
                      key={img.id}
                      className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-100"
                    >
                      <img src={img.previewUrl} alt="Referans görsel önizleme" loading="lazy" className="w-full h-full object-cover" />

                      {img.status === 'uploading' && (
                        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-1">
                          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span className="text-white text-xs font-semibold">{img.progress}%</span>
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                            <div className="h-full bg-emerald-400 transition-all" style={{ width: `${img.progress}%` }} />
                          </div>
                        </div>
                      )}

                      {img.status === 'done' && (
                        <div className="absolute bottom-1.5 right-1.5 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center shadow">
                          <CheckCircle className="w-3 h-3 text-white" />
                        </div>
                      )}

                      {img.status === 'error' && (
                        <div className="absolute inset-0 bg-red-500/70 flex items-center justify-center">
                          <AlertCircle className="w-7 h-7 text-white" />
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => removeImage(img)}
                        className="absolute top-1.5 left-1.5 w-5 h-5 bg-black/60 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors"
                        title="Görseli kaldır"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {images.length > 0 && (
                <p className="text-xs text-gray-400 mt-1">
                  {images.filter((i) => i.status === 'done').length} / {MAX_IMAGES} {t('ilanOlustur.gorselCountLabel')}
                </p>
              )}
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
              disabled={submitting || limitAsimi || uploading}
              className="w-full bg-emerald-600 text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-emerald-700 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Gönderiliyor…</>
                : uploading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('ilanOlustur.uploading')}</>
                  : limitAsimi
                    ? 'Günlük Limit Doldu'
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
