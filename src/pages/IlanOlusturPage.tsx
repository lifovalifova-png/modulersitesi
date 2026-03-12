import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  collection, query, where, limit,
  getDocs, addDoc, serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { toast } from 'sonner';
import {
  Upload, X, ImageIcon, CheckCircle, AlertCircle, Loader2,
} from 'lucide-react';
import { db, storage } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
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
      () => {
        setImages((prev) => prev.map((img) => img.id === id ? { ...img, status: 'error' } : img));
        toast.error(`${file.name} yüklenemedi.`);
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
    if (!baslik.trim())   e.baslik      = 'Başlık zorunludur.';
    if (!kategoriSlug)    e.kategoriSlug = 'Kategori seçiniz.';
    const fiyatNum = Number(fiyatStr.replace(/\./g, '').replace(',', '.'));
    if (!fiyatStr || fiyatNum <= 0) e.fiyat = 'Geçerli bir fiyat giriniz.';
    if (!images.some((i) => i.status === 'done')) e.gorseller = 'En az 1 görsel yükleyiniz.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  /* ── Submit ───────────────────────────────────────────── */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (images.some((i) => i.status === 'uploading')) {
      toast.error('Görseller yüklenirken lütfen bekleyin.');
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
        acilSatis:        false,
        status:           'aktif',
        tarih:            serverTimestamp(),
      });

      toast.success('İlanınız yayınlandı!');
      navigate('/firma-paneli');
    } catch {
      toast.error('İlan eklenirken hata oluştu. Lütfen tekrar deneyin.');
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
            <Link to="/firma-paneli" className="hover:text-emerald-600 transition">Firma Paneli</Link>
            <span>/</span>
            <span className="text-gray-800">Yeni İlan</span>
          </nav>

          <h1 className="text-2xl font-bold text-gray-900 mb-6">Yeni İlan Ver</h1>

          {/* ── Firma bilgisi — readonly ─────────────────── */}
          {firma && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 mb-6">
              <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-3">
                İlan sahibi firma
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                {[
                  { label: 'Firma Adı', value: firma.name    },
                  { label: 'Şehir',     value: firma.city    },
                  { label: 'Telefon',   value: firma.phone   },
                  { label: 'E-posta',   value: firma.eposta  },
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
              <h2 className="font-semibold text-gray-800 text-sm">İlan Bilgileri</h2>

              {/* Başlık */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Başlık <span className="text-red-500">*</span>
                </label>
                <input
                  value={baslik}
                  onChange={(e) => { setBaslik(e.target.value); setErrors((p) => ({ ...p, baslik: '' })); }}
                  placeholder="Örn: 80m² Prefabrik Villa – Anahtar Teslim"
                  maxLength={200}
                  className={inp('baslik')}
                />
                <Err f="baslik" />
              </div>

              {/* Kategori + Fiyat */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kategori <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={kategoriSlug}
                    onChange={(e) => { setKategoriSlug(e.target.value); setErrors((p) => ({ ...p, kategoriSlug: '' })); }}
                    className={inp('kategoriSlug') + ' bg-white'}
                  >
                    <option value="">Seçiniz…</option>
                    {CATEGORIES.map((c) => (
                      <option key={c.slug} value={c.slug}>{c.name}</option>
                    ))}
                  </select>
                  <Err f="kategoriSlug" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fiyat (₺) <span className="text-red-500">*</span>
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
                    placeholder="Örn: 350.000"
                    className={inp('fiyat')}
                  />
                  <Err f="fiyat" />
                </div>
              </div>

              {/* Açıklama */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Açıklama{' '}
                  <span className="text-gray-400 text-xs font-normal">(isteğe bağlı)</span>
                </label>
                <textarea
                  rows={4}
                  value={aciklama}
                  onChange={(e) => setAciklama(e.target.value)}
                  maxLength={2000}
                  placeholder="Yapının özellikleri, teslim süresi, dahil olan hizmetler…"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
                <p className="text-xs text-gray-400 mt-1 text-right">{aciklama.length} / 2000</p>
              </div>
            </div>

            {/* ── Görsel Yükleme ──────────────────────────── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-semibold text-gray-800 text-sm mb-1">
                Görseller <span className="text-red-500">*</span>
              </h2>
              <p className="text-xs text-gray-400 mb-4">
                En az 1, en fazla {MAX_IMAGES} görsel — her biri maks. 5 MB — JPG, PNG, WebP
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
                  <p className="text-sm font-medium text-gray-600">Görselleri buraya sürükleyin</p>
                  <p className="text-xs text-gray-400 mt-1 mb-3">veya</p>
                  <span className="inline-flex items-center gap-1.5 bg-emerald-600 text-white text-xs font-medium px-4 py-2 rounded-lg hover:bg-emerald-700 transition pointer-events-none">
                    <Upload className="w-3.5 h-3.5" /> Dosya Seç
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
                      <img src={img.previewUrl} alt="" className="w-full h-full object-cover" />

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
                  {images.filter((i) => i.status === 'done').length} / {MAX_IMAGES} görsel yüklendi
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
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Yayınlanıyor…</>
                : uploading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Görseller yükleniyor…</>
                : <><CheckCircle className="w-4 h-4" /> İlanı Yayınla</>
              }
            </button>

          </form>
        </div>
      </main>

      <Footer />
    </>
  );
}
