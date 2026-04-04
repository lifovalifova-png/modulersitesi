import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  doc, getDoc, collection, query, where, orderBy, limit, getDocs,
} from 'firebase/firestore';
import { ExternalLink, Newspaper, Calendar, ArrowLeft, Clock, ChevronRight } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEOMeta from '../components/SEOMeta';
import { db } from '../lib/firebase';
import { useLanguage } from '../context/LanguageContext';

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
  baslikEn?:  string;
  ozetEn?:    string;
  icerikEn?:  string;
}

const VARSAYILAN_GORSEL =
  'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&h=600&fit=crop';

function formatTarih(tarih: Haber['tarih']): string {
  if (!tarih) return '';
  const d = new Date(tarih.seconds * 1000);
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function isoTarih(tarih: Haber['tarih']): string {
  if (!tarih) return '';
  return new Date(tarih.seconds * 1000).toISOString();
}

function okumaSuresi(metin: string): number {
  const kelimeSayisi = metin.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(kelimeSayisi / 200));
}

export default function HaberDetayPage() {
  const { haberId } = useParams<{ haberId: string }>();
  const { lang, t } = useLanguage();
  const [haber, setHaber]           = useState<Haber | null>(null);
  const [loading, setLoading]       = useState(true);
  const [notFound, setNotFound]     = useState(false);
  const [digerHaberler, setDigerHaberler] = useState<Haber[]>([]);

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

  /* Diğer haberler */
  useEffect(() => {
    if (!haberId) return;
    (async () => {
      try {
        const q = query(
          collection(db, 'haberler'),
          where('yayinda', '==', true),
          orderBy('tarih', 'desc'),
          limit(4),
        );
        const snap = await getDocs(q);
        setDigerHaberler(
          snap.docs
            .map((d) => ({ id: d.id, ...d.data() } as Haber))
            .filter((h) => h.id !== haberId)
            .slice(0, 3),
        );
      } catch { /* silent */ }
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
        <SEOMeta title={`${t('haber.bulunamadi')} — ModülerPazar`} description="" />
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center bg-gray-50 px-4 text-center">
          <Newspaper className="w-16 h-16 text-gray-300 mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">{t('haber.bulunamadi')}</h1>
          <p className="text-gray-500 mb-6">{t('haber.bulunamadiAciklama')}</p>
          <Link
            to="/haberler"
            className="inline-flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-emerald-700 transition"
          >
            <ArrowLeft className="w-4 h-4" /> {t('haber.haberleredon')}
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const baslik = lang === 'en' ? (haber.baslikEn || haber.baslik) : haber.baslik;
  const ozet   = lang === 'en' ? (haber.ozetEn || haber.ozet) : haber.ozet;
  const icerikRaw = lang === 'en' ? (haber.icerikEn || haber.icerik) : haber.icerik;
  const icerikVar = Boolean(icerikRaw && icerikRaw.trim().length > 0);
  const sure = okumaSuresi(icerikRaw || ozet);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: baslik,
    description: ozet.slice(0, 160),
    datePublished: isoTarih(haber.tarih),
    image: haber.gorselUrl || VARSAYILAN_GORSEL,
    publisher: {
      '@type': 'Organization',
      name: 'ModülerPazar',
      url: 'https://modulerpazar.com',
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://modulerpazar.com/haberler/${haber.id}`,
    },
  };

  return (
    <div className="flex flex-col min-h-screen">
      <SEOMeta
        title={`${baslik} | ModülerPazar Haberler`}
        description={ozet.slice(0, 160)}
        url={`/haberler/${haber.id}`}
        image={haber.gorselUrl}
      />
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />

      <main className="flex-1 bg-gray-50">
        {/* Hero görsel */}
        <div className="w-full max-h-[400px] bg-gray-200 overflow-hidden">
          <img
            src={haber.gorselUrl || VARSAYILAN_GORSEL}
            alt={baslik}
            className="w-full h-full object-cover max-h-[400px]"
            onError={(e) => { (e.target as HTMLImageElement).src = VARSAYILAN_GORSEL; }}
          />
        </div>

        <div className="max-w-3xl mx-auto px-4 py-8 md:py-12">
          {/* Haberlere Dön + Breadcrumb */}
          <Link
            to="/haberler"
            className="inline-flex items-center gap-1.5 text-sm text-emerald-600 hover:text-emerald-800 font-medium mb-4 transition"
          >
            <ArrowLeft className="w-4 h-4" /> {t('haber.haberleredon')}
          </Link>
          <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-6">
            <Link to="/" className="hover:text-emerald-600 transition">{lang === 'en' ? 'Home' : 'Ana Sayfa'}</Link>
            <ChevronRight className="w-3 h-3" />
            <Link to="/haberler" className="hover:text-emerald-600 transition">{lang === 'en' ? 'News' : 'Haberler'}</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-gray-600 truncate max-w-[200px]">{baslik}</span>
          </nav>

          {/* Bölge badge */}
          <span className="inline-block text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full mb-4">
            {haber.bolge === 'dunya' ? '🌍 Dünyadan' : '🇹🇷 Türkiye'}
          </span>

          {/* Başlık */}
          <h1 className="text-2xl md:text-4xl font-bold text-gray-900 leading-tight mb-4">
            {baslik}
          </h1>

          {/* Meta satırı */}
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mb-8 pb-6 border-b border-gray-200">
            <a
              href={haber.kaynakUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 font-medium text-emerald-600 hover:underline"
            >
              <Newspaper className="w-4 h-4" aria-hidden="true" />
              {haber.kaynak}
            </a>
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
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" aria-hidden="true" />
              {sure} {t('haber.okumaSuresi')}
            </span>
          </div>

          {/* İçerik */}
          {icerikVar ? (
            <article className="max-w-none mb-10">
              {icerikRaw!.split('\n\n').map((paragraf, idx) => (
                <p key={idx} className="text-gray-700 leading-relaxed mb-4 text-lg">
                  {paragraf}
                </p>
              ))}
            </article>
          ) : (
            <article className="max-w-none mb-10">
              <p className="text-gray-700 leading-relaxed mb-4 text-lg">{ozet}</p>
              <p className="text-sm text-gray-500 italic mb-6">
                {t('haber.detayIcinKaynaga')}{' '}
                <a href={haber.kaynakUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-emerald-600 hover:underline font-medium">
                  {haber.kaynak} <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </p>
            </article>
          )}

          {/* Kaynak kutusu */}
          <div className="border-l-4 border-emerald-500 bg-emerald-50 rounded-r-xl p-5 mb-10">
            <p className="text-sm text-gray-700 mb-3">
              {t('haber.kaynakBilgisi').replace('{kaynak}', haber.kaynak)}
            </p>
            <a
              href={haber.kaynakUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-emerald-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-emerald-700 transition"
            >
              {t('haber.orijinalHabereGit')}
              <ExternalLink className="w-4 h-4" aria-hidden="true" />
            </a>
          </div>

          {/* Haberlere Dön */}
          <Link
            to="/haberler"
            className="inline-flex items-center gap-1.5 text-sm text-emerald-600 hover:underline font-medium mb-10"
          >
            <ArrowLeft className="w-4 h-4" /> {t('haber.haberleredon')}
          </Link>

          {/* Diğer Haberler */}
          {digerHaberler.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-5">{t('haber.digerHaberler')}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {digerHaberler.map((h) => (
                  <Link
                    key={h.id}
                    to={`/haberler/${h.id}`}
                    className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition group"
                  >
                    <div className="h-32 bg-gray-100 overflow-hidden">
                      <img
                        src={h.gorselUrl || VARSAYILAN_GORSEL}
                        alt={lang === 'en' ? (h.baslikEn || h.baslik) : h.baslik}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                        onError={(e) => { (e.target as HTMLImageElement).src = VARSAYILAN_GORSEL; }}
                      />
                    </div>
                    <div className="p-3">
                      <p className="text-xs text-emerald-600 font-medium mb-1">{h.kaynak}</p>
                      <h3 className="text-sm font-semibold text-gray-800 leading-snug line-clamp-2 group-hover:text-emerald-700 transition">
                        {lang === 'en' ? (h.baslikEn || h.baslik) : h.baslik}
                      </h3>
                      {h.tarih && (
                        <p className="text-xs text-gray-400 mt-1.5">{formatTarih(h.tarih)}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
