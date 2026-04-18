import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  collection, query, where, orderBy, onSnapshot,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEOMeta from '../components/SEOMeta';
import type { Etkinlik } from '../types/etkinlik';
import { TUR_LABELS, TUR_COLORS } from '../types/etkinlik';

const SEHIRLER = [
  'İstanbul','Ankara','İzmir','Antalya','Bursa','Konya','Adana','Gaziantep',
  'Mersin','Kayseri','Eskişehir','Trabzon','Samsun','Muğla','Denizli',
];

const TUR_OPTIONS: { key: Etkinlik['tur'] | ''; label: string }[] = [
  { key: '', label: 'Tüm Türler' },
  { key: 'fuar', label: 'Fuar' },
  { key: 'seminer', label: 'Seminer' },
  { key: 'konferans', label: 'Konferans' },
  { key: 'workshop', label: 'Workshop' },
  { key: 'webinar', label: 'Webinar' },
];

function formatTarih(ts: { seconds: number }): string {
  return new Date(ts.seconds * 1000).toLocaleDateString('tr-TR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

function formatTarihKisa(ts: { seconds: number }): string {
  return new Date(ts.seconds * 1000).toLocaleDateString('tr-TR', {
    day: 'numeric', month: 'short',
  });
}

const PLACEHOLDER_IMG = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=500&fit=crop';

export default function EtkinliklerPage() {
  const [etkinlikler, setEtkinlikler] = useState<Etkinlik[]>([]);
  const [loading, setLoading] = useState(true);
  const [sehirFiltre, setSehirFiltre] = useState('');
  const [turFiltre, setTurFiltre] = useState<Etkinlik['tur'] | ''>('');
  const [arsivGoster, setArsivGoster] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, 'etkinlikler'),
      where('durum', '==', 'yayinda'),
      orderBy('baslangicTarihi', 'asc'),
    );
    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Etkinlik));
      setEtkinlikler(docs);
      setLoading(false);
    }, () => setLoading(false));
    return unsub;
  }, []);

  const now = Date.now() / 1000;
  const filtered = etkinlikler.filter((e) => {
    if (sehirFiltre && e.sehir !== sehirFiltre) return false;
    if (turFiltre && e.tur !== turFiltre) return false;
    const isPast = e.bitisTarihi.seconds < now;
    if (!arsivGoster && isPast) return false;
    if (arsivGoster && !isPast) return false;
    return true;
  });

  return (
    <div className="flex flex-col min-h-screen font-body">
      <SEOMeta
        title="Modüler Yapı Fuarları ve Etkinlikleri | ModülerPazar"
        description="Türkiye'deki prefabrik, modüler yapı, konteyner ev, tiny house fuarları ve sektör etkinlikleri. Yaklaşan fuarları keşfedin."
        url="/etkinlikler"
      />
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-white py-14 md:py-20">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <span className="material-symbols-outlined text-5xl text-secondary-container mb-4 block" aria-hidden="true">event</span>
            <h1 className="text-3xl md:text-5xl font-extrabold font-headline mb-3">
              Modüler Yapı Fuarları ve Etkinlikleri
            </h1>
            <p className="text-white/60 max-w-2xl mx-auto text-lg">
              Sektörün önemli fuarları, seminerleri ve konferansları tek sayfada
            </p>
          </div>
        </section>

        {/* Filtre barı */}
        <div className="bg-surface-container-low border-b border-outline-variant/30 sticky top-[108px] z-30">
          <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center gap-3">
            {/* Şehir */}
            <select
              value={sehirFiltre}
              onChange={(e) => setSehirFiltre(e.target.value)}
              className="border border-outline-variant rounded-xl bg-white text-on-surface text-sm px-3 py-2 pr-8 font-body focus:ring-2 focus:ring-primary focus:outline-none"
              aria-label="Şehir filtresi"
            >
              <option value="">Tüm Şehirler</option>
              {SEHIRLER.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>

            {/* Tür */}
            <select
              value={turFiltre}
              onChange={(e) => setTurFiltre(e.target.value as Etkinlik['tur'] | '')}
              className="border border-outline-variant rounded-xl bg-white text-on-surface text-sm px-3 py-2 pr-8 font-body focus:ring-2 focus:ring-primary focus:outline-none"
              aria-label="Tür filtresi"
            >
              {TUR_OPTIONS.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
            </select>

            {/* Arşiv toggle */}
            <button
              onClick={() => setArsivGoster((v) => !v)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition font-headline ${
                arsivGoster
                  ? 'bg-primary text-on-primary'
                  : 'bg-white border border-outline-variant text-on-surface-variant hover:border-primary'
              }`}
            >
              <span className="material-symbols-outlined text-base align-middle mr-1">archive</span>
              {arsivGoster ? 'Yaklaşanları Göster' : 'Arşiv'}
            </button>

            <span className="ml-auto text-xs text-on-surface-variant font-body">
              {filtered.length} etkinlik
            </span>
          </div>
        </div>

        {/* Grid */}
        <section className="max-w-7xl mx-auto px-4 py-10">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <span className="material-symbols-outlined text-6xl text-outline-variant mb-4">event_busy</span>
              <p className="text-on-surface-variant font-medium font-headline text-lg">
                {arsivGoster ? 'Geçmiş etkinlik bulunamadı' : 'Yaklaşan etkinlik bulunamadı'}
              </p>
              <p className="text-outline-variant text-sm mt-1 font-body">Filtreleri değiştirmeyi deneyin</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((e) => (
                <Link
                  key={e.id}
                  to={`/etkinlikler/${e.slug || e.id}`}
                  className="group bg-white rounded-2xl overflow-hidden border border-outline-variant/20 hover:shadow-xl transition-all duration-300"
                >
                  {/* Kapak */}
                  <div className="aspect-video overflow-hidden bg-surface-container-low relative">
                    <img
                      src={e.kapakGorseli || PLACEHOLDER_IMG}
                      alt={e.baslik}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                      onError={(ev) => { (ev.target as HTMLImageElement).src = PLACEHOLDER_IMG; }}
                    />
                    {/* Tarih rozeti */}
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur rounded-xl px-3 py-1.5 text-center shadow-sm">
                      <p className="text-xs font-bold text-primary font-headline leading-none">
                        {formatTarihKisa(e.baslangicTarihi)}
                      </p>
                    </div>
                    {/* Tür badge */}
                    <span className={`absolute top-3 right-3 text-[10px] font-bold px-2 py-1 rounded-full ${TUR_COLORS[e.tur]} font-headline`}>
                      {TUR_LABELS[e.tur]}
                    </span>
                  </div>

                  {/* İçerik */}
                  <div className="p-5">
                    <h3 className="font-headline font-bold text-on-surface text-base leading-snug line-clamp-2 group-hover:text-primary transition-colors mb-2">
                      {e.baslik}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-on-surface-variant mb-2 font-body">
                      <span className="material-symbols-outlined text-sm text-primary">location_on</span>
                      {e.mekan}, {e.sehir}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-on-surface-variant mb-3 font-body">
                      <span className="material-symbols-outlined text-sm text-primary">calendar_today</span>
                      {formatTarih(e.baslangicTarihi)} — {formatTarih(e.bitisTarihi)}
                    </div>
                    <p className="text-sm text-on-surface-variant line-clamp-2 font-body">{e.kisaAciklama}</p>

                    {/* Kategoriler */}
                    {e.kategoriler.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {e.kategoriler.slice(0, 3).map((k) => (
                          <span key={k} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary font-headline">
                            {k}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
