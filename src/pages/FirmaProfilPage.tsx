import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { CATEGORIES } from '../data/categories';
import { formatFiyat, type Ilan } from '../hooks/useIlanlar';
import SEOMeta from '../components/SEOMeta';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import {
  ShieldCheck, MapPin, Tag, Star, Send, Building2, Globe,
  MessageCircle, Clock, Factory, Store, Package, Calendar,
  Hash, ChevronRight, AlertCircle, ArrowLeft, ThumbsUp,
} from 'lucide-react';

/* ── Firma tipi (Firestore firms koleksiyonu) ───────────────── */
interface Firma {
  id:               string;
  name:             string;
  firmaType?:       'uretici' | 'satici' | '';
  vergiNo?:         string;
  firmaYapisi?:     string;
  phone?:           string;
  eposta?:          string;
  website?:         string;
  whatsapp?:        string;
  city?:            string;
  sehir?:           string;
  ilce?:            string;
  category?:        string;
  kategoriler?:     string[];
  hizmetBolgeleri?: string[];
  tanitimMetni?:    string;
  status:           'pending' | 'approved' | 'rejected';
  verified:         boolean;
  olusturmaTarihi?: { seconds: number } | null;
}

/* ── Yorum tipi ──────────────────────────────────────────────── */
interface Yorum {
  id: string;
  firmaId: string;
  userId: string;
  userName: string;
  puan: number;
  yorum: string;
  tarih: { seconds: number; nanoseconds: number } | null;
  onaylandi: boolean;
}

/* ── Helpers ─────────────────────────────────────────────────── */
const CAT_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.slug, c.name]));

function maskVergiNo(vn: string): string {
  if (!vn || vn.length < 4) return '**********';
  return vn.slice(0, 2) + '*'.repeat(vn.length - 4) + vn.slice(-2);
}

function formatDate(ts: { seconds: number } | null | undefined): string {
  if (!ts) return '—';
  return new Date(ts.seconds * 1000).toLocaleDateString('tr-TR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

/* ── Yıldız puanı (header için — beyaz tema) ─────────────────── */
function Stars({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${
            i < Math.round(rating)
              ? 'text-amber-400 fill-amber-400'
              : 'text-white/30 fill-white/20'
          }`}
        />
      ))}
      <span className="ml-1.5 text-sm font-semibold text-white/90">
        {count > 0 ? `${rating.toFixed(1)} (${count} yorum)` : 'Henüz yorum yok'}
      </span>
    </div>
  );
}

/* ── Yıldız puanı (kart için — koyu tema) ────────────────────── */
function StarsLight({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${
            i < Math.round(rating)
              ? 'text-amber-400 fill-amber-400'
              : 'text-gray-200 fill-gray-200'
          }`}
        />
      ))}
      {count > 0 && (
        <span className="ml-1 text-xs text-gray-500">{rating.toFixed(1)} ({count})</span>
      )}
    </div>
  );
}

