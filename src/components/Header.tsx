import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, ChevronDown, Search, Phone, Map, UserCircle, FileText, LogOut, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { CATEGORIES } from '../data/categories';
import { SITE_CONFIG } from '../config/site';
import { useAuth } from '../context/AuthContext';
import UserMenu from './UserMenu';
import logoSrc from '../assets/logo.svg';

/* ─── 81 il listesi ───────────────────────────────────────── */
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

export default function Header() {
  const navigate = useNavigate();
  const { currentUser, role, logout } = useAuth();

  function handleTeklifIste() {
    if (!currentUser) {
      navigate('/giris', { state: { from: { pathname: '/talep-olustur' } } });
      return;
    }
    navigate('/talep-olustur');
  }

  function handleIlanVer() {
    if (!currentUser) { navigate('/giris'); return; }
    if (role === 'seller') { navigate('/satici-formu'); return; }
    toast('İlan vermek için satıcı hesabı gereklidir.', {
      description: 'Firma hesabı açarak ücretsiz ilan verebilirsiniz.',
      action: { label: 'Satıcı Hesabı Aç', onClick: () => navigate('/kayit') },
      duration: 6000,
    });
  }

  /* state */
  const [mobileMenuOpen,       setMobileMenuOpen]       = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [searchOpen,           setSearchOpen]           = useState(false); // mobile filter panel
  const [query,                setQuery]                = useState('');
  const [selectedCategory,     setSelectedCategory]     = useState('');
  const [selectedCity,         setSelectedCity]         = useState('');

  const searchInputRef = useRef<HTMLInputElement>(null);

  /* focus search input when panel opens */
  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [searchOpen]);

  /* build URL and navigate */
  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    const params = new URLSearchParams();
    if (query)            params.set('q', query);
    if (selectedCity)     params.set('sehir', selectedCity);

    const slug = selectedCategory || 'prefabrik';
    const qs   = params.toString();
    navigate(`/kategori/${slug}${qs ? `?${qs}` : ''}`);
    setMobileMenuOpen(false);
    setSearchOpen(false);
  };

  /* ── Shared filter fields ─────────────────────────────── */
  const FilterFields = ({ compact = false }: { compact?: boolean }) => (
    <>
      {/* Kategori */}
      <div className={compact ? 'w-full' : 'relative'}>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          aria-label="Kategori seç"
          className={`appearance-none border border-gray-300 rounded-lg bg-white text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent pr-8 ${
            compact ? 'w-full px-3 py-2' : 'px-3 py-2 w-44'
          }`}
        >
          <option value="">Tüm Kategoriler</option>
          {CATEGORIES.map((cat) => (
            <option key={cat.slug} value={cat.slug}>{cat.name}</option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" aria-hidden="true" />
      </div>

      {/* Şehir */}
      <div className={compact ? 'w-full' : 'relative'}>
        <select
          value={selectedCity}
          onChange={(e) => setSelectedCity(e.target.value)}
          aria-label="Şehir seç"
          className={`appearance-none border border-gray-300 rounded-lg bg-white text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent pr-8 ${
            compact ? 'w-full px-3 py-2' : 'px-3 py-2 w-36'
          }`}
        >
          <option value="">Tüm Şehirler</option>
          {CITIES.map((city) => (
            <option key={city} value={city}>{city}</option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" aria-hidden="true" />
      </div>
    </>
  );

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">

      {/* Top Bar */}
      <div className="bg-emerald-700 text-white py-2 px-4 text-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <span className="flex items-center gap-2">
            <Phone className="w-4 h-4" aria-hidden="true" />
            <span className="hidden sm:inline">Destek Hattı:</span> {SITE_CONFIG.phone}
          </span>
          <button onClick={handleIlanVer} className="hover:underline">
            Ücretsiz İlan Ver
          </button>
        </div>
      </div>

      {/* Main Header */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">

          {/* Logo */}
          <Link to="/" className="flex items-center flex-shrink-0" aria-label="ModülerPazar ana sayfa">
            <img src={logoSrc} alt="ModülerPazar" className="h-8 w-auto" />
          </Link>

          {/* ── Desktop Search Bar with Filters ──────────── */}
          <form
            onSubmit={handleSearch}
            className="hidden md:flex flex-1 max-w-2xl items-center gap-2"
          >
            {/* Keyword */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" aria-hidden="true" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Prefabrik ev, konteyner, tiny house..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            {/* Dropdowns */}
            <div className="relative">
              <FilterFields />
            </div>

            {/* Search Button */}
            <button
              type="submit"
              className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition text-sm font-medium flex-shrink-0"
            >
              Ara
            </button>
          </form>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3 flex-shrink-0">
            <Link
              to="/firmalar-harita"
              className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-emerald-600 transition"
            >
              <Map className="w-5 h-5" aria-hidden="true" />
              <span className="hidden lg:inline">Firmalar Haritası</span>
            </Link>
            {role !== 'seller' && (
              <button
                onClick={handleTeklifIste}
                className="border border-emerald-600 text-emerald-600 px-4 py-2 rounded-lg hover:bg-emerald-50 transition font-medium text-sm"
              >
                Teklif İste
              </button>
            )}
            <button
              onClick={handleIlanVer}
              className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition font-medium text-sm"
            >
              İlan Ver
            </button>
            <UserMenu />
          </div>

          {/* Mobile: Search toggle + Hamburger */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setSearchOpen((v) => !v)}
              aria-label="Arama ve filtreleri aç"
              aria-expanded={searchOpen}
              className="p-2 text-gray-600 hover:text-emerald-600"
            >
              {searchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label="Menüyü aç"
              aria-expanded={mobileMenuOpen}
              className="p-2 text-gray-600"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* ── Mobile Search + Filter Panel ─────────────── */}
        {searchOpen && (
          <form
            onSubmit={handleSearch}
            className="md:hidden mt-3 space-y-2 pb-2"
          >
            {/* Keyword */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" aria-hidden="true" />
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Prefabrik ev, konteyner..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Category + City — stacked on mobile */}
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  aria-label="Kategori seç"
                  className="w-full appearance-none border border-gray-300 rounded-lg bg-white text-gray-700 text-sm px-3 py-2 pr-7 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Tüm Kategoriler</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat.slug} value={cat.slug}>{cat.name}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" aria-hidden="true" />
              </div>
              <div className="relative">
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  aria-label="Şehir seç"
                  className="w-full appearance-none border border-gray-300 rounded-lg bg-white text-gray-700 text-sm px-3 py-2 pr-7 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Tüm Şehirler</option>
                  {CITIES.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" aria-hidden="true" />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 text-white py-2 rounded-lg font-medium text-sm hover:bg-emerald-700 transition"
            >
              Ara
            </button>
          </form>
        )}
      </div>

      {/* Category Navigation */}
      <nav className="border-t border-gray-200 bg-gray-50" aria-label="Kategoriler">
        <div className="max-w-7xl mx-auto px-4">
          <div className="hidden md:flex items-center gap-1 py-2 overflow-x-auto">

            {/* All categories dropdown */}
            <div className="relative flex-shrink-0">
              <button
                className="flex items-center gap-1 px-3 py-2 text-gray-700 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition font-medium whitespace-nowrap text-sm"
                onMouseEnter={() => setCategoryDropdownOpen(true)}
                onMouseLeave={() => setCategoryDropdownOpen(false)}
                aria-haspopup="true"
                aria-expanded={categoryDropdownOpen}
              >
                Tüm Kategoriler
                <ChevronDown className="w-4 h-4" aria-hidden="true" />
              </button>
              {categoryDropdownOpen && (
                <div
                  className="absolute top-full left-0 bg-white shadow-lg rounded-lg py-2 min-w-48 z-50"
                  onMouseEnter={() => setCategoryDropdownOpen(true)}
                  onMouseLeave={() => setCategoryDropdownOpen(false)}
                  role="menu"
                >
                  {CATEGORIES.map((cat) => (
                    <Link
                      key={cat.slug}
                      to={`/kategori/${cat.slug}`}
                      role="menuitem"
                      className="block px-4 py-2 text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 text-sm"
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Individual category links */}
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                to={`/kategori/${cat.slug}`}
                className="px-3 py-2 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition whitespace-nowrap text-sm flex-shrink-0"
              >
                {cat.name}
              </Link>
            ))}

            {/* Separator */}
            <div className="flex-shrink-0 w-px h-5 bg-gray-300 mx-1" aria-hidden="true" />

            {/* Map link in nav bar */}
            <Link
              to="/firmalar-harita"
              className="flex items-center gap-1.5 px-3 py-2 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition whitespace-nowrap text-sm flex-shrink-0"
            >
              <Map className="w-4 h-4" aria-hidden="true" />
              Firmalar Haritası
            </Link>

            {/* Separator */}
            <div className="flex-shrink-0 w-px h-5 bg-gray-300 mx-1" aria-hidden="true" />

            {/* Yapı Asistanı */}
            <Link
              to="/yapi-asistani"
              className="flex items-center gap-1.5 px-3 py-2 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition whitespace-nowrap text-sm flex-shrink-0 font-medium"
            >
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
              Yapı Asistanı ✨
            </Link>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-4 py-4 space-y-2">
            {role !== 'seller' && (
              <button
                onClick={() => { handleTeklifIste(); setMobileMenuOpen(false); }}
                className="block w-full border border-emerald-600 text-emerald-600 px-4 py-3 rounded-lg text-center font-medium hover:bg-emerald-50 transition"
              >
                Teklif İste
              </button>
            )}
            <button
              onClick={() => { handleIlanVer(); setMobileMenuOpen(false); }}
              className="block w-full bg-emerald-600 text-white px-4 py-3 rounded-lg text-center font-medium"
            >
              Ücretsiz İlan Ver
            </button>
            <Link
              to="/firmalar-harita"
              className="flex items-center gap-2 px-2 py-2 text-gray-700 hover:text-emerald-600"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Map className="w-5 h-5" aria-hidden="true" />
              Firmalar Haritası
            </Link>
            <Link
              to="/yapi-asistani"
              className="flex items-center gap-2 px-3 py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-medium hover:bg-emerald-100 transition"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Sparkles className="w-4 h-4" aria-hidden="true" />
              Yapı Asistanı ✨
            </Link>
            <div className="pt-2 border-t border-gray-200">
              <p className="text-xs text-gray-400 mb-2 px-2">Kategoriler</p>
              {CATEGORIES.map((cat) => (
                <Link
                  key={cat.slug}
                  to={`/kategori/${cat.slug}`}
                  className="block px-2 py-2 text-gray-700 hover:text-emerald-600 text-sm"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {cat.name}
                </Link>
              ))}
            </div>

            {/* Kullanıcı bölümü */}
            <div className="pt-3 border-t border-gray-200">
              {currentUser ? (
                <>
                  <div className="flex items-center gap-3 px-2 py-2 mb-1">
                    <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {currentUser.photoURL ? (
                        <img src={currentUser.photoURL} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-emerald-700 font-bold text-sm">
                          {(currentUser.displayName || currentUser.email || 'K').charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {currentUser.displayName || 'Kullanıcı'}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{currentUser.email}</p>
                    </div>
                  </div>
                  <Link
                    to="/profilim"
                    className="flex items-center gap-2 px-2 py-2 text-sm text-gray-700 hover:text-emerald-600"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <UserCircle className="w-4 h-4" /> Profilim
                  </Link>
                  <Link
                    to="/ilanlarim"
                    className="flex items-center gap-2 px-2 py-2 text-sm text-gray-700 hover:text-emerald-600"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <FileText className="w-4 h-4" /> İlanlarım
                  </Link>
                  <button
                    onClick={async () => { await logout(); setMobileMenuOpen(false); }}
                    className="flex items-center gap-2 px-2 py-2 text-sm text-red-600 w-full"
                  >
                    <LogOut className="w-4 h-4" /> Çıkış Yap
                  </button>
                </>
              ) : (
                <div className="flex gap-2">
                  <Link
                    to="/giris"
                    className="flex-1 border border-emerald-600 text-emerald-600 text-center px-4 py-2.5 rounded-lg font-medium text-sm hover:bg-emerald-50 transition"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Giriş Yap
                  </Link>
                  <Link
                    to="/kayit"
                    className="flex-1 bg-emerald-600 text-white text-center px-4 py-2.5 rounded-lg font-medium text-sm hover:bg-emerald-700 transition"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Kayıt Ol
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
