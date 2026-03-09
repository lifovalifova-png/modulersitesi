import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { CATEGORIES } from '../data/categories';
import { FLASH_DEALS } from '../data/flashDeals';
import { useIlanlar, formatFiyat, formatTarih, type Ilan } from '../hooks/useIlanlar';
import { useTeklifSepet } from '../context/TeklifSepetContext';
import SEOMeta from '../components/SEOMeta';
import { trackEvent } from '../lib/analytics';
import { sanitizeText } from '../utils/sanitize';
import {
  MapPin, Tag, Calendar, ShieldCheck, Phone, ChevronLeft, ChevronRight,
  Send, CheckCircle, AlertCircle, Loader2, X, Eye, EyeOff, Star,
  ArrowLeft, Zap, ShoppingBag,
} from 'lucide-react';

/* ── Kategori badge renkleri ────────────────────────────── */
const CAT_COLORS: Record<string, string> = {
  'Prefabrik':           'bg-emerald-100 text-emerald-700',
  'Yaşam Konteynerleri': 'bg-blue-100 text-blue-700',
  'Tiny House':          'bg-purple-100 text-purple-700',
  'Çelik Yapılar':       'bg-gray-200 text-gray-700',
  'Ahşap Yapılar':       'bg-amber-100 text-amber-700',
  'Özel Projeler':       'bg-pink-100 text-pink-700',
  '2. El':               'bg-orange-100 text-orange-700',
};

/* ── Statik ilanı Ilan tipine çevir ─────────────────────── */
function flashDealToIlan(d: (typeof FLASH_DEALS)[0]): Ilan {
  const categSlug = CATEGORIES.find((c) => c.name === d.category)?.slug ?? 'prefabrik';
  return {
    id:               String(d.id),
    baslik:           d.title,
    kategori:         d.category,
    kategoriSlug:     categSlug,
    sehir:            d.location,
    fiyat:            parseInt(d.price.replace(/[^\d]/g, ''), 10) || 0,
    aciklama:         d.description,
    ozellikler:       Object.fromEntries(d.features.map((f) => [f.label, f.value])),
    gorseller:        d.images,
    firmaId:          '',
    firmaAdi:         d.firmName,
    firmaDogrulanmis: d.firmVerified,
    acil:             d.urgent,
    indirimli:        !!d.discount,
    status:           'aktif',
    tarih:            { seconds: new Date(d.date).getTime() / 1000, nanoseconds: 0 },
  };
}

/* ── Ozellikler objesini {label,value}[] dizisine çevir ─── */
function ozelliklerToArray(oz: Ilan['ozellikler']): { label: string; value: string }[] {
  return Object.entries(oz)
    .filter(([, v]) => v)
    .map(([k, v]) => ({ label: k, value: v as string }));
}

/* ══════════════════════════════════════════════════════════
   Teklif Modalı
══════════════════════════════════════════════════════════ */

interface QuoteModalProps {
  ilan: Ilan;
  type: 'primary' | 'secondary';
  onClose: () => void;
}

