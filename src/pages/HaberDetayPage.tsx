import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { ExternalLink, Newspaper, Calendar, ArrowLeft } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEOMeta from '../components/SEOMeta';
import { db } from '../lib/firebase';

interface Haber {
  id:         string;
  baslik:     string;
  kaynak:     string;
  kaynakUrl:  string;
  ozet:       string;
  icerik?:    string;
  kategori:   string;
  bolge?:     string;
  gorselUrl?: string;
  tarih:      { seconds: number; nanoseconds: number } | null;
  yayinda:    boolean;
}

const VARSAYILAN_GORSEL =
  'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&h=600&fit=crop';

function formatTarih(tarih: Haber['tarih']): string {
  if (!tarih) return '';
  const d = new Date(tarih.seconds * 1000);
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function HaberDetayPage() {
  const { haberId } = useParams<{ haberId: string }>();
  const [haber, setHaber]     = useState<Haber | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!haberId) { setNotFound(true); setLoading(false); return; }

    (async () => {
      try {
        const snap = await getDoc(doc(db, 'haberler', haberId));
        if (snap.exists()) {
          setHaber({ id: snap.id, ...snap.data() } as Haber);
        } else {
          setNotFound(true);
        }
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [haberId]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        </main>
        <Footer />
      </div>
    );
  }

  if (notFound || !haber) {
    return (
      <div className="flex flex-col min-h-screen">
        <SEOMeta title="Haber Bulunamadı — ModülerPazar" description="" />
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center bg-gray-50 px-4 text-center">
          <Newspaper className="w-16 h-16 text-gray-300 mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Haber Bulunamadı</h1>
          <p className="text-gray-500 mb-6">Aradığınız haber mevcut değil veya kaldırılmış olabilir.</p>
          <Link
            to="/haberler"
            className="inline-flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-emerald-700 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Haberlere Dön
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const icerikMetni = haber.icerik || haber.ozet;

  return (
    <div className="flex flex-col min-h-screen">
      <SEOMeta
        title={`${haber.baslik} — ModülerPazar`}
        description={haber.ozet}
        url={`/haberler/${haber.id}`}
        image={haber.gorselUrl}
      />
      <Header />

      <main className="flex-1 bg-gray-50">
        {/* Hero görsel */}
        <div className="w-full h-64 md:h-96 bg-gray-200 overflow-hidden">
          <img
            src={haber.gorselUrl || VARSAYILAN_GORSEL}
            alt={haber.baslik}
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).src = VARSAYILAN_GORSEL; }}
          />
        </div>

        <div className="max-w-3xl mx-auto px-4 py-8 md:py-12">
          {/* Geri dön */}
          <Link
            to="/haberler"
            className="inline-flex items-center gap-1.5 text-sm text-emerald-600 hover:underline font-medium mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> Tüm Haberler
          </Link>

          {/* Başlık */}
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight mb-4">
            {haber.baslik}
          </h1>

          {/* Meta satırı */}
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mb-8">
            <span className="flex items-center gap-1.5 font-medium text-gray-700">
              <Newspaper className="w-4 h-4" aria-hidden="true" />
              {haber.kaynak}
            </span>
            {haber.tarih && (
              <>
                <span aria-hidden="true">•</span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" aria-hidden="true" />
                  {formatTarih(haber.tarih)}
                </span>
              </>
            )}
            <span aria-hidden="true">•</span>
            <span className="inline-block text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
              {haber.bolge === 'dunya' ? '🌍 Dünyadan' : '🇹🇷 Türkiye'}
            </span>
          </div>

          {/* İçerik */}
          <article className="prose prose-gray prose-emerald max-w-none mb-10">
            <ReactMarkdown>{icerikMetni}</ReactMarkdown>
          </article>

          {/* Kaynak kutusu */}
          <div className="border-2 border-emerald-200 bg-emerald-50 rounded-xl p-5">
            <p className="text-sm font-semibold text-emerald-800 mb-3">
              Kaynak: {haber.kaynak}
            </p>
            <a
              href={haber.kaynakUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-emerald-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-emerald-700 transition"
            >
              Orijinal Habere Git
              <ExternalLink className="w-4 h-4" aria-hidden="true" />
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
