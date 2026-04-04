import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  collection, query, where, limit,
  getDocs, addDoc, serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { toast } from 'sonner';
import {
  Upload, X, ImageIcon, CheckCircle, AlertCircle, Loader2,
} from 'lucide-react';
import { db, storage } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { CATEGORIES } from '../data/categories';
import { sanitizeText } from '../utils/sanitize';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEOMeta from '../components/SEOMeta';

/* ─── Sabitler ───────────────────────────────────────────── */
const MAX_IMAGES   = 5;
const MAX_SIZE     = 5 * 1024 * 1024; // 5 MB
const ACCEPT_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ACCEPT_ATTR  = ACCEPT_TYPES.join(',');

/* ─── Tipler ─────────────────────────────────────────────── */
interface FirmaData {
  name:     string;
  phone:    string;
  eposta:   string;
  city:     string;
  verified: boolean;
}

interface UploadItem {
  id:          string;
  file:        File;
  previewUrl:  string;
  storageUrl:  string;
  storagePath: string;
  progress:    number;
  status:      'uploading' | 'done' | 'error';
}

/* ─── Sayfa ──────────────────────────────────────────────── */
export default function IlanOlusturPage() {
  const { currentUser, role, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { t }    = useLanguage();

  /* Firma verisi */
  const [firma,        setFirma]        = useState<FirmaData | null>(null);
  const [firmaLoading, setFirmaLoading] = useState(true);

  /* Form alanları */
  const [baslik,       setBaslik]       = useState('');
  const [kategoriSlug, setKategoriSlug] = useState('');
  const [fiyatStr,     setFiyatStr]     = useState('');
  const [aciklama,     setAciklama]     = useState('');
  const [errors,       setErrors]       = useState<Record<string, string>>({});
  const [submitting,   setSubmitting]   = useState(false);

  /* Stok durumu */
  const [stokDurumu, setStokDurumu] = useState<'var' | 'tedarik' | 'yok'>('var');

  /* Acil satış */
  const [acilSatis,       setAcilSatis]       = useState(false);
  const [acilSatisFiyat,  setAcilSatisFiyat]  = useState('');
  const [acilSatisBitis,  setAcilSatisBitis]  = useState('');
  const [acilSatisNedeni, setAcilSatisNedeni] = useState('');

  /* Görseller */
  const [images,   setImages]   = useState<UploadItem[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef  = useRef<HTMLInputElement>(null);
  const objectUrlsRef = useRef<string[]>([]);   // revoke on unmount

  /* ── Auth guard ────────────────────────────────────────── */
  useEffect(() => {
    if (!authLoading && role !== 'seller') navigate('/', { replace: true });
  }, [role, authLoading, navigate]);

  /* ── Firma verisi çek ──────────────────────────────────── */
  useEffect(() => {
    if (!currentUser || role !== 'seller') return;
    getDocs(query(
      collection(db, 'firms'),
      where('userId', '==', currentUser.uid),
      limit(1),
    )).then((snap) => {
      if (!snap.empty) {
        const d = snap.docs[0].data();
        setFirma({
          name:     d.name     ?? d.firmaAdi ?? '',
          phone:    d.phone    ?? d.telefon  ?? '',
          eposta:   d.eposta   ?? d.email    ?? '',
          city:     d.city     ?? d.sehir    ?? '',
          verified: d.verified ?? false,
        });
      }
    }).catch(() => {}).finally(() => setFirmaLoading(false));
  }, [currentUser, role]);

  /* ── ObjectURL temizle (memory leak önleme) ────────────── */
  useEffect(() => {
    return () => objectUrlsRef.current.forEach(URL.revokeObjectURL);
  }, []);

  /* ── Tek dosya yükleme ─────────────────────────────────── */
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
    const storagePath = `ilanlar/${currentUser.uid}/${id}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

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
        // storage upload hatası
        setImages((prev) => prev.map((img) => img.id === id ? { ...img, status: 'error' } : img));
        toast.error(`${file.name} yüklenemedi. (${storageError.code})`);
      },
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        setImages((prev) => prev.map((img) =>
          img.id === id ? { ...img, storageUrl: url, status: 'done', progress: 100 } : img,
        ));
        setErrors((prev) => ({ ...prev, gorseller: '' }));
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

  /* ── Doğrulama ────────────────────────────────────────── */
  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!baslik.trim())   e.baslik      = t('ilanOlustur.baslikRequired');
    if (!kategoriSlug)    e.kategoriSlug = t('ilanOlustur.kategoriRequired');
    const fiyatNum = Number(fiyatStr.replace(/\./g, '').replace(',', '.'));
    if (!fiyatStr || fiyatNum <= 0) e.fiyat = t('ilanOlustur.fiyatRequired');
    if (!images.some((i) => i.status === 'done')) e.gorseller = t('ilanOlustur.gorselRequired');
    if (acilSatis) {
      const afiyat = Number(acilSatisFiyat.replace(/\./g, '').replace(',', '.'));
      if (!acilSatisFiyat || afiyat <= 0) e.acilSatisFiyat = t('ilanOlustur.acilFiyatRequired');
      else if (fiyatNum > 0 && afiyat >= fiyatNum) e.acilSatisFiyat = t('acilSatis.priceLow');
      if (!acilSatisBitis) e.acilSatisBitis = t('ilanOlustur.acilBitisRequired');
      else if (new Date(acilSatisBitis) <= new Date()) e.acilSatisBitis = t('ilanOlustur.acilBitisFuture');
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  /* ── Submit ───────────────────────────────────────────── */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (images.some((i) => i.status === 'uploading')) {
      toast.error(t('ilanOlustur.waitUploading'));
      return;
    }
    if (!validate()) return;

    setSubmitting(true);
    try {
      const cat      = CATEGORIES.find((c) => c.slug === kategoriSlug);
      const gorseller = images.filter((i) => i.status === 'done').map((i) => i.storageUrl);
      const fiyatNum  = Number(fiyatStr.replace(/\./g, '').replace(',', '.'));

      await addDoc(collection(db, 'ilanlar'), {
        baslik:           sanitizeText(baslik.trim(), 200),
        aciklama:         sanitizeText(aciklama.trim(), 2000),
        fiyat:            fiyatNum,
        kategori:         cat?.name ?? kategoriSlug,
        kategoriSlug,
        sehir:            firma?.city     ?? '',
        firmaAdi:         firma?.name     ?? '',
        firmaId:          currentUser!.uid,
        firmaDogrulanmis: firma?.verified ?? false,
        gorseller,
        ozellikler:       {},
        acil:             false,
        indirimli:        false,
        ilanBitis:        Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
        yenilenmeSayisi:  0,
        aktif:            true,
        acilSatis:        acilSatis,
        acilSatisFiyat:   acilSatis
          ? Number(acilSatisFiyat.replace(/\./g, '').replace(',', '.'))
          : null,
        acilSatisBitis:   acilSatis
          ? Timestamp.fromDate(new Date(acilSatisBitis + 'T23:59:59'))
          : null,
        acilSatisNedeni:  acilSatis ? (acilSatisNedeni.trim() || null) : null,
        stokDurumu,
        status:           'aktif',
        tarih:            serverTimestamp(),
      });

      toast.success(t('ilanOlustur.published'));
      navigate('/firma-paneli');
    } catch (err) {
      // ilan oluşturma hatası
      const msg = (err as { code?: string }).code === 'permission-denied'
        ? 'İzin reddedildi. E-posta adresinizi doğruladığınızdan emin olun.'
        : t('ilanOlustur.publishError');
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  /* ── Yükleme / guard ──────────────────────────────────── */
  if (authLoading || firmaLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    );
  }

  const uploading = images.some((i) => i.status === 'uploading');
  const inp = (field: string) =>
    `w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
      errors[field] ? 'border-red-400 bg-red-50' : 'border-gray-300'
    }`;
  const Err = ({ f }: { f: string }) =>
    errors[f] ? (
      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
        <AlertCircle className="w-3 h-3 flex-shrink-0" />{errors[f]}
      </p>
    ) : null;

  /* ── Render ───────────────────────────────────────────── */
  return (
    <>
      <SEOMeta
        title="Yeni İlan Ver — ModülerPazar"
        description="Modüler yapı ilanınızı yayınlayın. Onaylı firma görseli yükleyin, fiyat belirleyin."
        url="/ilan-olustur"
      />
      <Header />

      <main className="bg-gray-50 min-h-screen py-10">
        <div className="max-w-2xl mx-auto px-4">

          {/* Breadcrumb */}
          <nav className="text-sm text-gray-500 mb-6 flex items-center gap-2">
            <Link to="/firma-paneli" className="hover:text-emerald-600 transition">{t('firmaPanel.title')}</Link>
            <span>/</span>
            <span className="text-gray-800">{t('ilanOlustur.breadcrumb')}</span>
          </nav>

          <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('ilanOlustur.title')}</h1>

          {/* ── E-posta doğrulama uyarısı ───────────────── */}
          {currentUser && !currentUser.emailVerified && (
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-300 rounded-2xl p-4 mb-4">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800">E-posta adresiniz doğrulanmamış</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  İlan oluşturabilmek için e-posta doğrulaması gereklidir. Giriş e-postanızı kontrol edin.
                </p>
              </div>
            </div>
          )}

          {/* ── Firma bilgisi — readonly ─────────────────── */}
          {firma && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 mb-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">
                  {t('ilanOlustur.ownerLabel')}
                </p>
                {firma.verified
                  ? <span className="text-xs font-medium bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">✓ Onaylı Firma</span>
                  : <span className="text-xs font-medium bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">⏳ Onay Bekliyor</span>
                }
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                {[
                  { label: t('common.firmaAdi'), value: firma.name   },
                  { label: t('common.sehir'),    value: firma.city   },
                  { label: t('common.telefon'),  value: firma.phone  },
                  { label: t('common.eposta'),   value: firma.eposta },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs text-emerald-500 mb-0.5">{label}</p>
                    <p className="font-medium text-gray-800 truncate text-sm">{value || '—'}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">

            {/* ── İlan Bilgileri ──────────────────────────── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              <h2 className="font-semibold text-gray-800 text-sm">{t('ilanOlustur.sectionInfo')}</h2>

              {/* Başlık */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('ilanOlustur.baslikLabel')} <span className="text-red-500">*</span>
                </label>
                <input
                  value={baslik}
                  onChange={(e) => { setBaslik(e.target.value); setErrors((p) => ({ ...p, baslik: '' })); }}
                  placeholder={t('ilanOlustur.baslikPh')}
                  maxLength={200}
                  className={inp('baslik')}
                />
                <Err f="baslik" />
              </div>

              {/* Kategori + Fiyat */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('ilanOlustur.kategoriLabel')} <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={kategoriSlug}
                    onChange={(e) => { setKategoriSlug(e.target.value); setErrors((p) => ({ ...p, kategoriSlug: '' })); }}
                    className={inp('kategoriSlug') + ' bg-white'}
                  >
                    <option value="">{t('ilanOlustur.selectPh')}</option>
                    {CATEGORIES.map((c) => (
                      <option key={c.slug} value={c.slug}>{c.name}</option>
                    ))}
                  </select>
                  <Err f="kategoriSlug" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('ilanOlustur.fiyatLabel')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={fiyatStr}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '');
                      setFiyatStr(digits ? Number(digits).toLocaleString('tr-TR') : '');
                      setErrors((p) => ({ ...p, fiyat: '' }));
                    }}
                    placeholder={t('ilanOlustur.fiyatPh')}
                    className={inp('fiyat')}
                  />
                  <Err f="fiyat" />
                </div>
              </div>

              {/* Açıklama */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('ilanOlustur.aciklamaLabel')}{' '}
                  <span className="text-gray-400 text-xs font-normal">{t('common.optional')}</span>
                </label>
                <textarea
                  rows={4}
                  value={aciklama}
                  onChange={(e) => setAciklama(e.target.value)}
                  maxLength={2000}
                  placeholder={t('ilanOlustur.aciklamaPh')}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
                <p className="text-xs text-gray-400 mt-1 text-right">{aciklama.length} / 2000</p>
              </div>

              {/* Stok Durumu */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stok Durumu
                </label>
                <div className="flex gap-2 flex-wrap">
                  {([
                    { value: 'var',     label: 'Stokta Var',          cls: 'border-green-400 bg-green-50 text-green-700'  },
                    { value: 'tedarik', label: 'Tedarik Bekleniyor',  cls: 'border-yellow-400 bg-yellow-50 text-yellow-700' },
                    { value: 'yok',     label: 'Stok Yok',            cls: 'border-gray-400 bg-gray-50 text-gray-600'     },
                  ] as const).map(({ value, label, cls }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setStokDurumu(value)}
                      className={`border rounded-lg px-3 py-2 text-sm font-medium transition ${
                        stokDurumu === value ? cls : 'border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Acil Satılık ────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-800 text-sm">{t('acilSatis.sectionTitle')}</h2>
                {acilSatis && (
                  <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                    {t('acilSatis.badge')}
                  </span>
                )}
              </div>

              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={acilSatis}
                  onChange={(e) => {
                    setAcilSatis(e.target.checked);
                    if (!e.target.checked) {
                      setAcilSatisFiyat('');
                      setAcilSatisBitis('');
                      setAcilSatisNedeni('');
                      setErrors((p) => ({ ...p, acilSatisFiyat: '', acilSatisBitis: '' }));
                    }
                  }}
                  className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <span className="text-sm text-gray-700">{t('acilSatis.checkboxLabel')}</span>
              </label>

              {acilSatis && (
                <div className="space-y-4 border-t border-red-100 pt-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('acilSatis.priceLabel')} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={acilSatisFiyat}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, '');
                          setAcilSatisFiyat(digits ? Number(digits).toLocaleString('tr-TR') : '');
                          setErrors((p) => ({ ...p, acilSatisFiyat: '' }));
                        }}
                        placeholder="Örn: 280.000"
                        className={inp('acilSatisFiyat')}
                      />
                      <Err f="acilSatisFiyat" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('acilSatis.endDateLabel')} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={acilSatisBitis}
                        min={new Date().toISOString().slice(0, 10)}
                        onChange={(e) => {
                          setAcilSatisBitis(e.target.value);
                          setErrors((p) => ({ ...p, acilSatisBitis: '' }));
                        }}
                        className={inp('acilSatisBitis')}
                      />
                      <Err f="acilSatisBitis" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('acilSatis.reasonLabel')}{' '}
                      <span className="text-gray-400 text-xs font-normal">{t('common.optional')}</span>
                    </label>
                    <input
                      type="text"
                      value={acilSatisNedeni}
                      onChange={(e) => setAcilSatisNedeni(e.target.value)}
                      placeholder={t('acilSatis.reasonPlaceholder')}
                      maxLength={200}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  {/* Önizleme badge */}
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                    <span className="text-2xl">🔴</span>
                    <div>
                      <p className="text-red-700 font-bold text-sm">{t('badge.urgentSale')}</p>
                      {acilSatisFiyat && (
                        <p className="text-red-600 text-xs mt-0.5">
                          Acil fiyat: <span className="font-semibold">{acilSatisFiyat} ₺</span>
                          {fiyatStr && (
                            <span className="text-gray-400 line-through ml-2">{fiyatStr} ₺</span>
                          )}
                        </p>
                      )}
                      {acilSatisBitis && (
                        <p className="text-gray-500 text-xs mt-0.5">
                          Bitiş: {new Date(acilSatisBitis).toLocaleDateString('tr-TR')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── Görsel Yükleme ──────────────────────────── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-semibold text-gray-800 text-sm mb-1">
                {t('ilanOlustur.gorselSection')} <span className="text-red-500">*</span>
              </h2>
              <p className="text-xs text-gray-400 mb-4">
                {t('ilanOlustur.gorselInfo')}
              </p>

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
                      : errors.gorseller
                      ? 'border-red-300 bg-red-50'
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

              <Err f="gorseller" />

              {/* Thumbnail grid */}
              {images.length > 0 && (
                <div className={`grid grid-cols-3 sm:grid-cols-5 gap-3 ${images.length < MAX_IMAGES ? 'mt-4' : ''}`}>
                  {images.map((img) => (
                    <div
                      key={img.id}
                      className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-100"
                    >
                      <img src={img.previewUrl} alt="İlan görseli önizleme" loading="lazy" className="w-full h-full object-cover" />

                      {/* Yükleme overlay */}
                      {img.status === 'uploading' && (
                        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-1">
                          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span className="text-white text-xs font-semibold">{img.progress}%</span>
                          {/* Progress bar */}
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                            <div
                              className="h-full bg-emerald-400 transition-all"
                              style={{ width: `${img.progress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Tamamlandı rozeti */}
                      {img.status === 'done' && (
                        <div className="absolute bottom-1.5 right-1.5 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center shadow">
                          <CheckCircle className="w-3 h-3 text-white" />
                        </div>
                      )}

                      {/* Hata */}
                      {img.status === 'error' && (
                        <div className="absolute inset-0 bg-red-500/70 flex items-center justify-center">
                          <AlertCircle className="w-7 h-7 text-white" />
                        </div>
                      )}

                      {/* Sil */}
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
                <p className="text-xs text-gray-400 mt-3">
                  {images.filter((i) => i.status === 'done').length} / {MAX_IMAGES} {t('ilanOlustur.gorselCountLabel')}
                </p>
              )}
            </div>

            {/* ── Submit ──────────────────────────────────── */}
            <button
              type="submit"
              disabled={submitting || uploading}
              className="w-full bg-emerald-600 text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-emerald-700 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting
                ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('ilanOlustur.publishing')}</>
                : uploading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('ilanOlustur.uploading')}</>
                : <><CheckCircle className="w-4 h-4" /> {t('ilanOlustur.publish')}</>
              }
            </button>

          </form>
        </div>
      </main>

      <Footer />
    </>
  );
}
