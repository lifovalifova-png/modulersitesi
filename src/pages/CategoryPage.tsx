import { useState, useMemo, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { FLASH_DEALS, type FlashDeal } from '../data/flashDeals';
import { CATEGORIES } from '../data/categories';
import {
  MapPin, Tag, Calendar, ShieldCheck, Grid, List, Filter, X,
  ChevronLeft, ChevronRight, ChevronDown, SlidersHorizontal, Zap,
} from 'lucide-react';

/* ═══ Sabitler ═════════════════════════════════════════════ */

const CITIES = [
  'Adana','Adıyaman','Afyonkarahisar','Ağrı','Amasya','Ankara','Antalya','Artvin',
  'Aydın','Balıkesir','Bilecik','Bingöl','Bitlis','Bolu','Burdur','Bursa','Çanakkale',
  'Çankırı','Çorum','Denizli','Diyarbakır','Edirne','Elazığ','Erzincan','Erzurum',
  'Eskişehir','Gaziantep','Giresun','Gümüşhane','Hakkari','Hatay','Isparta','Mersin',
  'İstanbul','İzmir','Kars','Kastamonu','Kayseri','Kırklareli','Kırşehir','Kocaeli',
  'Konya','Kütahya','Malatya','Manisa','Kahramanmaraş','Mardin','Muğla','Muş',
  'Nevşehir','Niğde','Ordu','Rize','Sakarya','Samsun','Siirt','Sinop','Sivas',
  'Tekirdağ','Tokat','Trabzon','Tunceli','Şanlıurfa','Uşak','Van','Yozgat',
  'Zonguldak','Aksaray','Bayburt','Karaman','Kırıkkale','Batman','Şırnak',
  'Bartın','Ardahan','Iğdır','Yalova','Karabük','Kilis','Osmaniye','Düzce',
];

const SORT_OPTIONS = [
  { value: 'newest',      label: 'En Yeni' },
  { value: 'price_asc',   label: 'Fiyat: Düşükten Yükseğe' },
  { value: 'price_desc',  label: 'Fiyat: Yüksekten Düşüğe' },
  { value: 'urgent_first', label: 'Acil İlanlar Önce' },
];

const FEATURE_FILTERS = [
  { id: 'acil',          label: 'Acil Satış' },
  { id: 'indirimli',     label: 'İndirimli' },
  { id: 'sifir',         label: 'Sıfır' },
  { id: 'ikinci_el',     label: '2. El' },
  { id: 'mobilyali',     label: 'Mobilyalı' },
  { id: 'anahtar_teslim', label: 'Anahtar Teslim' },
];

const CAT_COLORS: Record<string, string> = {
  'Prefabrik':           'bg-emerald-100 text-emerald-700',
  'Yaşam Konteynerleri': 'bg-blue-100 text-blue-700',
  'Tiny House':          'bg-purple-100 text-purple-700',
  'Çelik Yapılar':       'bg-gray-200 text-gray-700',
  'Ahşap Yapılar':       'bg-amber-100 text-amber-700',
  'Özel Projeler':       'bg-pink-100 text-pink-700',
  '2. El':               'bg-orange-100 text-orange-700',
};

const ITEMS_PER_PAGE = 6;

/* ═══ Yardımcı fonksiyonlar ════════════════════════════════ */

function parsePrice(s: string): number {
  return parseInt(s.replace(/[^\d]/g, ''), 10) || 0;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('tr-TR', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function matchesFeature(deal: FlashDeal, id: string): boolean {
  switch (id) {
    case 'acil':          return deal.urgent;
    case 'indirimli':     return !!deal.discount;
    case 'sifir':         return deal.description.toLowerCase().includes('sıfır') ||
                                 deal.features.some((f) => f.value.toLowerCase().includes('sıfır'));
    case 'ikinci_el':     return deal.category === '2. El' ||
                                 deal.features.some((f) => f.value.toLowerCase().includes('2. el'));
    case 'mobilyali':     return deal.title.toLowerCase().includes('mobilya') ||
                                 deal.description.toLowerCase().includes('mobilya');
    case 'anahtar_teslim':return deal.description.toLowerCase().includes('anahtar teslim');
    default:              return false;
  }
}

/* ═══ Sidebar bileşeni ═════════════════════════════════════ */

interface SidebarProps {
  city: string;          setCity: (v: string) => void;
  priceMin: string;      setPriceMin: (v: string) => void;
  priceMax: string;      setPriceMax: (v: string) => void;
  sort: string;          setSort: (v: string) => void;
  features: string[];    setFeatures: (v: string[]) => void;
  onClear: () => void;
  activeCount: number;
}

function Sidebar({
  city, setCity, priceMin, setPriceMin, priceMax, setPriceMax,
  sort, setSort, features, setFeatures, onClear, activeCount,
}: SidebarProps) {

  const toggleFeature = (id: string) =>
    setFeatures(features.includes(id) ? features.filter((x) => x !== id) : [...features, id]);

  const inp = 'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none';

  return (
    <aside className="space-y-5">
      {/* Başlık + temizle */}
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
          Filtreler
          {activeCount > 0 && (
            <span className="bg-emerald-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </h2>
        {activeCount > 0 && (
          <button
            onClick={onClear}
            className="text-xs text-red-500 hover:text-red-700 transition font-medium"
          >
            Temizle
          </button>
        )}
      </div>

      {/* Fiyat Aralığı */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Fiyat Aralığı (₺)</p>
        <div className="space-y-2">
          <input
            type="number"
            placeholder="Min fiyat"
            value={priceMin}
            onChange={(e) => setPriceMin(e.target.value)}
            min={0}
            className={inp}
          />
          <input
            type="number"
            placeholder="Maks fiyat"
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
            min={0}
            className={inp}
          />
        </div>
      </div>

      {/* Şehir */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Şehir</p>
        <div className="relative">
          <select value={city} onChange={(e) => setCity(e.target.value)} className={inp + ' pr-8'}>
            <option value="">Tüm Şehirler</option>
            {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>
      </div>

      {/* Sıralama */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Sıralama</p>
        <div className="space-y-1.5">
          {SORT_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="radio"
                name="sort"
                value={opt.value}
                checked={sort === opt.value}
                onChange={() => setSort(opt.value)}
                className="w-3.5 h-3.5 text-emerald-600 border-gray-300 focus:ring-emerald-500"
              />
              <span className={`text-sm ${sort === opt.value ? 'text-emerald-700 font-medium' : 'text-gray-600'}`}>
                {opt.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Özellikler */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Özellikler</p>
        <div className="space-y-1.5">
          {FEATURE_FILTERS.map((f) => (
            <label key={f.id} className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={features.includes(f.id)}
                onChange={() => toggleFeature(f.id)}
                className="w-3.5 h-3.5 rounded text-emerald-600 border-gray-300 focus:ring-emerald-500"
              />
              <span className={`text-sm ${features.includes(f.id) ? 'text-emerald-700 font-medium' : 'text-gray-600'}`}>
                {f.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Temizle Butonu */}
      {activeCount > 0 && (
        <button
          onClick={onClear}
          className="w-full text-sm text-red-500 border border-red-200 bg-red-50 hover:bg-red-100 py-2 rounded-lg transition font-medium"
        >
          Filtreleri Temizle
        </button>
      )}
    </aside>
  );
}

/* ═══ İlan Kartları ════════════════════════════════════════ */

function GridCard({ deal }: { deal: FlashDeal }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md hover:border-emerald-200 transition flex flex-col">
      <Link to={`/ilan/${deal.id}`} className="block">
        <div className="relative h-48">
          <img src={deal.image} alt={deal.title} loading="lazy" className="w-full h-full object-cover" />
          {deal.urgent && (
            <span className="absolute top-3 left-3 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1">
              <Zap className="w-2.5 h-2.5" />ACİL
            </span>
          )}
          {deal.discount && (
            <span className="absolute top-3 right-3 bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded-md">
              %{deal.discount} İND.
            </span>
          )}
        </div>
      </Link>
      <div className="p-4 flex flex-col flex-1">
        {/* Badges */}
        <div className="flex items-center gap-1.5 flex-wrap mb-2">
          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${CAT_COLORS[deal.category] ?? 'bg-gray-100 text-gray-600'}`}>
            <Tag className="w-2.5 h-2.5" />{deal.category}
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
            <MapPin className="w-2.5 h-2.5" />{deal.location}
          </span>
        </div>

        <Link to={`/ilan/${deal.id}`} className="font-semibold text-gray-800 text-sm leading-snug line-clamp-2 hover:text-emerald-600 transition mb-2 flex-1">
          {deal.title}
        </Link>

        {/* Fiyat + Tarih */}
        <div className="flex items-end justify-between mb-3">
          <div>
            <p className="text-emerald-600 font-extrabold text-lg leading-none">{deal.price}</p>
            {deal.originalPrice && (
              <p className="text-xs text-gray-400 line-through">{deal.originalPrice}</p>
            )}
          </div>
          <span className="text-[10px] text-gray-400 flex items-center gap-1">
            <Calendar className="w-2.5 h-2.5" />{formatDate(deal.date)}
          </span>
        </div>

        {/* Firma + Teklif */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-xs text-gray-500 truncate max-w-[120px]">{deal.firmName}</span>
            {deal.firmVerified && (
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" aria-label="Doğrulanmış" />
            )}
          </div>
          <Link
            to={`/ilan/${deal.id}`}
            className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 transition font-semibold flex-shrink-0"
          >
            Teklif Al
          </Link>
        </div>
      </div>
    </div>
  );
}

function ListCard({ deal }: { deal: FlashDeal }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md hover:border-emerald-200 transition flex">
      {/* Görsel */}
      <Link to={`/ilan/${deal.id}`} className="block flex-shrink-0">
        <div className="relative w-44 sm:w-56 h-full min-h-[140px]">
          <img src={deal.image} alt={deal.title} loading="lazy" className="w-full h-full object-cover" />
          {deal.urgent && (
            <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
              <Zap className="w-2.5 h-2.5" />ACİL
            </span>
          )}
          {deal.discount && (
            <span className="absolute top-2 right-2 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">
              %{deal.discount}
            </span>
          )}
        </div>
      </Link>

      {/* İçerik */}
      <div className="flex-1 p-4 flex flex-col min-w-0">
        {/* Badges */}
        <div className="flex items-center gap-1.5 flex-wrap mb-2">
          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${CAT_COLORS[deal.category] ?? 'bg-gray-100 text-gray-600'}`}>
            <Tag className="w-2.5 h-2.5" />{deal.category}
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
            <MapPin className="w-2.5 h-2.5" />{deal.location}
          </span>
          <span className="text-[10px] text-gray-400 flex items-center gap-1">
            <Calendar className="w-2.5 h-2.5" />{formatDate(deal.date)}
          </span>
        </div>

        <Link to={`/ilan/${deal.id}`} className="font-semibold text-gray-800 leading-snug line-clamp-2 hover:text-emerald-600 transition mb-2 flex-1">
          {deal.title}
        </Link>

        {/* Alt satır: fiyat + firma + buton */}
        <div className="flex flex-wrap items-center gap-3 mt-auto pt-3 border-t border-gray-100">
          <div>
            <p className="text-emerald-600 font-extrabold text-xl leading-none">{deal.price}</p>
            {deal.originalPrice && (
              <p className="text-xs text-gray-400 line-through">{deal.originalPrice}</p>
            )}
          </div>
          <div className="flex items-center gap-1 ml-auto">
            <span className="text-xs text-gray-500 hidden sm:block truncate max-w-[120px]">{deal.firmName}</span>
            {deal.firmVerified && <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" aria-label="Doğrulanmış" />}
          </div>
          <Link
            to={`/ilan/${deal.id}`}
            className="text-sm bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition font-semibold flex-shrink-0"
          >
            Teklif Al
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ═══ Sayfalama ════════════════════════════════════════════ */

function Pagination({
  page, totalPages, onChange,
}: { page: number; totalPages: number; onChange: (p: number) => void }) {
  if (totalPages <= 1) return null;

  const pages: (number | '…')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('…');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push('…');
    pages.push(totalPages);
  }

  const btn = (label: React.ReactNode, active: boolean, onClick: () => void, disabled = false) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`min-w-[36px] h-9 px-2 rounded-lg text-sm font-medium transition ${
        active
          ? 'bg-emerald-600 text-white'
          : disabled
          ? 'text-gray-300 cursor-not-allowed'
          : 'text-gray-600 hover:bg-gray-100 border border-gray-200'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex items-center justify-center gap-1.5 mt-10">
      {btn(<ChevronLeft className="w-4 h-4 mx-auto" />, false, () => onChange(page - 1), page === 1)}
      {pages.map((p, i) =>
        p === '…'
          ? <span key={`e${i}`} className="px-1 text-gray-400 select-none">…</span>
          : btn(p, p === page, () => onChange(Number(p)))
      )}
      {btn(<ChevronRight className="w-4 h-4 mx-auto" />, false, () => onChange(page + 1), page === totalPages)}
    </div>
  );
}

/* ═══ Ana Sayfa Bileşeni ═══════════════════════════════════ */

export default function CategoryPage() {
  const { slug }             = useParams<{ slug: string }>();
  const [searchParams]       = useSearchParams();

  /* --- Filtre state'i --- */
  const [viewMode,    setViewMode]    = useState<'grid' | 'list'>('grid');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [city,        setCity]        = useState(searchParams.get('sehir') ?? '');
  const [priceMin,    setPriceMin]    = useState('');
  const [priceMax,    setPriceMax]    = useState('');
  const [sort,        setSort]        = useState('newest');
  const [features,    setFeatures]    = useState<string[]>([]);
  const [page,        setPage]        = useState(1);

  /* Slug veya herhangi bir filtre değişince 1. sayfaya dön */
  useEffect(() => { setPage(1); }, [slug, city, priceMin, priceMax, sort, features]);

  /* Slug değişince mobilden açık kalan sidebar'ı kapat */
  useEffect(() => { setSidebarOpen(false); }, [slug]);

  /* Kategori bilgisi */
  const category = CATEGORIES.find((c) => c.slug === slug);

  /* Aktif filtre sayısı */
  const activeCount = [
    city, priceMin, priceMax,
    sort !== 'newest' ? 'sort' : '',
    ...features,
  ].filter(Boolean).length;

  /* Filtreleri temizle */
  const clearFilters = () => {
    setCity(''); setPriceMin(''); setPriceMax('');
    setSort('newest'); setFeatures([]);
  };

  /* Filtrelenmiş + sıralanmış liste */
  const filtered = useMemo(() => {
    let result = FLASH_DEALS.filter((d) => {
      if (category && d.category !== category.name) return false;
      if (city && d.location !== city) return false;
      if (priceMin && parsePrice(d.price) < Number(priceMin)) return false;
      if (priceMax && parsePrice(d.price) > Number(priceMax)) return false;
      if (features.length > 0 && !features.some((id) => matchesFeature(d, id))) return false;
      return true;
    });

    switch (sort) {
      case 'price_asc':    result = [...result].sort((a, b) => parsePrice(a.price) - parsePrice(b.price)); break;
      case 'price_desc':   result = [...result].sort((a, b) => parsePrice(b.price) - parsePrice(a.price)); break;
      case 'urgent_first': result = [...result].sort((a, b) => (b.urgent ? 1 : 0) - (a.urgent ? 1 : 0));  break;
      default:             result = [...result].sort((a, b) => b.date.localeCompare(a.date));
    }
    return result;
  }, [slug, category, city, priceMin, priceMax, sort, features]);

  /* Sayfalama */
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated  = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const pageTitle = category?.fullName ?? 'Tüm İlanlar';

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">

          {/* Breadcrumb */}
          <nav className="text-sm text-gray-500 mb-5 flex items-center gap-1.5 flex-wrap">
            <Link to="/" className="hover:text-emerald-600 transition">Ana Sayfa</Link>
            <span>/</span>
            <span className="text-gray-800">{pageTitle}</span>
          </nav>

          {/* Sayfa başlığı + üst kontroller */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{pageTitle}</h1>
              <p className="text-gray-500 text-sm mt-1">
                {filtered.length} ilan bulundu
                {activeCount > 0 && (
                  <button onClick={clearFilters} className="ml-2 text-red-500 hover:text-red-700 underline text-xs">
                    filtreleri temizle
                  </button>
                )}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Sıralama — desktop'ta da header üstünde */}
              <div className="relative hidden sm:block">
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-lg text-sm text-gray-700 px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>

              {/* Görünüm toggle */}
              <div className="hidden md:flex items-center border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  aria-label="Izgara görünümü"
                  aria-pressed={viewMode === 'grid'}
                  className={`p-2 transition ${viewMode === 'grid' ? 'bg-emerald-50 text-emerald-600' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  aria-label="Liste görünümü"
                  aria-pressed={viewMode === 'list'}
                  className={`p-2 transition ${viewMode === 'list' ? 'bg-emerald-50 text-emerald-600' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              {/* Mobil filtre butonu */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
              >
                <Filter className="w-4 h-4" />
                Filtrele
                {activeCount > 0 && (
                  <span className="bg-emerald-600 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                    {activeCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* İçerik: sidebar + ilanlar */}
          <div className="flex gap-7">

            {/* ── Sidebar — desktop daima görünür ───────── */}
            <div className="hidden lg:block w-56 flex-shrink-0">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sticky top-24">
                <Sidebar
                  city={city} setCity={setCity}
                  priceMin={priceMin} setPriceMin={setPriceMin}
                  priceMax={priceMax} setPriceMax={setPriceMax}
                  sort={sort} setSort={setSort}
                  features={features} setFeatures={setFeatures}
                  onClear={clearFilters}
                  activeCount={activeCount}
                />
              </div>
            </div>

            {/* ── Mobil sidebar overlay ─────────────────── */}
            {sidebarOpen && (
              <div className="fixed inset-0 z-50 lg:hidden">
                <div
                  className="absolute inset-0 bg-black/40"
                  onClick={() => setSidebarOpen(false)}
                />
                <div className="absolute right-0 top-0 bottom-0 w-72 bg-white shadow-xl overflow-y-auto">
                  <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <span className="font-semibold text-gray-800">Filtreler</span>
                    <button
                      onClick={() => setSidebarOpen(false)}
                      aria-label="Filtreleri kapat"
                      className="p-1 hover:bg-gray-100 rounded-lg transition"
                    >
                      <X className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>
                  <div className="p-5">
                    <Sidebar
                      city={city} setCity={setCity}
                      priceMin={priceMin} setPriceMin={setPriceMin}
                      priceMax={priceMax} setPriceMax={setPriceMax}
                      sort={sort} setSort={setSort}
                      features={features} setFeatures={setFeatures}
                      onClear={clearFilters}
                      activeCount={activeCount}
                    />
                    <button
                      onClick={() => setSidebarOpen(false)}
                      className="w-full mt-5 bg-emerald-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-emerald-700 transition"
                    >
                      {filtered.length} İlanı Göster
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── İlanlar ───────────────────────────────── */}
            <div className="flex-1 min-w-0">
              {paginated.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 py-20 text-center">
                  <p className="text-4xl mb-4">🔍</p>
                  <p className="font-semibold text-gray-700 mb-1">Uygun ilan bulunamadı</p>
                  <p className="text-sm text-gray-400 mb-5">Filtrelerinizi değiştirmeyi deneyin.</p>
                  <button
                    onClick={clearFilters}
                    className="text-sm bg-emerald-600 text-white px-5 py-2 rounded-lg hover:bg-emerald-700 transition"
                  >
                    Filtreleri Temizle
                  </button>
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {paginated.map((deal) => <GridCard key={deal.id} deal={deal} />)}
                </div>
              ) : (
                <div className="space-y-3">
                  {paginated.map((deal) => <ListCard key={deal.id} deal={deal} />)}
                </div>
              )}

              {/* Sayfalama */}
              <Pagination page={page} totalPages={totalPages} onChange={setPage} />

              {/* Sonuç özeti */}
              {filtered.length > 0 && (
                <p className="text-center text-xs text-gray-400 mt-4">
                  {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, filtered.length)} / {filtered.length} ilan gösteriliyor
                </p>
              )}
            </div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
