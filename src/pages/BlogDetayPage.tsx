import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Calendar, Clock, ChevronRight, Share2, MessageSquare, Check, ArrowLeft, Info, AlertTriangle, EyeOff } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { BLOG_POSTS, type BlogKategori } from '../data/blogPosts';
import { toast } from 'sonner';
import SEOMeta from '../components/SEOMeta';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

/* ── Kategori renkleri ──────────────────────────────────────── */
const KAT_COLORS: Record<BlogKategori, string> = {
  'prefabrik':  'bg-emerald-100 text-emerald-700',
  'celik-yapi': 'bg-gray-200   text-gray-700',
  'konteyner':  'bg-blue-100   text-blue-700',
  'tiny-house': 'bg-purple-100 text-purple-700',
  'genel':      'bg-amber-100  text-amber-700',
};

const KAT_LABELS: Record<BlogKategori, string> = {
  'prefabrik':  'Prefabrik',
  'celik-yapi': 'Çelik Yapı',
  'konteyner':  'Konteyner',
  'tiny-house': 'Tiny House',
  'genel':      'Genel',
};

function formatTarih(tarih: string) {
  return new Date(tarih).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
}

/* ── İçerik renderer: \n\n paragraflar, ## başlık, - liste ─── */
function renderIcerik(icerik: string) {
  const blocks = icerik.trim().split(/\n\n+/);
  return blocks.map((block, i) => {
    if (block.startsWith('## ')) {
      return (
        <h2 key={i} className="text-xl font-bold text-gray-800 mt-8 mb-3">
          {block.slice(3)}
        </h2>
      );
    }
    const lines = block.split('\n');
    const isUl  = lines.every((l) => l.startsWith('- '));
    if (isUl) {
      return (
        <ul key={i} className="list-disc list-inside space-y-1.5 text-gray-700 text-sm leading-relaxed">
          {lines.map((l, j) => <li key={j}>{l.slice(2)}</li>)}
        </ul>
      );
    }
    return (
      <p key={i} className="text-gray-700 text-sm leading-relaxed">
        {block}
      </p>
    );
  });
}

