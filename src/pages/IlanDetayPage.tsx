import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { FLASH_DEALS, type FlashDeal } from '../data/flashDeals';
import { CATEGORIES } from '../data/categories';
import { useTeklifSepet } from '../context/TeklifSepetContext';
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

/* ── Tarih formatlayıcı ─────────────────────────────────── */
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('tr-TR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

/* ══════════════════════════════════════════════════════════
   İnline Teklif Modalı
══════════════════════════════════════════════════════════ */

interface QuoteModalProps {
  listing: FlashDeal;
  type: 'primary' | 'secondary';
  onClose: () => void;
}

function QuoteModal({ listing, type, onClose }: QuoteModalProps) {
  const [form, setForm] = useState({
    name: '', phone: '', email: '', message: '', kvkk: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const set = (key: string, val: string | boolean) =>
    setForm((f) => ({ ...f, [key]: val }));

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim())                           e.name  = 'Ad soyad zorunludur.';
    if (!/^[0-9+\s()\-]{10,}$/.test(form.phone))   e.phone = 'Geçerli bir telefon giriniz.';
    if (!form.kvkk)                                  e.kvkk  = 'KVKK metnini kabul etmelisiniz.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setStatus('loading');
    try {
      await addDoc(collection(db, 'quotes'), {
        listingId:       listing.id,
        listingTitle:    listing.title,
        listingPrice:    listing.price,
        listingCategory: listing.category,
        customerName:    form.name.trim(),
        customerPhone:   form.phone.trim(),
        customerEmail:   form.email.trim(),
        message:         form.message.trim(),
        quoteType:       type,
        firmName:        listing.firmName,
        status:          'new',
        olusturmaTarihi: serverTimestamp(),
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
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className={`sticky top-0 z-10 border-b px-6 py-4 flex items-center justify-between rounded-t-2xl ${
          isSecond ? 'bg-amber-50 border-amber-100' : 'bg-white border-gray-100'
        }`}>
          <div>
            <h2 className="text-lg font-bold text-gray-800">
              {isSecond ? '2. Firmadan Teklif Al' : 'Teklif Al'}
            </h2>
            {isSecond && (
              <p className="text-xs text-amber-700 mt-0.5">
                Farklı bir firmadan da fiyat karşılaştırması yapın
              </p>
            )}
          </div>
          <button onClick={onClose} aria-label="Kapat" className="p-2 hover:bg-gray-100 rounded-full transition">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* İlan bilgisi */}
        <div className={`px-6 py-4 border-b ${isSecond ? 'bg-amber-50 border-amber-100' : 'bg-emerald-50 border-emerald-100'}`}>
          <p className="font-semibold text-gray-800 text-sm">{listing.title}</p>
          <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{listing.location}</span>
            <span className={`font-bold ${isSecond ? 'text-amber-600' : 'text-emerald-600'}`}>{listing.price}</span>
          </div>
          {isSecond && (
            <p className="mt-2 text-xs text-amber-800 bg-amber-100 rounded-lg px-3 py-2">
              💡 Birden fazla firmadan teklif alarak en uygun fiyatı ve en iyi hizmeti bulun.
            </p>
          )}
        </div>

        {/* Form veya başarı */}
        {status === 'success' ? (
          <div className="px-6 py-14 text-center">
            <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Talebiniz Alındı!</h3>
            <p className="text-gray-500 text-sm">En kısa sürede sizinle iletişime geçilecek.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">
            {/* Ad Soyad */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ad Soyad <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="Adınız Soyadınız"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              {errors.name && <p className="mt-1 text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.name}</p>}
            </div>

            {/* Telefon */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefon <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                placeholder="05XX XXX XX XX"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              {errors.phone && <p className="mt-1 text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.phone}</p>}
            </div>

            {/* E-posta */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                placeholder="ornek@email.com"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Mesaj */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mesajınız</label>
              <textarea
                value={form.message}
                onChange={(e) => set('message', e.target.value)}
                rows={3}
                placeholder="Özel isteğiniz veya sormak istedikleriniz…"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              />
            </div>

            {/* KVKK */}
            <div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.kvkk}
                  onChange={(e) => set('kvkk', e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-emerald-600 border-gray-300 focus:ring-emerald-500"
                />
                <span className="text-xs text-gray-600 leading-relaxed">
                  Kişisel verilerimin{' '}
                  <Link to="/kvkk" target="_blank" className="text-emerald-600 hover:underline font-medium">
                    Aydınlatma Metni
                  </Link>{' '}
                  çerçevesinde işlenmesini ve teklif hazırlanması amacıyla ilgili firmaya
                  aktarılmasını onaylıyorum. <span className="text-red-500">*</span>
                </span>
              </label>
              {errors.kvkk && <p className="mt-1 text-xs text-red-600 flex items-center gap-1 ml-7"><AlertCircle className="w-3 h-3" />{errors.kvkk}</p>}
            </div>

            {status === 'error' && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-4 py-3 rounded-lg">
                <AlertCircle className="w-4 h-4" />Bir hata oluştu. Lütfen tekrar deneyin.
              </div>
            )}

            <button
              type="submit"
              disabled={status === 'loading'}
              className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition disabled:opacity-60 ${
                isSecond
                  ? 'bg-amber-500 hover:bg-amber-600 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
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
   Benzer İlanlar
══════════════════════════════════════════════════════════ */

function SimilarCard({ deal, onQuote }: { deal: FlashDeal; onQuote: (d: FlashDeal) => void }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md transition flex flex-col">
      <Link to={`/ilan/${deal.id}`} className="block">
        <div className="relative h-44">
          <img src={deal.image} alt={deal.title} loading="lazy" className="w-full h-full object-cover" />
          {deal.urgent && (
            <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">
              ACİL
            </span>
          )}
          {deal.discount && (
            <span className="absolute top-2 right-2 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">
              %{deal.discount} İND.
            </span>
          )}
        </div>
      </Link>
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center gap-1.5 mb-2">
          <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${CAT_COLORS[deal.category] ?? 'bg-gray-100 text-gray-600'}`}>
            <Tag className="w-2.5 h-2.5" />{deal.category}
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
            <MapPin className="w-2.5 h-2.5" />{deal.location}
          </span>
        </div>
        <Link to={`/ilan/${deal.id}`} className="font-semibold text-gray-800 text-sm leading-snug line-clamp-2 hover:text-emerald-600 transition mb-3 flex-1">
          {deal.title}
        </Link>
        <div className="flex items-center justify-between mt-auto">
          <div>
            <p className="text-emerald-600 font-bold text-base">{deal.price}</p>
            {deal.originalPrice && (
              <p className="text-xs text-gray-400 line-through">{deal.originalPrice}</p>
            )}
          </div>
          <button
            onClick={() => onQuote(deal)}
            className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 transition font-medium"
          >
            Teklif Al
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   Ana Sayfa Bileşeni
══════════════════════════════════════════════════════════ */

export default function IlanDetayPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addFirm, isInSepet, isFull, openDrawer } = useTeklifSepet();

  const listing = FLASH_DEALS.find((d) => d.id === Number(id));

  /* Galeri state */
  const [activeImg, setActiveImg] = useState(0);

  /* Telefon göster/gizle */
  const [showPhone, setShowPhone] = useState(false);

  /* Teklif modalı */
  const [modal, setModal] = useState<{ open: boolean; type: 'primary' | 'secondary' }>({
    open: false, type: 'primary',
  });

  /* Benzer modal (benzer ilanlar için) */
  const [similarModal, setSimilarModal] = useState<{
    open: boolean; deal: FlashDeal | null;
  }>({ open: false, deal: null });

  /* TeklifSepeti — sepete eklendi feedback */
  const [sepetFeedback, setSepetFeedback] = useState<'idle' | 'added'>('idle');

  if (!listing) {
    return (
      <>
        <Header />
        <main className="min-h-[60vh] flex items-center justify-center bg-gray-50">
          <div className="text-center px-4">
            <p className="text-5xl font-bold text-gray-200 mb-4">404</p>
            <h1 className="text-xl font-semibold text-gray-700 mb-2">İlan bulunamadı</h1>
            <p className="text-gray-500 mb-6">Bu ilan kaldırılmış veya mevcut değil.</p>
            <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-2.5 rounded-lg hover:bg-emerald-700 transition font-medium">
              <ArrowLeft className="w-4 h-4" /> Geri Dön
            </button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  /* Kategori slug (breadcrumb linki için) */
  const catSlug = CATEGORIES.find((c) => c.name === listing.category)?.slug;

  /* Benzer ilanlar: aynı kategoriden, max 3 */
  const similar = FLASH_DEALS
    .filter((d) => d.id !== listing.id && d.category === listing.category)
    .slice(0, 3);
  const fallbackSimilar = similar.length > 0
    ? similar
    : FLASH_DEALS.filter((d) => d.id !== listing.id).slice(0, 3);

  /* Galeri navigasyonu */
  const prevImg = () => setActiveImg((i) => (i - 1 + listing.images.length) % listing.images.length);
  const nextImg = () => setActiveImg((i) => (i + 1) % listing.images.length);

  return (
    <>
      <Header />

      <main className="bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 py-8">

          {/* ── Breadcrumb ───────────────────────────────── */}
          <nav className="text-sm text-gray-500 mb-6 flex items-center gap-1.5 flex-wrap">
            <Link to="/" className="hover:text-emerald-600 transition">Ana Sayfa</Link>
            <span>/</span>
            {catSlug ? (
              <Link to={`/kategori/${catSlug}`} className="hover:text-emerald-600 transition">
                {listing.category}
              </Link>
            ) : (
              <span>{listing.category}</span>
            )}
            <span>/</span>
            <span className="text-gray-800 line-clamp-1">{listing.title}</span>
          </nav>

          {/* ── Ana İçerik Grid ──────────────────────────── */}
          <div className="flex flex-col lg:flex-row gap-7">

            {/* ════ SOL / MAIN BÖLÜM ════════════════════════ */}
            <div className="flex-1 min-w-0 space-y-5">

              {/* Fotoğraf Galerisi */}
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                {/* Büyük Resim */}
                <div className="relative bg-gray-100 aspect-[16/9] sm:aspect-[16/9] max-h-[480px]">
                  <img
                    src={listing.images[activeImg]}
                    alt={`${listing.title} — görsel ${activeImg + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {listing.urgent && (
                    <span className="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-lg shadow">
                      ACİL
                    </span>
                  )}
                  {listing.discount && (
                    <span className="absolute top-4 right-4 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-lg shadow">
                      %{listing.discount} İNDİRİM
                    </span>
                  )}
                  {/* Oklar */}
                  {listing.images.length > 1 && (
                    <>
                      <button
                        onClick={prevImg}
                        aria-label="Önceki görsel"
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow transition"
                      >
                        <ChevronLeft className="w-5 h-5 text-gray-700" />
                      </button>
                      <button
                        onClick={nextImg}
                        aria-label="Sonraki görsel"
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow transition"
                      >
                        <ChevronRight className="w-5 h-5 text-gray-700" />
                      </button>
                      {/* Sayaç */}
                      <span className="absolute bottom-3 right-4 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full">
                        {activeImg + 1} / {listing.images.length}
                      </span>
                    </>
                  )}
                </div>

                {/* Thumbnail'lar */}
                {listing.images.length > 1 && (
                  <div className="flex gap-2 p-3 overflow-x-auto">
                    {listing.images.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveImg(i)}
                        aria-label={`${i + 1}. görsel`}
                        className={`flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition ${
                          i === activeImg ? 'border-emerald-500 ring-1 ring-emerald-400' : 'border-transparent hover:border-gray-300'
                        }`}
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* İlan Başlığı ve Meta */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                {/* Badges */}
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${CAT_COLORS[listing.category] ?? 'bg-gray-100 text-gray-600'}`}>
                    <Tag className="w-3 h-3" />{listing.category}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                    <MapPin className="w-3 h-3" />{listing.location}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full">
                    <Calendar className="w-3 h-3" />{formatDate(listing.date)}
                  </span>
                  {listing.urgent && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">
                      <Zap className="w-3 h-3" />ACİL
                    </span>
                  )}
                </div>

                <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 leading-snug">
                  {listing.title}
                </h1>

                {/* Fiyat */}
                <div className="flex items-end gap-3">
                  <span className="text-3xl font-extrabold text-emerald-600">{listing.price}</span>
                  {listing.originalPrice && (
                    <>
                      <span className="text-lg text-gray-400 line-through">{listing.originalPrice}</span>
                      {listing.discount && (
                        <span className="text-sm font-bold text-white bg-amber-500 px-2 py-0.5 rounded-lg">
                          %{listing.discount} İndirim
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Açıklama */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-base font-bold text-gray-800 mb-3">İlan Açıklaması</h2>
                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                  {listing.description}
                </p>
              </div>

              {/* Özellikler Tablosu */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-base font-bold text-gray-800 mb-4">Teknik Özellikler</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-0 divide-y sm:divide-y-0">
                  {listing.features.map((f, i) => (
                    <div
                      key={f.label}
                      className={`flex items-center justify-between py-3 text-sm ${
                        i % 2 === 0 ? '' : 'sm:border-l sm:pl-8 sm:border-gray-100'
                      } border-gray-100`}
                    >
                      <span className="text-gray-500">{f.label}</span>
                      <span className="font-semibold text-gray-800 text-right">{f.value}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* ════ SAĞ SIDEBAR ════════════════════════════ */}
            <div className="w-full lg:w-80 flex-shrink-0 space-y-4">

              {/* Firma Kartı */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Satıcı Firma</h3>
                <div className="flex items-center gap-3 mb-4">
                  {/* Logo placeholder */}
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-emerald-700 font-extrabold text-lg leading-none">
                      {listing.firmName.charAt(0)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-800 text-sm leading-snug">{listing.firmName}</p>
                    <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                      <MapPin className="w-3 h-3" />{listing.firmCity}
                    </span>
                  </div>
                  {listing.firmVerified && (
                    <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 ml-auto" aria-label="Doğrulanmış firma" />
                  )}
                </div>

                {listing.firmVerified ? (
                  <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 text-xs text-emerald-700 mb-4">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Doğrulanmış firma
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 text-xs text-amber-700 mb-4">
                    Onay sürecindeki firma
                  </div>
                )}

                {/* Puan placeholder */}
                <div className="flex items-center gap-1 text-xs text-gray-400 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-3.5 h-3.5 ${i < 4 ? 'text-amber-400 fill-amber-400' : 'text-gray-300 fill-gray-300'}`} />
                  ))}
                  <span className="ml-1">4.0</span>
                </div>

                {/* Telefon (göster/gizle) */}
                {showPhone ? (
                  <a
                    href={`tel:${listing.firmPhone.replace(/\s/g, '')}`}
                    className="flex items-center justify-center gap-2 w-full border border-emerald-300 text-emerald-700 bg-emerald-50 py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-100 transition mb-1"
                  >
                    <Phone className="w-4 h-4" />
                    {listing.firmPhone}
                  </a>
                ) : (
                  <button
                    onClick={() => setShowPhone(true)}
                    className="flex items-center justify-center gap-2 w-full border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:border-gray-300 hover:bg-gray-50 transition mb-1"
                  >
                    <Eye className="w-4 h-4" />
                    Telefonu Göster
                  </button>
                )}
                {showPhone && (
                  <button
                    onClick={() => setShowPhone(false)}
                    className="flex items-center justify-center gap-1 w-full text-xs text-gray-400 hover:text-gray-600 transition mt-1"
                  >
                    <EyeOff className="w-3 h-3" /> Gizle
                  </button>
                )}
              </div>

              {/* Teklif Butonları */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
                {/* Birincil Teklif */}
                <button
                  onClick={() => setModal({ open: true, type: 'primary' })}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-sm"
                >
                  <Send className="w-4 h-4" />
                  Teklif Al
                </button>

                {/* İkincil Teklif — TeklifSepeti entegrasyonu */}
                {isInSepet(listing.id) ? (
                  <button
                    onClick={openDrawer}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-sm"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Sepette ✓ — Görüntüle
                  </button>
                ) : isFull ? (
                  <button
                    onClick={openDrawer}
                    className="w-full bg-gray-100 text-gray-500 font-bold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-gray-200 transition"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    Sepet Dolu (2/2) — Görüntüle
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      const result = addFirm(listing);
                      if (result === 'added') {
                        setSepetFeedback('added');
                        setTimeout(() => setSepetFeedback('idle'), 2500);
                      }
                    }}
                    className={`w-full font-bold py-3.5 rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-sm ${
                      sepetFeedback === 'added'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-amber-500 hover:bg-amber-600 text-white'
                    }`}
                  >
                    {sepetFeedback === 'added' ? (
                      <><CheckCircle className="w-4 h-4" />Sepete Eklendi ✓</>
                    ) : (
                      <><Zap className="w-4 h-4" />2. Firmadan da Teklif Al</>
                    )}
                  </button>
                )}

                <p className="text-[11px] text-gray-400 text-center leading-relaxed px-1">
                  💡 Birden fazla firmadan teklif alarak en uygun fiyatı ve en iyi hizmeti karşılaştırın.
                </p>
              </div>

              {/* Güvenli Alışveriş Notları */}
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Güvenli Alışveriş
                </h3>
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

              {/* İlan ID */}
              <p className="text-center text-xs text-gray-300">İlan No: #{listing.id.toString().padStart(6, '0')}</p>
            </div>
          </div>

          {/* ── Benzer İlanlar ───────────────────────────── */}
          {fallbackSimilar.length > 0 && (
            <div className="mt-12">
              <h2 className="text-xl font-bold text-gray-800 mb-5">
                {similar.length > 0 ? 'Benzer İlanlar' : 'Diğer İlanlar'}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {fallbackSimilar.map((deal) => (
                  <SimilarCard
                    key={deal.id}
                    deal={deal}
                    onQuote={(d) => setSimilarModal({ open: true, deal: d })}
                  />
                ))}
              </div>
            </div>
          )}

        </div>
      </main>

      <Footer />

      {/* Teklif Modalları */}
      {modal.open && (
        <QuoteModal
          listing={listing}
          type={modal.type}
          onClose={() => setModal({ open: false, type: 'primary' })}
        />
      )}

      {similarModal.open && similarModal.deal && (
        <QuoteModal
          listing={similarModal.deal}
          type="primary"
          onClose={() => setSimilarModal({ open: false, deal: null })}
        />
      )}
    </>
  );
}
