import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  collection, query, where, orderBy, limit, getDocs, doc, getDoc, updateDoc, increment, Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEOMeta from '../components/SEOMeta';
import { useLanguage } from '../context/LanguageContext';
import type { Etkinlik } from '../types/etkinlik';
import { TUR_LABELS, TUR_COLORS } from '../types/etkinlik';

const PLACEHOLDER_IMG = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&h=600&fit=crop';

function formatTarih(ts: { seconds: number }): string {
  return new Date(ts.seconds * 1000).toLocaleDateString('tr-TR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

function formatTarihFull(ts: { seconds: number }): string {
  return new Date(ts.seconds * 1000).toLocaleDateString('tr-TR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

export default function EtkinlikDetayPage() {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useLanguage();
  const [etkinlik, setEtkinlik] = useState<Etkinlik | null>(null);
  const [ilgili, setIlgili] = useState<Etkinlik[]>([]);
  const [loading, setLoading] = useState(true);
  const [copyDone, setCopyDone] = useState(false);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      setLoading(true);
      // Try by slug first
      let snap = await getDocs(query(
        collection(db, 'etkinlikler'),
        where('slug', '==', slug),
        limit(1),
      ));
      if (snap.empty) {
        // Fallback: try as document ID
        const docSnap = await getDoc(doc(db, 'etkinlikler', slug));
        if (docSnap.exists()) {
          setEtkinlik({ id: docSnap.id, ...docSnap.data() } as Etkinlik);
          // Increment view count
          updateDoc(doc(db, 'etkinlikler', slug), { goruntulenmeSayisi: increment(1) }).catch(() => {});
        }
      } else {
        const d = snap.docs[0];
        setEtkinlik({ id: d.id, ...d.data() } as Etkinlik);
        updateDoc(doc(db, 'etkinlikler', d.id), { goruntulenmeSayisi: increment(1) }).catch(() => {});
      }
      setLoading(false);
    })();
  }, [slug]);

  // Fetch related events
  useEffect(() => {
    if (!etkinlik) return;
    (async () => {
      const q = query(
        collection(db, 'etkinlikler'),
        where('durum', '==', 'yayinda'),
        orderBy('baslangicTarihi', 'asc'),
        limit(4),
      );
      const snap = await getDocs(q);
      setIlgili(snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as Etkinlik))
        .filter((e) => e.id !== etkinlik.id)
        .slice(0, 3));
    })();
  }, [etkinlik]);

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopyDone(true);
      setTimeout(() => setCopyDone(false), 2000);
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen font-body">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!etkinlik) {
    return (
      <div className="flex flex-col min-h-screen font-body">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center py-20">
          <span className="material-symbols-outlined text-6xl text-outline-variant mb-4">event_busy</span>
          <h1 className="text-xl font-bold font-headline mb-2">Etkinlik Bulunamadı</h1>
          <Link to="/etkinlikler" className="text-primary font-semibold hover:underline mt-2">← Etkinliklere Dön</Link>
        </div>
        <Footer />
      </div>
    );
  }

  const isPast = etkinlik.bitisTarihi.seconds < Date.now() / 1000;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: etkinlik.baslik,
    startDate: new Date(etkinlik.baslangicTarihi.seconds * 1000).toISOString(),
    endDate: new Date(etkinlik.bitisTarihi.seconds * 1000).toISOString(),
    location: {
      '@type': 'Place',
      name: etkinlik.mekan,
      address: {
        '@type': 'PostalAddress',
        addressLocality: etkinlik.sehir,
        addressCountry: 'TR',
      },
    },
    description: etkinlik.kisaAciklama,
    image: etkinlik.kapakGorseli || PLACEHOLDER_IMG,
    organizer: {
      '@type': 'Organization',
      name: etkinlik.organizator,
      url: etkinlik.organizatorWeb || undefined,
    },
    eventStatus: isPast ? 'https://schema.org/EventPostponed' : 'https://schema.org/EventScheduled',
    eventAttendanceMode: etkinlik.tur === 'webinar'
      ? 'https://schema.org/OnlineEventAttendanceMode'
      : 'https://schema.org/OfflineEventAttendanceMode',
  };

  return (
    <div className="flex flex-col min-h-screen font-body">
      <SEOMeta
        title={`${etkinlik.metaBaslik || etkinlik.baslik} | ModülerPazar`}
        description={etkinlik.metaAciklama || etkinlik.kisaAciklama}
        url={`/etkinlikler/${etkinlik.slug || etkinlik.id}`}
      />
      <script
        type="application/ld+json"
        ref={(el) => {
          if (el) el.textContent = JSON.stringify(jsonLd);
        }}
      />
      <Header />

      <main className="flex-1">
        {/* Kapak */}
        <div className="relative h-64 md:h-96 overflow-hidden bg-slate-900">
          <img
            src={etkinlik.kapakGorseli || PLACEHOLDER_IMG}
            alt={etkinlik.baslik}
            className="w-full h-full object-cover opacity-60"
            onError={(ev) => { (ev.target as HTMLImageElement).src = PLACEHOLDER_IMG; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent" />
          {/* Breadcrumb */}
          <div className="absolute top-4 left-4 flex items-center gap-2 text-sm text-white/70">
            <Link to="/" className="hover:text-white">Ana Sayfa</Link>
            <span>/</span>
            <Link to="/etkinlikler" className="hover:text-white">Etkinlikler</Link>
            <span>/</span>
            <span className="text-white/50 truncate max-w-[200px]">{etkinlik.baslik}</span>
          </div>
          {/* Badge'ler */}
          <div className="absolute bottom-6 left-6 right-6">
            <div className="flex items-center gap-2 mb-3">
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${TUR_COLORS[etkinlik.tur]} font-headline`}>
                {TUR_LABELS[etkinlik.tur]}
              </span>
              {isPast && (
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-gray-600 text-white font-headline">
                  Sona Erdi
                </span>
              )}
              {etkinlik.katilimUcretli && (
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-700 font-headline">
                  Ücretli
                </span>
              )}
            </div>
            <h1 className="text-2xl md:text-4xl font-extrabold text-white font-headline leading-tight max-w-3xl">
              {etkinlik.baslik}
            </h1>
          </div>
        </div>

        {/* İçerik */}
        <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sol: Detaylar */}
          <div className="lg:col-span-2 space-y-8">
            {/* Meta çizgisi */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-on-surface-variant">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base text-primary">calendar_today</span>
                {formatTarihFull(etkinlik.baslangicTarihi)} — {formatTarih(etkinlik.bitisTarihi)}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base text-primary">location_on</span>
                {etkinlik.mekan}, {etkinlik.sehir}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base text-primary">visibility</span>
                {etkinlik.goruntulenmeSayisi || 0} görüntülenme
              </div>
            </div>

            {/* Açıklama */}
            <div className="prose max-w-none">
              <h2 className="text-xl font-bold font-headline text-on-surface mb-3">Etkinlik Hakkında</h2>
              {etkinlik.tamAciklama.split('\n').filter(Boolean).map((p, i) => (
                <p key={i} className="text-on-surface-variant leading-relaxed mb-3 font-body">{p}</p>
              ))}
            </div>

            {/* Kategoriler */}
            {etkinlik.kategoriler.length > 0 && (
              <div>
                <h3 className="text-sm font-bold font-headline text-on-surface mb-2">Kategoriler</h3>
                <div className="flex flex-wrap gap-2">
                  {etkinlik.kategoriler.map((k) => (
                    <span key={k} className="text-xs font-semibold px-3 py-1 rounded-full bg-primary/10 text-primary font-headline">
                      {k}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Katılan Firmalar */}
            {etkinlik.katilanFirmalar && etkinlik.katilanFirmalar.length > 0 && (
              <div>
                <h3 className="text-sm font-bold font-headline text-on-surface mb-2">Katılan Firmalar</h3>
                <div className="flex flex-wrap gap-2">
                  {etkinlik.katilanFirmalar.map((f) => (
                    <span key={f} className="text-xs px-3 py-1 rounded-full bg-surface-container text-on-surface-variant font-body">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Harita */}
            {etkinlik.harita && (
              <div>
                <h3 className="text-sm font-bold font-headline text-on-surface mb-2">Konum</h3>
                <div className="rounded-2xl overflow-hidden border border-outline-variant/20 h-64">
                  <iframe
                    title="Etkinlik Konumu"
                    src={`https://maps.google.com/maps?q=${etkinlik.harita.lat},${etkinlik.harita.lng}&z=15&output=embed`}
                    className="w-full h-full border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </div>
            )}

            {/* Galeri */}
            {etkinlik.galeriGorseller && etkinlik.galeriGorseller.length > 0 && (
              <div>
                <h3 className="text-sm font-bold font-headline text-on-surface mb-2">Galeri</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {etkinlik.galeriGorseller.map((g, i) => (
                    <img key={i} src={g} alt={`${etkinlik.baslik} - ${i + 1}`} className="rounded-xl w-full h-40 object-cover" loading="lazy" />
                  ))}
                </div>
              </div>
            )}

            {/* Paylaş */}
            <div>
              <h3 className="text-sm font-bold font-headline text-on-surface mb-2">Paylaş</h3>
              <div className="flex gap-2">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(etkinlik.baslik + ' ' + shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition"
                >
                  WhatsApp
                </a>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition"
                >
                  Facebook
                </a>
                <a
                  href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(etkinlik.baslik)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-black text-white text-sm font-semibold hover:bg-gray-800 transition"
                >
                  X
                </a>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-container text-on-surface text-sm font-semibold hover:bg-surface-container-high transition"
                >
                  <span className="material-symbols-outlined text-sm">{copyDone ? 'check' : 'content_copy'}</span>
                  {copyDone ? 'Kopyalandı' : 'Kopyala'}
                </button>
              </div>
            </div>
          </div>

          {/* Sağ: Sidebar */}
          <div className="space-y-6">
            {/* Organizatör kartı */}
            <div className="bg-white rounded-2xl border border-outline-variant/20 p-5 shadow-sm">
              <h3 className="font-bold font-headline text-on-surface mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">business</span>
                Organizatör
              </h3>
              <p className="font-semibold text-on-surface font-body">{etkinlik.organizator}</p>
              {etkinlik.organizatorWeb && (
                <a
                  href={etkinlik.organizatorWeb}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary text-sm hover:underline mt-1 block font-body"
                >
                  {etkinlik.organizatorWeb}
                </a>
              )}
              {etkinlik.organizatorIletisim && (
                <p className="text-sm text-on-surface-variant mt-1 font-body">{etkinlik.organizatorIletisim}</p>
              )}
            </div>

            {/* Bilet / Kayıt */}
            <div className="bg-white rounded-2xl border border-outline-variant/20 p-5 shadow-sm">
              <h3 className="font-bold font-headline text-on-surface mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">confirmation_number</span>
                {etkinlik.katilimUcretli ? 'Bilet Bilgisi' : 'Katılım'}
              </h3>
              {etkinlik.katilimUcretli ? (
                <>
                  {etkinlik.biletUcreti && (
                    <p className="text-2xl font-extrabold text-primary font-headline">
                      {etkinlik.biletUcreti.toLocaleString('tr-TR')} ₺
                    </p>
                  )}
                  {etkinlik.biletLinki && !isPast && (
                    <a
                      href={etkinlik.biletLinki}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-primary text-on-primary font-bold font-headline hover:bg-primary/90 transition"
                    >
                      <span className="material-symbols-outlined text-base">open_in_new</span>
                      Bilet Al
                    </a>
                  )}
                </>
              ) : (
                <p className="text-sm text-on-surface-variant font-body">
                  Bu etkinliğe katılım <span className="font-bold text-primary">ücretsizdir</span>.
                </p>
              )}
              {isPast && (
                <p className="text-sm text-on-surface-variant mt-2 font-body italic">
                  Bu etkinlik sona ermiştir.
                </p>
              )}
            </div>

            {/* Detay kartı */}
            <div className="bg-white rounded-2xl border border-outline-variant/20 p-5 shadow-sm">
              <h3 className="font-bold font-headline text-on-surface mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">info</span>
                Detaylar
              </h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-on-surface-variant font-body">Tür</dt>
                  <dd className="font-semibold text-on-surface font-headline">{TUR_LABELS[etkinlik.tur]}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-on-surface-variant font-body">Şehir</dt>
                  <dd className="font-semibold text-on-surface font-headline">{etkinlik.sehir}</dd>
                </div>
                {etkinlik.ilce && (
                  <div className="flex justify-between">
                    <dt className="text-on-surface-variant font-body">İlçe</dt>
                    <dd className="font-semibold text-on-surface font-headline">{etkinlik.ilce}</dd>
                  </div>
                )}
                {etkinlik.adres && (
                  <div>
                    <dt className="text-on-surface-variant font-body mb-1">Adres</dt>
                    <dd className="font-body text-on-surface text-xs">{etkinlik.adres}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </div>

        {/* İlgili Etkinlikler */}
        {ilgili.length > 0 && (
          <section className="bg-surface-container-low py-10">
            <div className="max-w-7xl mx-auto px-4">
              <h2 className="text-xl font-bold font-headline text-on-surface mb-6">Diğer Etkinlikler</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {ilgili.map((e) => (
                  <Link
                    key={e.id}
                    to={`/etkinlikler/${e.slug || e.id}`}
                    className="bg-white rounded-2xl overflow-hidden border border-outline-variant/20 hover:shadow-lg transition group"
                  >
                    <div className="aspect-video overflow-hidden bg-surface-container-low relative">
                      <img
                        src={e.kapakGorseli || PLACEHOLDER_IMG}
                        alt={e.baslik}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <span className={`absolute top-3 right-3 text-[10px] font-bold px-2 py-1 rounded-full ${TUR_COLORS[e.tur]} font-headline`}>
                        {TUR_LABELS[e.tur]}
                      </span>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold font-headline text-sm text-on-surface line-clamp-2 group-hover:text-primary transition-colors">
                        {e.baslik}
                      </h3>
                      <p className="text-xs text-on-surface-variant mt-1 font-body">
                        {formatTarih(e.baslangicTarihi)} · {e.sehir}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