/* ── Component ──────────────────────────────────────────────── */
export default function BlogDetayPage() {
  const { slug }     = useParams<{ slug: string }>();
  const navigate     = useNavigate();
  const [copied, setCopied] = useState(false);
  const [blogSetting, setBlogSetting] = useState<{
    fiyatBilgisi:  string;
    oneCikanBilgi: string;
    uyariMetni:    string;
    ekMetin:       string;
    yayinda:       boolean;
    guncelleme:    { toDate: () => Date } | null;
  } | null>(null);

  useEffect(() => {
    if (!slug) return;
    getDoc(doc(db, 'blogSettings', slug)).then((snap) => {
      if (snap.exists()) {
        setBlogSetting(snap.data() as {
          fiyatBilgisi: string; oneCikanBilgi: string; uyariMetni: string;
          ekMetin: string; yayinda: boolean; guncelleme: { toDate: () => Date } | null;
        });
      }
    });
  }, [slug]);

  const post    = BLOG_POSTS.find((p) => p.slug === slug);
  const related = BLOG_POSTS.filter((p) => p.id !== post?.id && p.kategori === post?.kategori).slice(0, 3);

  if (!post) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 flex items-center justify-center text-center px-4">
          <div>
            <p className="text-6xl font-bold text-gray-200 mb-4">404</p>
            <p className="text-gray-500 mb-6">Bu blog yazısı bulunamadı.</p>
            <Link to="/blog" className="text-emerald-600 hover:underline font-medium">← Blog'a dön</Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const pageUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      toast.success('Bağlantı kopyalandı!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Kopyalama başarısız.');
    }
  };

  const waUrl = `https://wa.me/?text=${encodeURIComponent(post.baslik + ' ' + pageUrl)}`;
  const twUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(post.baslik)}&url=${encodeURIComponent(pageUrl)}`;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <SEOMeta
        title={post.baslik}
        description={post.ozet}
        image={post.kapakGorseli}
        url={`/blog/${post.slug}`}
        type="article"
      />

      <main className="flex-1 bg-gray-50">

        {/* ── Hero / kapak ─────────────────────────────── */}
        <div className="relative h-56 md:h-72 bg-gray-800 overflow-hidden">
          <img
            src={post.kapakGorseli}
            alt={post.baslik}
            className="absolute inset-0 w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

          <div className="relative max-w-7xl mx-auto px-4 h-full flex flex-col justify-end pb-6">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 text-white/70 text-xs mb-3">
              <Link to="/"    className="hover:text-white transition">Ana Sayfa</Link>
              <ChevronRight className="w-3 h-3" />
              <Link to="/blog" className="hover:text-white transition">Blog</Link>
              <ChevronRight className="w-3 h-3" />
              <span className="text-white line-clamp-1">{post.baslik}</span>
            </nav>
            <span className={`self-start text-xs font-semibold px-2.5 py-1 rounded-full mb-2 ${KAT_COLORS[post.kategori]}`}>
              {KAT_LABELS[post.kategori]}
            </span>
            <h1 className="text-xl md:text-3xl font-bold text-white leading-snug max-w-3xl">
              {post.baslik}
            </h1>
          </div>
        </div>

        {/* ── İçerik + Sidebar ─────────────────────────── */}
        <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
          <div className="flex flex-col lg:flex-row gap-8">

            {/* Sol: Makale */}
            <article className="flex-1 min-w-0 bg-white rounded-2xl border border-gray-200 p-6 md:p-8">

              {/* Meta bar */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 mb-6 pb-6 border-b border-gray-100">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatTarih(post.tarih)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {post.okumaSuresi} dk okuma
                </span>
                <span className="font-medium text-gray-500">{post.yazar}</span>

                {/* Paylaş */}
                <div className="flex items-center gap-2 ml-auto">
                  <span className="text-gray-400 hidden sm:inline text-xs">Paylaş:</span>
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="WhatsApp'ta paylaş"
                    className="w-7 h-7 bg-green-500 text-white rounded-full flex items-center justify-center hover:bg-green-600 transition"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href={twUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Twitter'da paylaş"
                    className="w-7 h-7 bg-sky-500 text-white rounded-full flex items-center justify-center hover:bg-sky-600 transition"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={handleCopy}
                    aria-label="Bağlantıyı kopyala"
                    className="w-7 h-7 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center hover:bg-gray-200 transition"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Yayında değil uyarısı */}
              {blogSetting && blogSetting.yayinda === false && (
                <div className="flex items-center gap-2 mb-5 rounded-xl border border-orange-300 bg-orange-50 px-4 py-3">
                  <EyeOff className="w-4 h-4 text-orange-500 flex-shrink-0" />
                  <p className="text-sm font-medium text-orange-700">Bu yazı şu an yayında değil.</p>
                </div>
              )}

              {/* Özet */}
              <p className="text-base text-gray-600 font-medium leading-relaxed mb-6 italic border-l-4 border-emerald-400 pl-4">
                {post.ozet}
              </p>

              {/* Öne çıkan bilgi kutusu */}
              {blogSetting?.oneCikanBilgi && (
                <div className="flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 mb-4">
                  <Info className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-emerald-800 leading-relaxed whitespace-pre-line">{blogSetting.oneCikanBilgi}</p>
                </div>
              )}

              {/* Uyarı kutusu */}
              {blogSetting?.uyariMetni && (
                <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 mb-4">
                  <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-800 leading-relaxed whitespace-pre-line">{blogSetting.uyariMetni}</p>
                </div>
              )}

              {/* İçerik */}
              <div className="space-y-4">
                {renderIcerik(post.icerik)}
              </div>

              {/* Güncel fiyat bilgisi (Firestore override) */}
              {blogSetting?.fiyatBilgisi && (
                <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4">
                  <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">Güncel Fiyat Bilgisi</p>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{blogSetting.fiyatBilgisi}</p>
                  {blogSetting.guncelleme && (
                    <p className="text-xs text-gray-400 mt-3 border-t border-blue-100 pt-2">
                      Fiyat bilgileri {blogSetting.guncelleme.toDate().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })} tarihinde güncellendi.
                    </p>
                  )}
                </div>
              )}

              {/* Ek metin */}
              {blogSetting?.ekMetin && (
                <p className="mt-4 text-sm text-gray-700 leading-relaxed whitespace-pre-line">{blogSetting.ekMetin}</p>
              )}

              {/* Alt navigasyon */}
              <div className="mt-10 pt-6 border-t border-gray-100 flex items-center gap-3">
                <button
                  onClick={() => navigate(-1)}
                  className="flex items-center gap-2 text-sm text-gray-500 hover:text-emerald-600 transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Geri
                </button>
                <Link
                  to="/blog"
                  className="text-sm text-emerald-600 hover:underline font-medium"
                >
                  Tüm yazılar →
                </Link>
              </div>
            </article>

            {/* Sağ: Sidebar */}
            <aside className="w-full lg:w-72 flex-shrink-0 space-y-5">

              {/* CTA */}
              <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-2xl p-5 text-white sticky top-4">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-3">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base mb-1">Bu yazıyı beğendiyseniz</h3>
                <p className="text-emerald-100 text-sm mb-4 leading-relaxed">
                  Uzman firmalardan ücretsiz teklif alın ve projenizi hayata geçirin.
                </p>
                <Link
                  to="/talep-olustur"
                  className="block w-full bg-amber-400 hover:bg-amber-300 text-amber-900 font-bold py-2.5 rounded-xl text-center text-sm transition"
                >
                  Ücretsiz Teklif Al
                </Link>
                <Link
                  to={`/kategori/${post.kategori === 'celik-yapi' ? 'celik-yapilar' : post.kategori === 'tiny-house' ? 'tiny-house' : post.kategori === 'konteyner' ? 'yasam-konteynerleri' : 'prefabrik'}`}
                  className="block w-full mt-2 border border-white/30 text-white text-center py-2.5 rounded-xl text-sm hover:bg-white/10 transition"
                >
                  İlanları Gör
                </Link>
              </div>

              {/* İlgili yazılar */}
              {related.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                  <h3 className="font-bold text-gray-800 text-sm mb-4">İlgili Yazılar</h3>
                  <div className="space-y-3">
                    {related.map((p) => (
                      <Link
                        key={p.id}
                        to={`/blog/${p.slug}`}
                        className="flex gap-3 group"
                      >
                        <img
                          src={p.kapakGorseli}
                          alt={p.baslik}
                          className="w-16 h-14 object-cover rounded-lg flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-gray-800 group-hover:text-emerald-700 transition line-clamp-2 leading-snug">
                            {p.baslik}
                          </p>
                          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {p.okumaSuresi} dk
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Kategori linkleri */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <h3 className="font-bold text-gray-800 text-sm mb-3">Kategorilere Göz At</h3>
                <div className="flex flex-wrap gap-2">
                  {(['prefabrik', 'celik-yapi', 'konteyner', 'tiny-house', 'genel'] as BlogKategori[]).map((k) => (
                    <Link
                      key={k}
                      to={`/blog`}
                      onClick={() => {}}
                      className={`text-xs font-medium px-3 py-1 rounded-full transition hover:opacity-80 ${KAT_COLORS[k]}`}
                    >
                      {KAT_LABELS[k]}
                    </Link>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}