/* ── Yıldız seçici (form) ────────────────────────────────────── */
function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          aria-label={`${n} yıldız`}
        >
          <Star
            className={`w-7 h-7 transition ${
              (hover || value) >= n
                ? 'text-amber-400 fill-amber-400'
                : 'text-gray-300 fill-gray-100'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

/* ── İlan kartı ─────────────────────────────────────────────── */
function IlanCard({ ilan }: { ilan: Ilan }) {
  return (
    <Link
      to={`/ilan/${ilan.id}`}
      className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl hover:border-emerald-200 hover:bg-emerald-50/50 transition group"
    >
      {ilan.gorseller?.[0] ? (
        <img
          src={ilan.gorseller[0]}
          alt={ilan.baslik}
          className="w-16 h-14 object-cover rounded-lg flex-shrink-0"
          loading="lazy"
        />
      ) : (
        <div className="w-16 h-14 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center">
          <Package className="w-5 h-5 text-gray-300" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 line-clamp-1 group-hover:text-emerald-600 transition">
          {ilan.baslik}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">{ilan.sehir}</p>
        <p className="text-sm font-bold text-emerald-600 mt-1">{formatFiyat(ilan.fiyat)}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 group-hover:text-emerald-500 transition" />
    </Link>
  );
}

/* ── Ana bileşen ─────────────────────────────────────────────── */
export default function FirmaProfilPage() {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();

  const [firma,    setFirma]    = useState<Firma | null>(null);
  const [ilanlar,  setIlanlar]  = useState<Ilan[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [notFound, setNotFound] = useState(false);

  /* Yorum state */
  const [yorumlar,    setYorumlar]    = useState<Yorum[]>([]);
  const [puan,        setPuan]        = useState(0);
  const [yorumMetni,  setYorumMetni]  = useState('');
  const [yorumLoading, setYorumLoading] = useState(false);


  /* Firma verisini çek */
  useEffect(() => {
    if (!id) { setNotFound(true); setLoading(false); return; }
    getDoc(doc(db, 'firms', id))
      .then((snap) => {
        if (!snap.exists()) {
          setNotFound(true);
        } else {
          setFirma({ id: snap.id, ...snap.data() } as Firma);
        }
        setLoading(false);
      })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [id]);

  /* Bu firmaya ait aktif ilanları çek */
  useEffect(() => {
    if (!id) return;
    const q = query(collection(db, 'ilanlar'), where('firmaId', '==', id));
    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as Ilan))
        .filter((d) => d.status === 'aktif');
      setIlanlar(docs);
    });
    return unsub;
  }, [id]);

  /* Bu firmaya ait yorumları çek */
  useEffect(() => {
    if (!id) return;
    const q = query(collection(db, 'yorumlar'), where('firmaId', '==', id));
    const unsub = onSnapshot(q, (snap) => {
      setYorumlar(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Yorum)));
    });
    return unsub;
  }, [id]);

  /* Yorum gönder */
  async function handleYorumGonder(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUser) { toast.error('Yorum yazmak için giriş yapınız.'); return; }
    if (puan === 0) { toast.error('Lütfen puan seçiniz.'); return; }
    if (yorumMetni.trim().length < 10) { toast.error('Yorum en az 10 karakter olmalıdır.'); return; }
    setYorumLoading(true);
    try {
      await addDoc(collection(db, 'yorumlar'), {
        firmaId:   id,
        userId:    currentUser.uid,
        userName:  currentUser.displayName || currentUser.email?.split('@')[0] || 'Kullanıcı',
        puan,
        yorum:     yorumMetni.trim(),
        tarih:     serverTimestamp(),
        onaylandi: false,
      });
      setPuan(0);
      setYorumMetni('');
      toast.success('Yorumunuz alındı! Onaylandıktan sonra yayınlanacak.');
    } catch {
      toast.error('Yorum gönderilemedi. Lütfen tekrar deneyin.');
    } finally {
      setYorumLoading(false);
    }
  }

  /* ── Loading ──────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  /* ── 404 ──────────────────────────────────────────────────── */
  if (notFound || !firma) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-4 py-20">
          <AlertCircle className="w-12 h-12 text-gray-300" />
          <h1 className="text-xl font-bold text-gray-700">Firma Bulunamadı</h1>
          <p className="text-gray-500 text-sm max-w-xs">
            Bu firma mevcut değil veya henüz onaylanmamış olabilir.
          </p>
          <Link
            to="/firmalar-harita"
            className="flex items-center gap-2 text-emerald-600 hover:underline text-sm font-medium mt-2"
          >
            <ArrowLeft className="w-4 h-4" /> Tüm Firmalara Dön
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  /* ── Hesaplanan değerler ──────────────────────────────────── */
  const onayliYorumlar = yorumlar.filter((y) => y.onaylandi);
  const avgPuan = onayliYorumlar.length > 0
    ? onayliYorumlar.reduce((s, y) => s + y.puan, 0) / onayliYorumlar.length
    : 0;
  const kullaniciYorumYapti = currentUser
    ? yorumlar.some((y) => y.userId === currentUser.uid)
    : false;

  const firmaAdi    = firma.name || 'İsimsiz Firma';
  const firmaHarfi  = firmaAdi.charAt(0).toUpperCase();
  const sehir       = firma.city || firma.sehir || '';
  const kategoriler = Array.isArray(firma.kategoriler) ? firma.kategoriler : [];
  const bolgeler    = Array.isArray(firma.hizmetBolgeleri) ? firma.hizmetBolgeleri : [];
  const ilkKategori = kategoriler[0] || firma.category || '';

  const seoDesc = firma.tanitimMetni
    ? firma.tanitimMetni.slice(0, 160)
    : `${firma.name} — ${sehir ? sehir + ' ' : ''}${ilkKategori ? (CAT_MAP[ilkKategori] || ilkKategori) + ' ' : ''}firması. ModülerPazar'da ilanları ve iletişim bilgileri.`;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <SEOMeta
        title={firma.name}
        description={seoDesc}
        url={`/firma/${id}`}
      />
      <Header />

      <main className="flex-1">

        {/* ══ KAPAK ════════════════════════════════════════════ */}
        <div className="bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600 text-white">
          <div className="max-w-7xl mx-auto px-4 py-10 md:py-14">

            {/* Breadcrumb */}
            <nav className="text-xs text-white/60 mb-6 flex items-center gap-1.5">
              <Link to="/" className="hover:text-white transition">Ana Sayfa</Link>
              <span>/</span>
              <Link to="/firmalar-harita" className="hover:text-white transition">Firmalar</Link>
              <span>/</span>
              <span className="text-white/90 truncate max-w-[160px]">{firmaAdi}</span>
            </nav>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">

              {/* Avatar */}
              <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur border-2 border-white/30 flex items-center justify-center flex-shrink-0 shadow-lg">
                <span className="text-3xl font-extrabold text-white">{firmaHarfi}</span>
              </div>

              {/* Bilgiler */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-2xl md:text-3xl font-bold leading-tight">{firmaAdi}</h1>
                  {firma.verified && (
                    <span className="inline-flex items-center gap-1 bg-white/20 border border-white/30 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                      <ShieldCheck className="w-3.5 h-3.5" /> Doğrulanmış
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 text-sm text-white/80 mb-3 mt-1">
                  {sehir && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {sehir}{firma.ilce ? `, ${firma.ilce}` : ''}
                    </span>
                  )}
                  {ilkKategori && (
                    <span className="flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5" />
                      {CAT_MAP[ilkKategori] || ilkKategori}
                    </span>
                  )}
                  {firma.olusturmaTarihi && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(firma.olusturmaTarihi.seconds * 1000).getFullYear()}'den beri
                    </span>
                  )}
                </div>

                <Stars rating={avgPuan} count={onayliYorumlar.length} />
              </div>

              {/* Teklif İste */}
              <Link
                to={`/talep-olustur?firma=${id}`}
                className="flex-shrink-0 flex items-center gap-2 bg-white text-emerald-700 font-bold px-5 py-2.5 rounded-xl hover:bg-emerald-50 transition shadow-sm text-sm whitespace-nowrap"
              >
                <Send className="w-4 h-4" /> Teklif İste
              </Link>
            </div>
          </div>
        </div>

        {/* ══ İÇERİK ══════════════════════════════════════════ */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row gap-6">

            {/* ── Sol Kolon (geniş) ──────────────────────────── */}
            <div className="flex-1 min-w-0 space-y-6">

              {/* Hakkımızda */}
              {firma.tanitimMetni ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h2 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-600" /> Hakkımızda
                  </h2>
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                    {firma.tanitimMetni}
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h2 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-600" /> Hakkımızda
                  </h2>
                  <p className="text-sm text-gray-400 italic">
                    Firma henüz tanıtım metni eklememiş.
                  </p>
                </div>
              )}

              {/* Hizmet Kategorileri */}
              {kategoriler.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h2 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <Tag className="w-4 h-4 text-emerald-600" /> Hizmet Kategorileri
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {kategoriler.map((slug) => (
                      <Link
                        key={slug}
                        to={`/kategori/${slug}`}
                        className="inline-flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100 transition"
                      >
                        {CAT_MAP[slug] || slug}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Hizmet Bölgeleri */}
              {bolgeler.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h2 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-600" /> Hizmet Bölgeleri
                  </h2>
                  <div className="flex flex-wrap gap-1.5">
                    {bolgeler.map((bolge) => (
                      <span
                        key={bolge}
                        className="inline-block text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-600"
                      >
                        {bolge}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Aktif İlanlar */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Package className="w-4 h-4 text-emerald-600" />
                  Aktif İlanlar
                  {ilanlar.length > 0 && (
                    <span className="text-xs font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                      {ilanlar.length}
                    </span>
                  )}
                </h2>
                {ilanlar.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">Henüz aktif ilan yok.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {ilanlar.map((ilan) => (
                      <IlanCard key={ilan.id} ilan={ilan} />
                    ))}
                  </div>
                )}
              </div>

              {/* Yorumlar & Değerlendirmeler */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <ThumbsUp className="w-4 h-4 text-emerald-600" />
                  Müşteri Değerlendirmeleri
                  {onayliYorumlar.length > 0 && (
                    <span className="text-xs font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                      {avgPuan.toFixed(1)} / 5
                    </span>
                  )}
                </h2>

                {/* Onaylı yorum listesi */}
                {onayliYorumlar.length === 0 ? (
                  <p className="text-sm text-gray-400 italic mb-4">Henüz onaylı değerlendirme yok.</p>
                ) : (
                  <div className="space-y-4 mb-6">
                    {onayliYorumlar
                      .slice()
                      .sort((a, b) => (b.tarih?.seconds ?? 0) - (a.tarih?.seconds ?? 0))
                      .map((y) => (
                        <div key={y.id} className="border border-gray-100 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-semibold text-gray-800">{y.userName}</p>
                            <p className="text-xs text-gray-400">
                              {y.tarih
                                ? new Date(y.tarih.seconds * 1000).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })
                                : ''}
                            </p>
                          </div>
                          <StarsLight rating={y.puan} count={0} />
                          <p className="text-sm text-gray-600 mt-2 leading-relaxed">{y.yorum}</p>
                        </div>
                      ))}
                  </div>
                )}

                {/* Yorum formu */}
                {currentUser ? (
                  kullaniciYorumYapti ? (
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-sm text-emerald-700 font-medium">
                      Değerlendirmeniz alındı, onay bekliyor. Teşekkürler!
                    </div>
                  ) : (
                    <form onSubmit={handleYorumGonder} className="border-t border-gray-100 pt-4">
                      <p className="text-sm font-semibold text-gray-700 mb-3">Değerlendirme Yaz</p>
                      <div className="mb-3">
                        <label className="block text-xs text-gray-500 mb-1">Puanınız</label>
                        <StarPicker value={puan} onChange={setPuan} />
                      </div>
                      <div className="mb-3">
                        <label className="block text-xs text-gray-500 mb-1">Yorumunuz</label>
                        <textarea
                          value={yorumMetni}
                          onChange={(e) => setYorumMetni(e.target.value)}
                          rows={3}
                          placeholder="Bu firma hakkındaki deneyiminizi paylaşın…"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={yorumLoading}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition disabled:opacity-60"
                      >
                        {yorumLoading ? 'Gönderiliyor…' : 'Değerlendirmeyi Gönder'}
                      </button>
                    </form>
                  )
                ) : (
                  <div className="border-t border-gray-100 pt-4">
                    <Link
                      to="/giris"
                      className="inline-flex items-center gap-1.5 text-sm text-emerald-600 hover:underline font-medium"
                    >
                      Değerlendirme yazmak için giriş yapın →
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* ── Sağ Kolon (dar) ────────────────────────────── */}
            <div className="w-full lg:w-72 xl:w-80 flex-shrink-0 space-y-4">

              {/* İletişim Kartı */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-bold text-gray-800 text-sm mb-4">İletişim</h3>

                <Link
                  to={`/talep-olustur?firma=${id}`}
                  className="flex items-center justify-center gap-2 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition text-sm shadow-sm"
                >
                  <Send className="w-4 h-4" /> Teklif İste
                </Link>

                {firma.whatsapp && (
                  <a
                    href={`https://wa.me/${firma.whatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full mt-2 border border-gray-200 text-gray-600 hover:border-green-300 hover:text-green-600 hover:bg-green-50 py-2.5 rounded-xl transition text-sm font-medium"
                  >
                    <MessageCircle className="w-4 h-4" /> WhatsApp ile Yaz
                  </a>
                )}

                {firma.website && (
                  <a
                    href={firma.website.startsWith('http') ? firma.website : `https://${firma.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full mt-2 border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 py-2.5 rounded-xl transition text-sm font-medium"
                  >
                    <Globe className="w-4 h-4" /> Web Sitesi
                  </a>
                )}

                <p className="text-xs text-gray-400 text-center mt-3 leading-relaxed">
                  Telefon ve e-posta bilgileri teklif talebinizden sonra iletilir.
                </p>
              </div>

              {/* Firma Detayları */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                <h3 className="font-bold text-gray-800 text-sm">Firma Detayları</h3>

                {/* Çalışma Saatleri */}
                <div className="flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Çalışma Saatleri</p>
                    <p className="text-sm text-gray-700 font-medium">Hafta içi 09:00 – 18:00</p>
                  </div>
                </div>

                {/* Satış Tipi */}
                {firma.firmaType && (
                  <div className="flex items-start gap-2.5">
                    {firma.firmaType === 'uretici'
                      ? <Factory className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      : <Store   className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    }
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Satış Tipi</p>
                      <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${
                        firma.firmaType === 'uretici'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {firma.firmaType === 'uretici' ? '🏭 Üretici' : '🏪 Satıcı / Bayi'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Vergi Numarası */}
                {firma.vergiNo && (
                  <div className="flex items-start gap-2.5">
                    <Hash className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Vergi Numarası</p>
                      <p className="text-sm text-gray-700 font-mono font-medium tracking-wider">
                        {maskVergiNo(firma.vergiNo)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Kayıt Tarihi */}
                {firma.olusturmaTarihi && (
                  <div className="flex items-start gap-2.5">
                    <Calendar className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Kayıt Tarihi</p>
                      <p className="text-sm text-gray-700 font-medium">
                        {formatDate(firma.olusturmaTarihi)}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Doğrulama Rozeti */}
              {firma.verified && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-800">Doğrulanmış Firma</p>
                    <p className="text-xs text-emerald-600 mt-0.5 leading-relaxed">
                      Vergi numarası ve kimlik bilgileri ModülerPazar tarafından doğrulanmıştır.
                    </p>
                  </div>
                </div>
              )}

              {/* Tüm Firmalara Dön */}
              <Link
                to="/firmalar-harita"
                className="flex items-center justify-center gap-2 w-full border border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700 py-2.5 rounded-xl transition text-xs font-medium"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Tüm Firmaları Gör
              </Link>
            </div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