function QuoteModal({ ilan, type, onClose }: QuoteModalProps) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '', kvkk: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const set = (key: string, val: string | boolean) => setForm((f) => ({ ...f, [key]: val }));

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim())                         e.name  = 'Ad soyad zorunludur.';
    if (!/^[0-9+\s()\-]{10,}$/.test(form.phone)) e.phone = 'Geçerli bir telefon giriniz.';
    if (!form.kvkk)                                e.kvkk  = 'KVKK metnini kabul etmelisiniz.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setStatus('loading');
    try {
      await addDoc(collection(db, 'quotes'), {
        ilanId:          ilan.id,
        ilanBaslik:      ilan.baslik,
        ilanFiyat:       ilan.fiyat,
        ilanKategori:    ilan.kategori,
        musteriAd:       sanitizeText(form.name, 100),
        musteriTelefon:  form.phone.trim(),
        musteriEmail:    form.email.trim().toLowerCase(),
        mesaj:           sanitizeText(form.message, 500),
        teklifTipi:      type,
        firmaAdi:        ilan.firmaAdi,
        status:          'new',
        tarih:           serverTimestamp(),
      });
      setStatus('success');
      setTimeout(onClose, 3000);
    } catch {
      setStatus('error');
    }
  }

  const isSecond = type === 'secondary';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
        <div className={`sticky top-0 z-10 border-b px-6 py-4 flex items-center justify-between rounded-t-2xl ${
          isSecond ? 'bg-amber-50 border-amber-100' : 'bg-white border-gray-100'
        }`}>
          <div>
            <h2 className="text-lg font-bold text-gray-800">
              {isSecond ? '2. Firmadan Teklif Al' : 'Teklif Al'}
            </h2>
            {isSecond && (
              <p className="text-xs text-amber-700 mt-0.5">Farklı bir firmadan da fiyat karşılaştırması yapın</p>
            )}
          </div>
          <button onClick={onClose} aria-label="Kapat" className="p-2 hover:bg-gray-100 rounded-full transition">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className={`px-6 py-4 border-b ${isSecond ? 'bg-amber-50 border-amber-100' : 'bg-emerald-50 border-emerald-100'}`}>
          <p className="font-semibold text-gray-800 text-sm">{ilan.baslik}</p>
          <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{ilan.sehir}</span>
            <span className={`font-bold ${isSecond ? 'text-amber-600' : 'text-emerald-600'}`}>{formatFiyat(ilan.fiyat)}</span>
          </div>
          {isSecond && (
            <p className="mt-2 text-xs text-amber-800 bg-amber-100 rounded-lg px-3 py-2">
              💡 Birden fazla firmadan teklif alarak en uygun fiyatı ve en iyi hizmeti bulun.
            </p>
          )}
        </div>

        {status === 'success' ? (
          <div className="px-6 py-14 text-center">
            <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Talebiniz Alındı!</h3>
            <p className="text-gray-500 text-sm">En kısa sürede sizinle iletişime geçilecek.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ad Soyad <span className="text-red-500">*</span>
              </label>
              <input type="text" value={form.name} onChange={(e) => set('name', e.target.value)}
                placeholder="Adınız Soyadınız"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              {errors.name && <p className="mt-1 text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefon <span className="text-red-500">*</span>
              </label>
              <input type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)}
                placeholder="05XX XXX XX XX"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              {errors.phone && <p className="mt-1 text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.phone}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
              <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)}
                placeholder="ornek@email.com"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mesajınız</label>
              <textarea value={form.message} onChange={(e) => set('message', e.target.value)}
                rows={3} placeholder="Özel isteğiniz veya sormak istedikleriniz…"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
            </div>

            <div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={form.kvkk} onChange={(e) => set('kvkk', e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-emerald-600 border-gray-300 focus:ring-emerald-500" />
                <span className="text-xs text-gray-600 leading-relaxed">
                  Kişisel verilerimin{' '}
                  <Link to="/kvkk" target="_blank" className="text-emerald-600 hover:underline font-medium">Aydınlatma Metni</Link>{' '}
                  çerçevesinde işlenmesini ve teklif hazırlanması amacıyla ilgili firmaya aktarılmasını onaylıyorum.{' '}
                  <span className="text-red-500">*</span>
                </span>
              </label>
              {errors.kvkk && <p className="mt-1 text-xs text-red-600 flex items-center gap-1 ml-7"><AlertCircle className="w-3 h-3" />{errors.kvkk}</p>}
            </div>

            {status === 'error' && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-4 py-3 rounded-lg">
                <AlertCircle className="w-4 h-4" />Bir hata oluştu. Lütfen tekrar deneyin.
              </div>
            )}

            <button type="submit" disabled={status === 'loading'}
              className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition disabled:opacity-60 ${
                isSecond ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}>
              {status === 'loading'
                ? <><Loader2 className="w-4 h-4 animate-spin" />Gönderiliyor…</>
                : <><Send className="w-4 h-4" />Teklif Talep Et</>
              }
            </button>

            <p className="text-xs text-gray-400 text-center">
              Bilgileriniz yalnızca teklif hazırlanması amacıyla ilgili firmaya iletilecektir.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   Benzer İlan Kartı
══════════════════════════════════════════════════════════ */

function SimilarCard({ ilan, onQuote }: { ilan: Ilan; onQuote: (d: Ilan) => void }) {
  const img = ilan.gorseller[0] ?? '';
  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md transition flex flex-col">
      <Link to={`/ilan/${ilan.id}`} className="block">
        <div className="relative h-44 bg-gray-100">
          {img
            ? <img src={img} alt={ilan.baslik} loading="lazy" className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-gray-300 text-3xl">🏠</div>
          }
          {ilan.acil && (
            <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">ACİL</span>
          )}
        </div>
      </Link>
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center gap-1.5 mb-2">
          <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${CAT_COLORS[ilan.kategori] ?? 'bg-gray-100 text-gray-600'}`}>
            <Tag className="w-2.5 h-2.5" />{ilan.kategori}
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
            <MapPin className="w-2.5 h-2.5" />{ilan.sehir}
          </span>
        </div>
        <Link to={`/ilan/${ilan.id}`}
          className="font-semibold text-gray-800 text-sm leading-snug line-clamp-2 hover:text-emerald-600 transition mb-3 flex-1">
          {ilan.baslik}
        </Link>
        <div className="flex items-center justify-between mt-auto">
          <p className="text-emerald-600 font-bold text-base">{formatFiyat(ilan.fiyat)}</p>
          <button onClick={() => onQuote(ilan)}
            className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 transition font-medium">
            Teklif Al
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   Ana Bileşen
══════════════════════════════════════════════════════════ */

export default function IlanDetayPage() {
  const { id }     = useParams<{ id: string }>();
  const navigate   = useNavigate();
  const { addFirm, isInSepet, isFull, openDrawer } = useTeklifSepet();

  const [ilan,    setIlan]    = useState<Ilan | null>(null);
  const [fetching, setFetching] = useState(true);
  const [notFound, setNotFound] = useState(false);


  /* Firestore'dan çek; bulunamazsa statik fallback */
  useEffect(() => {
    if (!id) { setNotFound(true); setFetching(false); return; }
    setFetching(true);

    (async () => {
      try {
        const snap = await getDoc(doc(db, 'ilanlar', id));
        if (snap.exists()) {
          setIlan({ id: snap.id, ...snap.data() } as Ilan);
        } else {
          /* Numeric ID → statik veri fallback */
          const numId = Number(id);
          const found = FLASH_DEALS.find((d) => d.id === numId);
          if (found) setIlan(flashDealToIlan(found));
          else setNotFound(true);
        }
      } catch {
        /* Firestore erişim hatası → statik fallback dene */
        const numId = Number(id);
        const found = FLASH_DEALS.find((d) => d.id === numId);
        if (found) setIlan(flashDealToIlan(found));
        else setNotFound(true);
      } finally {
        setFetching(false);
      }
    })();
  }, [id]);

  /* GA4 — ilan görüntülenince */
  useEffect(() => {
    if (ilan) {
      trackEvent('ilan_goruntulendi', { kategori: ilan.kategori, firmaAdi: ilan.firmaAdi });
    }
  }, [ilan]);

  /* Benzer ilanlar (aynı kategori, Firestore) */
  const { ilanlar: allIlanlar } = useIlanlar(ilan?.kategoriSlug);
  const similar = allIlanlar.filter((d) => d.id !== ilan?.id).slice(0, 3);

  /* Galeri state */
  const [activeImg, setActiveImg] = useState(0);
  /* Firma iletişim bilgisi */
  const [showPhone, setShowPhone] = useState(false);
  const [firmaContact, setFirmaContact] = useState<{ phone?: string; eposta?: string; whatsapp?: string } | null>(null);
  const [contactLoading, setContactLoading] = useState(false);

  async function handleShowContact() {
    if (showPhone) { setShowPhone(false); return; }
    setShowPhone(true);
    if (firmaContact !== null || !ilan?.firmaId) return;
    setContactLoading(true);
    try {
      const snap = await getDoc(doc(db, 'firms', ilan.firmaId));
      if (snap.exists()) {
        const d = snap.data() as { phone?: string; eposta?: string; whatsapp?: string };
        setFirmaContact({ phone: d.phone, eposta: d.eposta, whatsapp: d.whatsapp });
      } else {
        setFirmaContact({});
      }
    } catch {
      setFirmaContact({});
    } finally {
      setContactLoading(false);
    }
  }
  /* Teklif modalı */
  const [modal, setModal] = useState<{ open: boolean; type: 'primary' | 'secondary' }>({ open: false, type: 'primary' });
  /* Benzer ilan modalı */
  const [similarModal, setSimilarModal] = useState<{ open: boolean; ilan: Ilan | null }>({ open: false, ilan: null });
  /* Sepet feedback */
  const [sepetFeedback, setSepetFeedback] = useState<'idle' | 'added'>('idle');

  /* ── Loading ── */
  if (fetching) {
    return (
      <>
        <Header />
        <main className="min-h-[60vh] flex items-center justify-center bg-gray-50">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        </main>
        <Footer />
      </>
    );
  }

  /* ── 404 ── */
  if (notFound || !ilan) {
    return (
      <>
        <Header />
        <main className="min-h-[60vh] flex items-center justify-center bg-gray-50">
          <div className="text-center px-4">
            <p className="text-5xl font-bold text-gray-200 mb-4">404</p>
            <h1 className="text-xl font-semibold text-gray-700 mb-2">İlan bulunamadı</h1>
            <p className="text-gray-500 mb-6">Bu ilan kaldırılmış veya mevcut değil.</p>
            <button onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-2.5 rounded-lg hover:bg-emerald-700 transition font-medium">
              <ArrowLeft className="w-4 h-4" /> Geri Dön
            </button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const catSlug  = CATEGORIES.find((c) => c.name === ilan.kategori)?.slug ?? ilan.kategoriSlug;
  const features = ozelliklerToArray(ilan.ozellikler);
  const images   = ilan.gorseller.length > 0 ? ilan.gorseller : [''];

  const prevImg = () => setActiveImg((i) => (i - 1 + images.length) % images.length);
  const nextImg = () => setActiveImg((i) => (i + 1) % images.length);

  return (
    <>
      <Header />
      <SEOMeta
        title={ilan.baslik}
        description={ilan.aciklama.slice(0, 160)}
        image={ilan.gorseller[0]}
        url={`/ilan/${ilan.id}`}
      />

      <main className="bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 py-8">

          {/* Breadcrumb */}
          <nav className="text-sm text-gray-500 mb-6 flex items-center gap-1.5 flex-wrap">
            <Link to="/" className="hover:text-emerald-600 transition">Ana Sayfa</Link>
            <span>/</span>
            <Link to={`/kategori/${catSlug}`} className="hover:text-emerald-600 transition">{ilan.kategori}</Link>
            <span>/</span>
            <span className="text-gray-800 line-clamp-1">{ilan.baslik}</span>
          </nav>

          <div className="flex flex-col lg:flex-row gap-7">

            {/* ════ Sol / Ana ════════════════════════════════ */}
            <div className="flex-1 min-w-0 space-y-5">

              {/* Fotoğraf Galerisi */}
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                <div className="relative bg-gray-100 aspect-[16/9] max-h-[480px]">
                  {images[activeImg] ? (
                    <img src={images[activeImg]} alt={`${ilan.baslik} — görsel ${activeImg + 1}`}
                      loading="lazy" width={800} height={600} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-6xl">🏠</div>
                  )}
                  {ilan.acil && (
                    <span className="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-lg shadow">ACİL</span>
                  )}
                  {ilan.indirimli && (
                    <span className="absolute top-4 right-4 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-lg shadow">İNDİRİMLİ</span>
                  )}
                  {images.length > 1 && (
                    <>
                      <button onClick={prevImg} aria-label="Önceki görsel"
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow transition">
                        <ChevronLeft className="w-5 h-5 text-gray-700" />
                      </button>
                      <button onClick={nextImg} aria-label="Sonraki görsel"
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow transition">
                        <ChevronRight className="w-5 h-5 text-gray-700" />
                      </button>
                      <span className="absolute bottom-3 right-4 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full">
                        {activeImg + 1} / {images.length}
                      </span>
                    </>
                  )}
                </div>
                {images.length > 1 && (
                  <div className="flex gap-2 p-3 overflow-x-auto">
                    {images.map((img, i) => (
                      <button key={i} onClick={() => setActiveImg(i)} aria-label={`${i + 1}. görsel`}
                        className={`flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition ${
                          i === activeImg ? 'border-emerald-500 ring-1 ring-emerald-400' : 'border-transparent hover:border-gray-300'
                        }`}>
                        <img src={img} alt="" loading="lazy" width={80} height={56} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Başlık ve Meta */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${CAT_COLORS[ilan.kategori] ?? 'bg-gray-100 text-gray-600'}`}>
                    <Tag className="w-3 h-3" />{ilan.kategori}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                    <MapPin className="w-3 h-3" />{ilan.sehir}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full">
                    <Calendar className="w-3 h-3" />{formatTarih(ilan.tarih)}
                  </span>
                  {ilan.acil && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">
                      <Zap className="w-3 h-3" />ACİL
                    </span>
                  )}
                </div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 leading-snug">{ilan.baslik}</h1>
                <div className="flex items-end gap-3">
                  <span className="text-3xl font-extrabold text-emerald-600">{formatFiyat(ilan.fiyat)}</span>
                  {ilan.indirimli && (
                    <span className="text-sm font-bold text-white bg-amber-500 px-2 py-0.5 rounded-lg">İndirimli</span>
                  )}
                </div>
              </div>

              {/* Açıklama */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-base font-bold text-gray-800 mb-3">İlan Açıklaması</h2>
                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{ilan.aciklama}</p>
              </div>

              {/* Teknik Özellikler */}
              {features.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h2 className="text-base font-bold text-gray-800 mb-4">Teknik Özellikler</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-0 divide-y sm:divide-y-0">
                    {features.map((f, i) => (
                      <div key={f.label}
                        className={`flex items-center justify-between py-3 text-sm ${
                          i % 2 !== 0 ? 'sm:border-l sm:pl-8 sm:border-gray-100' : ''
                        } border-gray-100`}>
                        <span className="text-gray-500">{f.label}</span>
                        <span className="font-semibold text-gray-800 text-right">{f.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ════ Sağ Sidebar ═════════════════════════════ */}
            <div className="w-full lg:w-80 flex-shrink-0 space-y-4">

              {/* Firma Kartı */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Satıcı Firma</h3>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-emerald-700 font-extrabold text-lg leading-none">
                      {(ilan.firmaAdi || 'F').charAt(0)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-800 text-sm leading-snug">{ilan.firmaAdi}</p>
                    <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                      <MapPin className="w-3 h-3" />{ilan.sehir}
                    </span>
                  </div>
                  {ilan.firmaDogrulanmis && (
                    <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 ml-auto" aria-label="Doğrulanmış firma" />
                  )}
                </div>

                {ilan.firmaDogrulanmis ? (
                  <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 text-xs text-emerald-700 mb-4">
                    <ShieldCheck className="w-3.5 h-3.5" />Doğrulanmış firma
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 text-xs text-amber-700 mb-4">
                    Onay sürecindeki firma
                  </div>
                )}

                <div className="flex items-center gap-1 text-xs text-gray-400 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-3.5 h-3.5 ${i < 4 ? 'text-amber-400 fill-amber-400' : 'text-gray-300 fill-gray-300'}`} />
                  ))}
                  <span className="ml-1">4.0</span>
                </div>

                {ilan.firmaId && (
                  <Link
                    to={`/firma/${ilan.firmaId}`}
                    className="flex items-center justify-center gap-2 w-full border border-emerald-200 text-emerald-700 bg-emerald-50 py-2.5 rounded-xl text-sm font-medium hover:bg-emerald-100 transition mb-3"
                  >
                    Firma Profilini Gör
                  </Link>
                )}

                {/* Firma iletişim bilgileri */}
                {!showPhone ? (
                  <button onClick={handleShowContact}
                    className="flex items-center justify-center gap-2 w-full border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:border-gray-300 hover:bg-gray-50 transition mb-1">
                    <Eye className="w-4 h-4" /> İletişim Bilgilerini Göster
                  </button>
                ) : contactLoading ? (
                  <div className="flex items-center justify-center gap-2 w-full border border-gray-200 py-2.5 rounded-xl text-sm text-gray-400 mb-1">
                    <Loader2 className="w-4 h-4 animate-spin" /> Yükleniyor…
                  </div>
                ) : (
                  <div className="space-y-1.5 mb-1">
                    {firmaContact?.phone && (
                      <a href={`tel:${firmaContact.phone}`}
                        className="flex items-center justify-center gap-2 w-full border border-emerald-300 text-emerald-700 bg-emerald-50 py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-100 transition">
                        <Phone className="w-4 h-4" /> {firmaContact.phone}
                      </a>
                    )}
                    {firmaContact?.eposta && (
                      <a href={`mailto:${firmaContact.eposta}`}
                        className="flex items-center justify-center gap-2 w-full border border-blue-200 text-blue-700 bg-blue-50 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-100 transition">
                        {firmaContact.eposta}
                      </a>
                    )}
                    {!firmaContact?.phone && !firmaContact?.eposta && (
                      <p className="text-center text-xs text-gray-400 py-2">
                        İletişim bilgisi bulunamadı. Teklif formu üzerinden ulaşabilirsiniz.
                      </p>
                    )}
                    <button onClick={() => setShowPhone(false)}
                      className="flex items-center justify-center gap-1 w-full text-xs text-gray-400 hover:text-gray-600 transition">
                      <EyeOff className="w-3 h-3" /> Gizle
                    </button>
                  </div>
                )}
              </div>

              {/* Teklif Butonları */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
                <button onClick={() => setModal({ open: true, type: 'primary' })}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-sm">
                  <Send className="w-4 h-4" />Teklif Al
                </button>

                {isInSepet(ilan.id) ? (
                  <button onClick={openDrawer}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-sm">
                    <CheckCircle className="w-4 h-4" />Sepette ✓ — Görüntüle
                  </button>
                ) : isFull ? (
                  <button onClick={openDrawer}
                    className="w-full bg-gray-100 text-gray-500 font-bold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-gray-200 transition">
                    <ShoppingBag className="w-4 h-4" />Sepet Dolu (2/2) — Görüntüle
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      const result = addFirm(ilan);
                      if (result === 'added') {
                        setSepetFeedback('added');
                        setTimeout(() => setSepetFeedback('idle'), 2500);
                      }
                    }}
                    className={`w-full font-bold py-3.5 rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-sm ${
                      sepetFeedback === 'added' ? 'bg-emerald-600 text-white' : 'bg-amber-500 hover:bg-amber-600 text-white'
                    }`}>
                    {sepetFeedback === 'added'
                      ? <><CheckCircle className="w-4 h-4" />Sepete Eklendi ✓</>
                      : <><Zap className="w-4 h-4" />2. Firmadan da Teklif Al</>
                    }
                  </button>
                )}

                <p className="text-[11px] text-gray-400 text-center leading-relaxed px-1">
                  💡 Birden fazla firmadan teklif alarak en uygun fiyatı karşılaştırın.
                </p>
              </div>

              {/* Güvenli Alışveriş */}
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Güvenli Alışveriş</h3>
                <ul className="space-y-2.5 text-xs text-gray-600">
                  {[
                    'Firma bilgileri karşılıklı doğrulandıktan sonra ödeme yapın.',
                    'Sözleşmesiz, faturasız satış önerisini kabul etmeyin.',
                    'Teslimatta ürünü kontrol etmeden imzalamayın.',
                    'Şüpheli durumlarda bize bildirin: info@modulerpazar.com',
                  ].map((note) => (
                    <li key={note} className="flex items-start gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{note}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <p className="text-center text-xs text-gray-300">İlan No: {ilan.id.slice(0, 8).toUpperCase()}</p>
            </div>
          </div>

          {/* Benzer İlanlar */}
          {similar.length > 0 && (
            <div className="mt-12">
              <h2 className="text-xl font-bold text-gray-800 mb-5">Benzer İlanlar</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {similar.map((d) => (
                  <SimilarCard key={d.id} ilan={d}
                    onQuote={(d) => setSimilarModal({ open: true, ilan: d })} />
                ))}
              </div>
            </div>
          )}

        </div>
      </main>

      <Footer />

      {modal.open && (
        <QuoteModal ilan={ilan} type={modal.type}
          onClose={() => setModal({ open: false, type: 'primary' })} />
      )}

      {similarModal.open && similarModal.ilan && (
        <QuoteModal ilan={similarModal.ilan} type="primary"
          onClose={() => setSimilarModal({ open: false, ilan: null })} />
      )}
    </>
  );
}
