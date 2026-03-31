import { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  type DocumentSnapshot,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { ExternalLink, Newspaper, Calendar, ChevronDown } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEOMeta from '../components/SEOMeta';
import { db } from '../lib/firebase';

/* ── Types ───────────────────────────────────────────────── */
interface Haber {
  id:        string;
  baslik:    string;
  kaynak:    string;
  kaynakUrl: string;
  ozet:      string;
  kategori:  string;
  bolge?:    string; /* 'turkiye' | 'dunya' */
  gorselUrl?: string;
  tarih:     { seconds: number; nanoseconds: number } | null;
  yayinda:   boolean;
}

/* ── Bölge Filtreleri ────────────────────────────────────── */
const BOLGELER = [
  { key: 'tumu',    label: 'Tümü'     },
  { key: 'turkiye', label: 'Türkiye'  },
  { key: 'dunya',   label: 'Dünyadan' },
];

const VARSAYILAN_GORSEL =
  'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&h=500&fit=crop';

/* ── Tarih formatı ───────────────────────────────────────── */
function formatTarih(tarih: Haber['tarih']): string {
  if (!tarih) return '';
  const d = new Date(tarih.seconds * 1000);
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
}

/* ── Haber Kartı ─────────────────────────────────────────── */
function HaberKart({ haber }: { haber: Haber }) {
  return (
    <article className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col group">
      {/* Görsel */}
      <div className="overflow-hidden h-48 bg-gray-100 flex-shrink-0">
        <img
          src={haber.gorselUrl || VARSAYILAN_GORSEL}
          alt={haber.baslik}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => { (e.target as HTMLImageElement).src = VARSAYILAN_GORSEL; }}
          loading="lazy"
        />
      </div>

      {/* İçerik */}
      <div className="p-5 flex flex-col flex-1">
        {/* Bölge chip */}
        <span className="inline-block text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full mb-3 self-start">
          {haber.bolge === 'dunya' ? '🌍 Dünyadan' : '🇹🇷 Türkiye'}
        </span>

        {/* Başlık */}
        <h2 className="font-bold text-gray-900 text-base leading-snug mb-2 line-clamp-2">
          {haber.baslik}
        </h2>

        {/* Kaynak + Tarih */}
        <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
          <span className="flex items-center gap-1 font-medium text-gray-600">
            <Newspaper className="w-3.5 h-3.5" aria-hidden="true" />
            {haber.kaynak}
          </span>
          {haber.tarih && (
            <>
              <span aria-hidden="true">•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                {formatTarih(haber.tarih)}
              </span>
            </>
          )}
        </div>

        {/* Özet */}
        <p className="text-sm text-gray-500 leading-relaxed line-clamp-3 flex-1">
          {haber.ozet}
        </p>

        {/* CTA */}
        <a
          href={haber.kaynakUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center justify-center gap-2 bg-emerald-600 text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-emerald-700 transition"
        >
          Habere Git
          <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
        </a>
      </div>
    </article>
  );
}

/* ── Sayfa ───────────────────────────────────────────────── */
const PAGE_SIZE = 12;

export default function HaberlerPage() {
  const [haberler,      setHaberler]      = useState<Haber[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [loadingMore,   setLoadingMore]   = useState(false);
  const [lastDoc,       setLastDoc]       = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore,       setHasMore]       = useState(true);
  const [aktifBolge,    setAktifBolge]    = useState('tumu');

  /* İlk yükleme (realtime) */
  useEffect(() => {
    setLoading(true);
    setHaberler([]);
    setLastDoc(null);
    setHasMore(true);

    const constraints = [
      where('yayinda', '==', true),
      orderBy('tarih', 'desc'),
      limit(PAGE_SIZE),
    ] as Parameters<typeof query>[1][];

    const q = query(collection(db, 'haberler'), ...constraints);

    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map(
        (d) => ({ id: d.id, ...d.data() } as Haber),
      );
      setHaberler(docs);
      setLastDoc(snap.docs[snap.docs.length - 1] ?? null);
      setHasMore(snap.docs.length === PAGE_SIZE);
      setLoading(false);
    });

    return unsub;
  }, []);

  /* Daha fazla yükle */
  async function handleLoadMore() {
    if (!lastDoc || loadingMore) return;
    setLoadingMore(true);

    const { getDocs } = await import('firebase/firestore');
    const q = query(
      collection(db, 'haberler'),
      where('yayinda', '==', true),
      orderBy('tarih', 'desc'),
      startAfter(lastDoc as DocumentSnapshot),
      limit(PAGE_SIZE),
    );

    const snap = await getDocs(q);
    const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Haber));
    setHaberler((prev) => [...prev, ...docs]);
    setLastDoc(snap.docs[snap.docs.length - 1] ?? null);
    setHasMore(snap.docs.length === PAGE_SIZE);
    setLoadingMore(false);
  }

  /* Bölge filtresi (client-side) */
  const goruntulenen =
    aktifBolge === 'tumu'
      ? haberler
      : haberler.filter((h) => !h.bolge || h.bolge === aktifBolge);

  return (
    <div className="flex flex-col min-h-screen">
      <SEOMeta
        title="Modüler Yapı Sektör Haberleri — ModülerPazar"
        description="Prefabrik ev, konteyner, tiny house ve modüler yapı sektöründen güncel haberler. AA, Hürriyet, Reuters ve sektör kaynaklarından derlenen son haberler."
        url="/haberler"
      />
      <Header />

      <main className="flex-1 bg-gray-50">

        {/* ── Hero ─────────────────────────────── */}
        <section className="bg-gradient-to-br from-emerald-700 to-emerald-900 text-white py-12 md:py-16">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-3">Sektör Haberleri</h1>
            <p className="text-emerald-100 text-base md:text-lg">
              Prefabrik ev, konteyner, tiny house ve modüler yapı dünyasından güncel haberler.
            </p>
          </div>
        </section>

        {/* ── Bölge Filtresi ────────────────── */}
        <div className="bg-white border-b border-gray-200 sticky top-[56px] z-30">
          <div className="max-w-6xl mx-auto px-4 py-3 flex gap-2 overflow-x-auto no-scrollbar">
            {BOLGELER.map((b) => (
              <button
                key={b.key}
                onClick={() => setAktifBolge(b.key)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition ${
                  aktifBolge === b.key
                    ? 'bg-emerald-600 text-white shadow'
                    : 'bg-gray-100 text-gray-600 hover:bg-emerald-50 hover:text-emerald-700'
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Haber Grid ───────────────────── */}
        <div className="max-w-6xl mx-auto px-4 py-10">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse">
                  <div className="h-48 bg-gray-200" />
                  <div className="p-5 space-y-3">
                    <div className="h-3 bg-gray-200 rounded w-1/4" />
                    <div className="h-5 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                    <div className="h-12 bg-gray-200 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : goruntulenen.length === 0 ? (
            <div className="text-center py-16">
              <Newspaper className="w-12 h-12 text-gray-300 mx-auto mb-4" aria-hidden="true" />
              <p className="text-gray-400 text-sm">
                {aktifBolge === 'tumu' ? 'Henüz haber yok.' : 'Bu bölgede haber bulunamadı.'}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {goruntulenen.map((h) => (
                  <HaberKart key={h.id} haber={h} />
                ))}
              </div>

              {hasMore && aktifBolge === 'tumu' && (
                <div className="mt-10 text-center">
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="inline-flex items-center gap-2 border border-emerald-600 text-emerald-600 px-6 py-3 rounded-lg font-semibold text-sm hover:bg-emerald-50 transition disabled:opacity-50"
                  >
                    {loadingMore ? 'Yükleniyor…' : (
                      <>
                        Daha Fazla Yükle <ChevronDown className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

      </main>

      <Footer />
    </div>
  );
}
