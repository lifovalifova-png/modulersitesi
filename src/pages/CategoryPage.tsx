import { useState, useMemo, useEffect, memo } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { CATEGORIES } from '../data/categories';
import { useIlanlar, formatFiyat, formatTarih, type Ilan } from '../hooks/useIlanlar';
import SEOMeta from '../components/SEOMeta';
import { useLanguage } from '../context/LanguageContext';
import {
  MapPin, Tag, Calendar, ShieldCheck, Grid, List, Filter, X,
  ChevronLeft, ChevronRight, ChevronDown, SlidersHorizontal, Zap, Loader2,
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

const PRICE_RANGES = [
  { label: 'Tümü',                      min: 0,       max: Infinity },
  { label: '0 – 100.000 TL',            min: 0,       max: 100000   },
  { label: '100.000 – 250.000 TL',      min: 100000,  max: 250000   },
  { label: '250.000 – 500.000 TL',      min: 250000,  max: 500000   },
  { label: '500.000 – 1.000.000 TL',    min: 500000,  max: 1000000  },
  { label: '1.000.000 – 1.500.000 TL',  min: 1000000, max: 1500000  },
  { label: '1.500.000 – 2.000.000 TL',  min: 1500000, max: 2000000  },
  { label: '2.000.000 TL ve üzeri',     min: 2000000, max: Infinity },
];

const SORT_VALUES = ['newest', 'price_asc', 'price_desc', 'urgent_first'] as const;
const SORT_KEYS: Record<string, string> = {
  newest:       'category.sortNewest',
  price_asc:    'category.sortPriceLow',
  price_desc:   'category.sortPriceHigh',
  urgent_first: 'category.sortUrgent',
};

const FEATURE_IDS = ['acilSatis', 'acil', 'indirimli', 'sifir', 'ikinci_el', 'mobilyali', 'anahtar_teslim'] as const;
const FEATURE_KEYS: Record<string, string> = {
  acilSatis:      'category.featUrgentSale',
  acil:           'category.featUrgent',
  indirimli:      'category.featDiscount',
  sifir:          'category.featNew',
  ikinci_el:      'category.featSecondHand',
  mobilyali:      'category.featFurnished',
  anahtar_teslim: 'category.featTurnkey',
};

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

function matchesFeature(ilan: Ilan, id: string): boolean {
  switch (id) {
    case 'acilSatis':     return ilan.acilSatis === true;
    case 'acil':          return ilan.acil;
    case 'indirimli':     return ilan.indirimli;
    case 'sifir':         return ilan.aciklama.toLowerCase().includes('sıfır');
    case 'ikinci_el':     return ilan.kategori === '2. El' ||
                                 ilan.aciklama.toLowerCase().includes('2. el');
    case 'mobilyali':     return ilan.aciklama.toLowerCase().includes('mobilya') ||
                                 ilan.baslik.toLowerCase().includes('mobilya');
    case 'anahtar_teslim':return ilan.aciklama.toLowerCase().includes('anahtar teslim');
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
  const { t } = useLanguage();

  const toggleFeature = (id: string) =>
    setFeatures(features.includes(id) ? features.filter((x) => x !== id) : [...features, id]);

  const inp = 'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none';

  return (
    <aside className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
          {t('category.filters')}
          {activeCount > 0 && (
            <span className="bg-emerald-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </h2>
        {activeCount > 0 && (
          <button onClick={onClear} className="text-xs text-red-500 hover:text-red-700 transition font-medium">
            {t('category.clearFilters')}
          </button>
        )}
      </div>

      {/* Fiyat Aralığı */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{t('category.priceRange')}</p>
        <div className="relative">
          <select
            value={
              !priceMin && !priceMax
                ? ''
                : `${priceMin || '0'},${priceMax || 'inf'}`
            }
            onChange={(e) => {
              const v = e.target.value;
              if (!v) { setPriceMin(''); setPriceMax(''); return; }
              const [minStr, maxStr] = v.split(',');
              setPriceMin(minStr === '0' ? '' : minStr);
              setPriceMax(maxStr === 'inf' ? '' : maxStr);
            }}
            className={inp + ' pr-8'}
          >
            {PRICE_RANGES.map((r, i) => (
              <option
                key={i}
                value={i === 0 ? '' : `${r.min},${r.max === Infinity ? 'inf' : r.max}`}
              >
                {i === 0 ? t('category.allPrices') : r.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>
      </div>

      {/* Şehir */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{t('category.city')}</p>
        <div className="relative">
          <select value={city} onChange={(e) => setCity(e.target.value)} className={inp + ' pr-8'}>
            <option value="">{t('category.allCities')}</option>
            {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>
      </div>

      {/* Sıralama */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{t('category.sort')}</p>
        <div className="space-y-1.5">
          {SORT_VALUES.map((val) => (
            <label key={val} className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="radio" name="sort" value={val}
                checked={sort === val} onChange={() => setSort(val)}
                className="w-3.5 h-3.5 text-emerald-600 border-gray-300 focus:ring-emerald-500"
              />
              <span className={`text-sm ${sort === val ? 'text-emerald-700 font-medium' : 'text-gray-600'}`}>
                {t(SORT_KEYS[val])}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Özellikler */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{t('category.features')}</p>
        <div className="space-y-1.5">
          {FEATURE_IDS.map((id) => (
            <label key={id} className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox" checked={features.includes(id)}
                onChange={() => toggleFeature(id)}
                className="w-3.5 h-3.5 rounded text-emerald-600 border-gray-300 focus:ring-emerald-500"
              />
              <span className={`text-sm ${features.includes(id) ? 'text-emerald-700 font-medium' : 'text-gray-600'}`}>
                {t(FEATURE_KEYS[id])}
              </span>
            </label>
          ))}
        </div>
      </div>

      {activeCount > 0 && (
        <button onClick={onClear}
          className="w-full text-sm text-red-500 border border-red-200 bg-red-50 hover:bg-red-100 py-2 rounded-lg transition font-medium">
          {t('category.clearAll')}
        </button>
      )}
    </aside>
  );
}

/* ═══ İlan Kartları ════════════════════════════════════════ */

const GridCard = memo(function GridCard({ ilan }: { ilan: Ilan }) {
  const { t } = useLanguage();
  const img = ilan.gorseller[0] ?? '';
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md hover:border-emerald-200 transition flex flex-col">
      <Link to={`/ilan/${ilan.id}`} className="block">
        <div className="relative h-48 bg-gray-100">
          {img ? (
            <img src={img} alt={ilan.baslik} loading="lazy" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300 text-4xl">🏠</div>
          )}
          {ilan.acilSatis && (
            <span className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1 animate-pulse">
              🔴 {t('badge.urgentSale')}
            </span>
          )}
          {!ilan.acilSatis && ilan.acil && (
            <span className="absolute top-3 left-3 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1">
              <Zap className="w-2.5 h-2.5" />{t('badge.urgent')}
            </span>
          )}
          {ilan.indirimli && (
            <span className="absolute top-3 right-3 bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded-md">
              {t('badge.discounted')}
            </span>
          )}
        </div>
      </Link>
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center gap-1.5 flex-wrap mb-2">
          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${CAT_COLORS[ilan.kategori] ?? 'bg-gray-100 text-gray-600'}`}>
            <Tag className="w-2.5 h-2.5" />{ilan.kategori}
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
            <MapPin className="w-2.5 h-2.5" />{ilan.sehir}
          </span>
        </div>

        <Link to={`/ilan/${ilan.id}`}
          className="font-semibold text-gray-800 text-sm leading-snug line-clamp-2 hover:text-emerald-600 transition mb-2 flex-1">
          {ilan.baslik}
        </Link>

        <div className="flex items-end justify-between mb-3">
          <p className={`font-extrabold text-lg leading-none ${ilan.acilSatis ? 'text-red-600' : 'text-emerald-600'}`}>
            {ilan.acilSatis && ilan.acilSatisFiyat ? formatFiyat(ilan.acilSatisFiyat) : formatFiyat(ilan.fiyat)}
          </p>
          <span className="text-[10px] text-gray-400 flex items-center gap-1">
            <Calendar className="w-2.5 h-2.5" />{formatTarih(ilan.tarih)}
          </span>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-xs text-gray-500 truncate max-w-[120px]">{ilan.firmaAdi}</span>
            {ilan.firmaDogrulanmis && (
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" aria-label={t('common.verified')} />
            )}
          </div>
          <Link to={`/ilan/${ilan.id}`}
            className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 transition font-semibold flex-shrink-0">
            {t('category.getQuote')}
          </Link>
        </div>
      </div>
    </div>
  );
});

const ListCard = memo(function ListCard({ ilan }: { ilan: Ilan }) {
  const { t } = useLanguage();
  const img = ilan.gorseller[0] ?? '';
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md hover:border-emerald-200 transition flex">
      <Link to={`/ilan/${ilan.id}`} className="block flex-shrink-0">
        <div className="relative w-44 sm:w-56 h-full min-h-[140px] bg-gray-100">
          {img ? (
            <img src={img} alt={ilan.baslik} loading="lazy" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300 text-3xl">🏠</div>
          )}
          {ilan.acilSatis && (
            <span className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 animate-pulse">
              🔴 {t('badge.urgentSale')}
            </span>
          )}
          {!ilan.acilSatis && ilan.acil && (
            <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
              <Zap className="w-2.5 h-2.5" />{t('badge.urgent')}
            </span>
          )}
          {ilan.indirimli && (
            <span className="absolute top-2 right-2 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">
              {t('badge.discounted')}
            </span>
          )}
        </div>
      </Link>

      <div className="flex-1 p-4 flex flex-col min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap mb-2">
          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${CAT_COLORS[ilan.kategori] ?? 'bg-gray-100 text-gray-600'}`}>
            <Tag className="w-2.5 h-2.5" />{ilan.kategori}
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
            <MapPin className="w-2.5 h-2.5" />{ilan.sehir}
          </span>
          <span className="text-[10px] text-gray-400 flex items-center gap-1">
            <Calendar className="w-2.5 h-2.5" />{formatTarih(ilan.tarih)}
          </span>
        </div>

        <Link to={`/ilan/${ilan.id}`}
          className="font-semibold text-gray-800 leading-snug line-clamp-2 hover:text-emerald-600 transition mb-2 flex-1">
          {ilan.baslik}
        </Link>

        <div className="flex flex-wrap items-center gap-3 mt-auto pt-3 border-t border-gray-100">
          <p className={`font-extrabold text-xl leading-none ${ilan.acilSatis ? 'text-red-600' : 'text-emerald-600'}`}>
            {ilan.acilSatis && ilan.acilSatisFiyat ? formatFiyat(ilan.acilSatisFiyat) : formatFiyat(ilan.fiyat)}
          </p>
          <div className="flex items-center gap-1 ml-auto">
            <span className="text-xs text-gray-500 hidden sm:block truncate max-w-[120px]">{ilan.firmaAdi}</span>
            {ilan.firmaDogrulanmis && <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" aria-label={t('common.verified')} />}
          </div>
          <Link to={`/ilan/${ilan.id}`}
            className="text-sm bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition font-semibold flex-shrink-0">
            {t('category.getQuote')}
          </Link>
        </div>
      </div>
    </div>
  );
});

/* ═══ Loading skeleton ═════════════════════════════════════ */
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden animate-pulse">
      <div className="h-48 bg-gray-200" />
      <div className="p-4 space-y-3">
        <div className="h-3 bg-gray-200 rounded w-1/2" />
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        <div className="h-8 bg-gray-200 rounded mt-4" />
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
    <button onClick={onClick} disabled={disabled}
      className={`min-w-[36px] h-9 px-2 rounded-lg text-sm font-medium transition ${
        active ? 'bg-emerald-600 text-white'
        : disabled ? 'text-gray-300 cursor-not-allowed'
        : 'text-gray-600 hover:bg-gray-100 border border-gray-200'
      }`}>
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
  const { slug }       = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();

  /* Filtre state */
  const [viewMode,    setViewMode]    = useState<'grid' | 'list'>('grid');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [city,        setCity]        = useState(searchParams.get('sehir') ?? '');
  const [priceMin,    setPriceMin]    = useState('');
  const [priceMax,    setPriceMax]    = useState('');
  const [sort,        setSort]        = useState('newest');
  const [features,    setFeatures]    = useState<string[]>([]);
  const [page,        setPage]        = useState(1);

  /* Firestore — kategori slug hook'a verilir, şehir client-side filtre */
  const { ilanlar, loading, error, hasMore, loadingMore, loadMore } = useIlanlar(slug ?? undefined);

  /* Sayfa sıfırla */
  useEffect(() => { setPage(1); }, [slug, city, priceMin, priceMax, sort, features]);
  useEffect(() => { setSidebarOpen(false); }, [slug]);

  const { t } = useLanguage();

  const category   = CATEGORIES.find((c) => c.slug === slug);
  const activeCount = [city, (priceMin || priceMax) ? 'price' : '', sort !== 'newest' ? 'sort' : '', ...features].filter(Boolean).length;
  const h1Title    = category ? `${category.fullName} ${t('category.listingsSuffix')}` : t('category.allListings');

  const clearFilters = () => {
    setCity(''); setPriceMin(''); setPriceMax('');
    setSort('newest'); setFeatures([]);
  };

  /* Filtrelenmiş + sıralanmış liste */
  const filtered = useMemo(() => {
    let result = ilanlar.filter((d) => {
      if (city     && d.sehir !== city)                                    return false;
      if (priceMin && d.fiyat < Number(priceMin))                          return false;
      if (priceMax && d.fiyat > Number(priceMax))                          return false;
      if (features.length > 0 && !features.some((id) => matchesFeature(d, id))) return false;
      return true;
    });

    switch (sort) {
      case 'price_asc':    result = [...result].sort((a, b) => a.fiyat - b.fiyat); break;
      case 'price_desc':   result = [...result].sort((a, b) => b.fiyat - a.fiyat); break;
      case 'urgent_first': result = [...result].sort((a, b) => (b.acil ? 1 : 0) - (a.acil ? 1 : 0)); break;
      default:             result = [...result].sort((a, b) => (b.tarih?.seconds ?? 0) - (a.tarih?.seconds ?? 0));
    }
    // acilSatis olanları en üste taşı (tüm sort'lardan sonra)
    result.sort((a, b) => (b.acilSatis ? 1 : 0) - (a.acilSatis ? 1 : 0));
    return result;
  }, [ilanlar, city, priceMin, priceMax, sort, features]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated  = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
  const pageTitle  = category?.fullName ?? 'Tüm İlanlar';

  return (
    <div className="flex flex-col min-h-screen">
      <SEOMeta
        title={`${pageTitle} İlanları`}
        description={`${pageTitle} ilanları — ModülerPazar'da ${pageTitle.toLowerCase()} fiyatları ve firmaları. Ücretsiz teklif alın.`}
        url={`/kategori/${slug}`}
      />
      <Header />

      <main className="flex-1 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">

          {/* Breadcrumb */}
          <nav className="text-sm text-gray-500 mb-5 flex items-center gap-1.5 flex-wrap">
            <Link to="/" className="hover:text-emerald-600 transition">{t('common.home')}</Link>
            <span>/</span>
            <span className="text-gray-800">{pageTitle}</span>
          </nav>

          {/* Başlık + üst kontroller */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{h1Title}</h1>
              <p className="text-gray-500 text-sm mt-1">
                {loading ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> {t('category.loading')}
                  </span>
                ) : (
                  <>
                    {filtered.length} {t('category.found')}
                    {activeCount > 0 && (
                      <button onClick={clearFilters} className="ml-2 text-red-500 hover:text-red-700 underline text-xs">
                        {t('category.clearLink')}
                      </button>
                    )}
                  </>
                )}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative hidden sm:block">
                <select value={sort} onChange={(e) => setSort(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-lg text-sm text-gray-700 px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  {SORT_VALUES.map((val) => <option key={val} value={val}>{t(SORT_KEYS[val])}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>

              <div className="hidden md:flex items-center border border-gray-300 rounded-lg overflow-hidden">
                <button onClick={() => setViewMode('grid')} aria-pressed={viewMode === 'grid'} aria-label={t('category.gridView')}
                  className={`p-2 transition ${viewMode === 'grid' ? 'bg-emerald-50 text-emerald-600' : 'text-gray-500 hover:bg-gray-50'}`}>
                  <Grid className="w-4 h-4" />
                </button>
                <button onClick={() => setViewMode('list')} aria-pressed={viewMode === 'list'} aria-label={t('category.listView')}
                  className={`p-2 transition ${viewMode === 'list' ? 'bg-emerald-50 text-emerald-600' : 'text-gray-500 hover:bg-gray-50'}`}>
                  <List className="w-4 h-4" />
                </button>
              </div>

              <button onClick={() => setSidebarOpen(true)}
                className="lg:hidden flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition">
                <Filter className="w-4 h-4" />{t('category.filter')}
                {activeCount > 0 && (
                  <span className="bg-emerald-600 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">{activeCount}</span>
                )}
              </button>
            </div>
          </div>

          {/* İçerik: sidebar + ilanlar */}
          <div className="flex gap-7">

            {/* Desktop sidebar */}
            <div className="hidden lg:block w-56 flex-shrink-0">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sticky top-24">
                <Sidebar city={city} setCity={setCity} priceMin={priceMin} setPriceMin={setPriceMin}
                  priceMax={priceMax} setPriceMax={setPriceMax} sort={sort} setSort={setSort}
                  features={features} setFeatures={setFeatures} onClear={clearFilters} activeCount={activeCount} />
              </div>
            </div>

            {/* Mobil sidebar overlay */}
            {sidebarOpen && (
              <div className="fixed inset-0 z-50 lg:hidden">
                <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
                <div className="absolute right-0 top-0 bottom-0 w-72 bg-white shadow-xl overflow-y-auto">
                  <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <span className="font-semibold text-gray-800">{t('category.filters')}</span>
                    <button onClick={() => setSidebarOpen(false)} aria-label={t('common.close')}
                      className="p-1 hover:bg-gray-100 rounded-lg transition">
                      <X className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>
                  <div className="p-5">
                    <Sidebar city={city} setCity={setCity} priceMin={priceMin} setPriceMin={setPriceMin}
                      priceMax={priceMax} setPriceMax={setPriceMax} sort={sort} setSort={setSort}
                      features={features} setFeatures={setFeatures} onClear={clearFilters} activeCount={activeCount} />
                    <button onClick={() => setSidebarOpen(false)}
                      className="w-full mt-5 bg-emerald-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-emerald-700 transition">
                      {filtered.length} {t('category.showListings')}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* İlanlar */}
            <div className="flex-1 min-w-0">

              {/* Hata */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm mb-4">
                  {t('category.error')} {error}
                </div>
              )}

              {/* Loading skeleton */}
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
              ) : paginated.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 py-20 text-center">
                  <p className="text-4xl mb-4">🔍</p>
                  {activeCount > 0 ? (
                    <>
                      <p className="font-semibold text-gray-700 mb-1">{t('category.noResults')}</p>
                      <p className="text-sm text-gray-400 mb-5">{t('category.tryFilters')}</p>
                      <button onClick={clearFilters}
                        className="text-sm bg-emerald-600 text-white px-5 py-2 rounded-lg hover:bg-emerald-700 transition">
                        {t('category.clearAll')}
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="text-5xl mb-4">🏗️</p>
                      <p className="font-semibold text-gray-700 mb-1 text-lg">{t('category.noCategoryAds')}</p>
                      <p className="text-sm text-gray-400 mb-6 max-w-xs mx-auto">
                        {t('category.noCategoryDesc')}
                      </p>
                      <Link
                        to="/talep-olustur"
                        className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-emerald-700 transition"
                      >
                        {t('category.firstQuote')}
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </>
                  )}
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {paginated.map((ilan) => <GridCard key={ilan.id} ilan={ilan} />)}
                </div>
              ) : (
                <div className="space-y-3">
                  {paginated.map((ilan) => <ListCard key={ilan.id} ilan={ilan} />)}
                </div>
              )}

              {!loading && (
                <>
                  <Pagination page={page} totalPages={totalPages} onChange={setPage} />
                  {filtered.length > 0 && (
                    <p className="text-center text-xs text-gray-400 mt-4">
                      {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, filtered.length)} / {filtered.length} {t('category.showing')}
                    </p>
                  )}

                  {/* Daha fazla Firestore sayfası var mı? */}
                  {hasMore && (
                    <div className="flex justify-center mt-6">
                      <button
                        onClick={loadMore}
                        disabled={loadingMore}
                        className="flex items-center gap-2 border border-emerald-300 text-emerald-700 bg-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-emerald-50 transition disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {loadingMore ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            {t('category.loading')}
                          </>
                        ) : (
                          t('category.loadMore')
                        )}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
