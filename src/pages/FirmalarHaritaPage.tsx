import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { FIRMS, type Firm } from '../data/firms';
import { CATEGORIES } from '../data/categories';
import { ShieldCheck, MapPin, Phone, Tag, ChevronDown } from 'lucide-react';

/* ── Fix default Leaflet marker icons (Vite asset issue) ─── */
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

/* ── Custom colored marker ──────────────────────────────── */
function makeIcon(verified: boolean) {
  const color = verified ? '#059669' : '#d97706'; // emerald : amber
  return L.divIcon({
    className: '',
    html: `<div style="
      width:28px;height:28px;border-radius:50% 50% 50% 0;
      background:${color};border:2px solid #fff;
      transform:rotate(-45deg);box-shadow:0 2px 6px rgba(0,0,0,.35);
    "></div>`,
    iconSize:   [28, 28],
    iconAnchor: [14, 28],
    popupAnchor:[0, -30],
  });
}

/* ── FlyTo helper (auto-center on firm select) ──────────── */
function MapFlyTo({ firm }: { firm: Firm | null }) {
  const map = useMap();
  if (firm) map.flyTo([firm.lat, firm.lng], 13, { duration: 1 });
  return null;
}

/* ── Category badge colors ──────────────────────────────── */
const CAT_COLORS: Record<string, string> = {
  'Prefabrik':           'bg-emerald-100 text-emerald-700',
  'Yaşam Konteynerleri': 'bg-blue-100 text-blue-700',
  'Tiny House':          'bg-purple-100 text-purple-700',
  'Çelik Yapılar':       'bg-gray-200 text-gray-700',
  'Ahşap Yapılar':       'bg-amber-100 text-amber-700',
  'Özel Projeler':       'bg-pink-100 text-pink-700',
};

/* ── Component ──────────────────────────────────────────── */
export default function FirmalarHaritaPage() {
  const [selectedFirm,   setSelectedFirm]   = useState<Firm | null>(null);
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
              <span className="text-gray-800">Firmalar Haritası</span>
            </nav>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Firmalar Haritası</h1>
            <p className="text-gray-500 mt-1 text-sm">
              Türkiye genelindeki {FIRMS.length} kayıtlı firma — harita üzerinde inceleyin
            </p>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex flex-wrap gap-3 items-center">
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
                <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block" />
                Doğrulanmış
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
                Onay bekliyor
              </span>
            </div>
          </div>

          {/* Map + Sidebar layout */}
          <div className="flex flex-col lg:flex-row gap-4">

            {/* ── Map ──────────────────────────────────── */}
            <div className="flex-1 rounded-2xl overflow-hidden border border-gray-200 shadow-sm" style={{ minHeight: 520 }}>
              <MapContainer
                center={[39.1, 35.0]}
                zoom={6}
                style={{ width: '100%', height: '100%', minHeight: 520 }}
                scrollWheelZoom
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <MapFlyTo firm={selectedFirm} />

                {filtered.map((firm) => (
                  <Marker
                    key={firm.id}
                    position={[firm.lat, firm.lng]}
                    icon={makeIcon(firm.verified)}
                    eventHandlers={{ click: () => setSelectedFirm(firm) }}
                  >
                    <Popup>
                      <div className="min-w-[200px] font-sans">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p className="font-bold text-gray-900 text-sm leading-tight">{firm.name}</p>
                          {firm.verified && (
                            <span title="Doğrulanmış firma">
                              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                            </span>
                          )}
                        </div>

                        {/* Badges */}
                        <div className="flex flex-wrap gap-1 mb-2">
                          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${CAT_COLORS[firm.category] ?? 'bg-gray-100 text-gray-600'}`}>
                            <Tag style={{ width: 10, height: 10 }} />
                            {firm.category}
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                            <MapPin style={{ width: 10, height: 10 }} />
                            {firm.city}
                          </span>
                        </div>

                        {/* Address */}
                        <p className="text-xs text-gray-500 mb-1">{firm.address}</p>

                        {/* Phone */}
                        <a
                          href={`tel:${firm.phone.replace(/\s/g, '')}`}
                          className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:underline mb-3"
                        >
                          <Phone style={{ width: 11, height: 11 }} />
                          {firm.phone}
                        </a>

                        {/* CTA */}
                        <Link
                          to="/satici-formu"
                          className="block w-full text-center bg-emerald-600 text-white text-xs font-semibold py-1.5 rounded-lg hover:bg-emerald-700 transition"
                        >
                          Teklif Al
                        </Link>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>

            {/* ── Sidebar firm list ─────────────────────── */}
            <div className="lg:w-72 flex flex-col gap-2 max-h-[520px] overflow-y-auto pr-1">
              {filtered.length === 0 && (
                <div className="text-center text-gray-500 text-sm py-12">
                  Filtrelerle eşleşen firma bulunamadı.
                </div>
              )}
              {filtered.map((firm) => (
                <button
                  key={firm.id}
                  onClick={() => setSelectedFirm(firm)}
                  className={`text-left bg-white border rounded-xl p-3 hover:border-emerald-400 transition ${
                    selectedFirm?.id === firm.id
                      ? 'border-emerald-500 ring-1 ring-emerald-400'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <p className="font-semibold text-gray-800 text-sm leading-tight">{firm.name}</p>
                    {firm.verified && (
                      <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" aria-label="Doğrulanmış" />
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    <span className={`inline-flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded-full ${CAT_COLORS[firm.category] ?? 'bg-gray-100 text-gray-600'}`}>
                      {firm.category}
                    </span>
                    <span className="inline-flex items-center gap-0.5 text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">
                      <MapPin className="w-3 h-3" aria-hidden="true" />
                      {firm.city}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Info note */}
          <p className="mt-4 text-xs text-gray-400 text-center">
            Harita verileri © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="hover:underline">OpenStreetMap</a> katkıcıları.
            Firma konumları yaklaşık olup saha ziyareti önerilir.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
