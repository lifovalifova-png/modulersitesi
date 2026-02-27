import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { FIRMS } from '../data/firms';
import { CATEGORIES } from '../data/categories';
import { ShieldCheck, MapPin, Phone, Tag, ChevronDown, ExternalLink } from 'lucide-react';

/* ── Category badge colors ──────────────────────────────────── */
const CAT_COLORS: Record<string, string> = {
  'Prefabrik':           'bg-emerald-100 text-emerald-700',
  'Yaşam Konteynerleri': 'bg-blue-100 text-blue-700',
  'Tiny House':          'bg-purple-100 text-purple-700',
  'Çelik Yapılar':       'bg-gray-200 text-gray-700',
  'Ahşap Yapılar':       'bg-amber-100 text-amber-700',
  'Özel Projeler':       'bg-pink-100 text-pink-700',
};

/* ── Component ──────────────────────────────────────────────── */
export default function FirmalarHaritaPage() {
  const [filterCategory, setFilterCategory] = useState('');
  const [filterCity,     setFilterCity]     = useState('');

  /* filtered list */
  const filtered = useMemo(() => FIRMS.filter((f) => {
    if (filterCategory && f.category !== filterCategory) return false;
    if (filterCity     && f.city     !== filterCity)     return false;
    return true;
  }), [filterCategory, filterCity]);

  /* unique cities from data */
  const cities = useMemo(() => [...new Set(FIRMS.map((f) => f.city))].sort(), []);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">

          {/* Page heading */}
          <div className="mb-6">
            <nav className="text-sm text-gray-500 mb-3 flex items-center gap-2">
              <Link to="/" className="hover:text-emerald-600 transition">Ana Sayfa</Link>
              <span>/</span>
              <span className="text-gray-800">Firmalar</span>
            </nav>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Kayıtlı Firmalar</h1>
            <p className="text-gray-500 mt-1 text-sm">
              Türkiye genelindeki {FIRMS.length} kayıtlı firma
            </p>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex flex-wrap gap-3 items-center">
            {/* Category filter */}
            <div className="relative">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                aria-label="Kategoriye göre filtrele"
                className="appearance-none border border-gray-300 rounded-lg bg-white text-sm text-gray-700 px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Tüm Kategoriler</option>
                {CATEGORIES.map((c) => (
                  <option key={c.slug} value={c.name}>{c.name}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" aria-hidden="true" />
            </div>

            {/* City filter */}
            <div className="relative">
              <select
                value={filterCity}
                onChange={(e) => setFilterCity(e.target.value)}
                aria-label="Şehre göre filtrele"
                className="appearance-none border border-gray-300 rounded-lg bg-white text-sm text-gray-700 px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Tüm Şehirler</option>
                {cities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" aria-hidden="true" />
            </div>

            <span className="text-sm text-gray-500 ml-auto">
              {filtered.length} firma gösteriliyor
            </span>

            {/* Legend */}
            <div className="flex items-center gap-4 text-xs text-gray-500 border-l border-gray-200 pl-4">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                Doğrulanmış
              </span>
            </div>
          </div>

          {/* Firm cards grid */}
          {filtered.length === 0 ? (
            <div className="text-center text-gray-500 text-sm py-20 bg-white rounded-2xl border border-gray-200">
              Filtrelerle eşleşen firma bulunamadı.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((firm) => (
                <div
                  key={firm.id}
                  className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-emerald-300 hover:shadow-sm transition flex flex-col gap-3"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-gray-800 text-sm leading-snug">{firm.name}</p>
                    {firm.verified && (
                      <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" aria-label="Doğrulanmış firma" />
                    )}
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-1.5">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${CAT_COLORS[firm.category] ?? 'bg-gray-100 text-gray-600'}`}>
                      <Tag className="w-2.5 h-2.5" aria-hidden="true" />
                      {firm.category}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                      <MapPin className="w-2.5 h-2.5" aria-hidden="true" />
                      {firm.city}
                    </span>
                  </div>

                  {/* Address */}
                  <p className="text-xs text-gray-500 leading-relaxed">{firm.address}</p>

                  {/* Phone */}
                  <a
                    href={`tel:${firm.phone.replace(/\s/g, '')}`}
                    className="inline-flex items-center gap-1.5 text-xs text-emerald-600 hover:underline font-medium"
                  >
                    <Phone className="w-3 h-3" aria-hidden="true" />
                    {firm.phone}
                  </a>

                  {/* Actions */}
                  <div className="flex gap-2 mt-auto pt-1">
                    <Link
                      to="/satici-formu"
                      className="flex-1 text-center bg-emerald-600 text-white text-xs font-semibold py-2 rounded-lg hover:bg-emerald-700 transition"
                    >
                      Teklif Al
                    </Link>
                    <a
                      href={`https://maps.google.com/maps?q=${encodeURIComponent(firm.name + ' ' + firm.city)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-600 hover:border-gray-300 transition"
                      aria-label="Haritada göster"
                    >
                      <ExternalLink className="w-3 h-3" aria-hidden="true" />
                      Harita
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className="mt-6 text-xs text-gray-400 text-center">
            Firmanızı listeye eklemek için{' '}
            <Link to="/satici-formu" className="text-emerald-600 hover:underline">
              ücretsiz kayıt olun
            </Link>.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
