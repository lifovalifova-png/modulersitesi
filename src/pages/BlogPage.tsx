import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Calendar, ChevronRight } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEOMeta from '../components/SEOMeta';
import { BLOG_POSTS, type BlogKategori } from '../data/blogPosts';

/* ── Kategori renkleri ──────────────────────────────────────── */
const KAT_COLORS: Record<BlogKategori, string> = {
  'prefabrik':   'bg-emerald-100 text-emerald-700',
  'celik-yapi':  'bg-gray-200   text-gray-700',
  'konteyner':   'bg-blue-100   text-blue-700',
  'tiny-house':  'bg-purple-100 text-purple-700',
  'genel':       'bg-amber-100  text-amber-700',
};

const KAT_LABELS: Record<BlogKategori, string> = {
  'prefabrik':  'Prefabrik',
  'celik-yapi': 'Çelik Yapı',
  'konteyner':  'Konteyner',
  'tiny-house': 'Tiny House',
  'genel':      'Genel',
};

type FilterKey = 'hepsi' | BlogKategori;

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'hepsi',      label: 'Tümü' },
  { key: 'prefabrik',  label: 'Prefabrik' },
  { key: 'celik-yapi', label: 'Çelik Yapı' },
  { key: 'konteyner',  label: 'Konteyner' },
  { key: 'tiny-house', label: 'Tiny House' },
  { key: 'genel',      label: 'Genel' },
];

function formatTarih(tarih: string) {
  return new Date(tarih).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
}

/* ── Component ──────────────────────────────────────────────── */
export default function BlogPage() {
  const [activeFilter, setActiveFilter] = useState<FilterKey>('hepsi');

  const filtered = useMemo(() =>
    activeFilter === 'hepsi'
      ? BLOG_POSTS
      : BLOG_POSTS.filter((p) => p.kategori === activeFilter),
    [activeFilter],
  );

  return (
    <div className="flex flex-col min-h-screen">
      <SEOMeta
        title="Blog — Modüler Yapı Rehberi | ModülerPazar"
        description="Prefabrik ev, çelik yapı, konteyner ev ve tiny house hakkında uzman içerikler. Fiyatlar, ruhsatlar, karşılaştırmalar ve daha fazlası."
        url="/blog"
      />
      <Header />

      <main className="flex-1 bg-gray-50">

        {/* ── Hero ─────────────────────────────────────── */}
        <section className="bg-gradient-to-br from-emerald-700 to-emerald-900 text-white py-12 md:py-16">
          <div className="max-w-7xl mx-auto px-4">
            <nav className="flex items-center gap-2 text-emerald-200 text-sm mb-4">
              <Link to="/" className="hover:text-white transition">Ana Sayfa</Link>
              <ChevronRight className="w-4 h-4" />
              <span className="text-white">Blog</span>
            </nav>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">Modüler Yapı Rehberi</h1>
            <p className="text-emerald-100 text-base md:text-lg max-w-2xl">
              Prefabrik evler, çelik yapılar, konteyner evler ve tiny house hakkında kapsamlı rehberler ve güncel bilgiler.
            </p>
          </div>
        </section>

        {/* ── Filtreler ────────────────────────────────── */}
        <div className="bg-white border-b border-gray-200 sticky top-[var(--header-h,0)] z-10">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex gap-2 overflow-x-auto py-3 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setActiveFilter(f.key)}
                  className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition ${
                    activeFilter === f.key
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Grid ─────────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-4 py-10 md:py-14">
          {filtered.length === 0 ? (
            <p className="text-center text-gray-400 py-20">Bu kategoride henüz yazı bulunmuyor.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((post) => (
                <Link
                  key={post.id}
                  to={`/blog/${post.slug}`}
                  className="group bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-emerald-300 hover:shadow-md transition flex flex-col"
                >
                  {/* Kapak görseli */}
                  <div className="h-48 overflow-hidden bg-gray-100">
                    <img
                      src={post.kapakGorseli}
                      alt={post.baslik}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  {/* İçerik */}
                  <div className="p-5 flex flex-col flex-1">
                    {/* Kategori badge */}
                    <span className={`self-start text-xs font-semibold px-2.5 py-1 rounded-full mb-3 ${KAT_COLORS[post.kategori]}`}>
                      {KAT_LABELS[post.kategori]}
                    </span>

                    {/* Başlık */}
                    <h2 className="font-bold text-gray-800 text-base leading-snug mb-2 group-hover:text-emerald-700 transition line-clamp-2">
                      {post.baslik}
                    </h2>

                    {/* Özet */}
                    <p className="text-sm text-gray-500 leading-relaxed line-clamp-3 mb-4 flex-1">
                      {post.ozet}
                    </p>

                    {/* Meta */}
                    <div className="flex items-center justify-between text-xs text-gray-400 mt-auto pt-3 border-t border-gray-100">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatTarih(post.tarih)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {post.okumaSuresi} dk okuma
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

      </main>

      <Footer />
    </div>
  );
}
