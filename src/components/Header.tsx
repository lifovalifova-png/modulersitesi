import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, ChevronDown, Search, Building2, UserCircle, FileText, LogOut, Calculator } from 'lucide-react';
import { CATEGORIES, CATEGORY_NAME_KEYS } from '../data/categories';
import { useFeatureFlags } from '../hooks/useFeatureFlags';
import { SITE_CONFIG } from '../config/site';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
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
  const { lang, setLang, t } = useLanguage();
  const { flags } = useFeatureFlags();

  function handleTeklifIste() {
    if (!currentUser) {
      navigate('/giris', { state: { from: { pathname: '/talep-olustur' } } });
      return;
    }
    navigate('/talep-olustur');
  }

  function handleIlanVer() {
    if (!currentUser) { navigate('/kayit?tip=satici'); return; }
    if (role === 'seller') { navigate('/firma-paneli'); return; }
    navigate('/kayit?tip=satici');
  }

  /* state */
  const [mobileMenuOpen,       setMobileMenuOpen]       = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [searchOpen,           setSearchOpen]           = useState(false);
  const [query,                setQuery]                = useState('');
  const [selectedCategory,     setSelectedCategory]     = useState('');
  const [selectedCity,         setSelectedCity]         = useState('');
  const [scrolled,             setScrolled]             = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const catDropdownRef = useRef<HTMLDivElement>(null);

  /* click-outside → kategori dropdown kapat */
  useEffect(() => {
    if (!categoryDropdownOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (catDropdownRef.current && !catDropdownRef.current.contains(e.target as Node)) {
        setCategoryDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [categoryDropdownOpen]);

  /* scroll → glassmorphism efekti */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* focus search input when panel opens */
  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
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

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${
      scrolled
        ? 'bg-white/80 backdrop-blur-xl shadow-lg shadow-black/5'
        : 'bg-white shadow-sm'
    }`}>

      {/* Top Bar */}
      <div className="bg-primary text-on-primary py-2 px-4 text-xs font-body">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined text-base" aria-hidden="true">mail</span>
            <span className="hidden sm:inline">{t('header.support')}:</span>{' '}
            <a href={`mailto:${SITE_CONFIG.email}`} className="hover:underline">{SITE_CONFIG.email}</a>
          </span>
          <div className="flex items-center gap-3">
            <button onClick={handleIlanVer} className="hover:underline font-medium">
              {t('header.freePostAd')}
            </button>
            {/* Dil değiştirici */}
            <button
              onClick={() => setLang(lang === 'tr' ? 'en' : 'tr')}
              aria-label="Change language"
              className="text-xs font-bold bg-white/20 hover:bg-white/30 rounded px-2 py-0.5 transition"
            >
              {lang === 'tr' ? 'EN' : 'TR'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="max-w-7xl mx-auto px-4 py-3">
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
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg text-on-surface-variant" aria-hidden="true">search</span>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('header.searchPlaceholder')}
                aria-label="Arama"
                className="w-full pl-10 pr-3 py-2.5 border border-outline-variant rounded-xl text-sm font-body text-on-surface bg-surface-container-low focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
              />
            </div>

            {/* Kategori */}
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                aria-label="Kategori seç"
                className="appearance-none border border-outline-variant rounded-xl bg-surface-container-low text-on-surface text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent pr-8 px-3 py-2.5 w-44"
              >
                <option value="">{t('header.allCategoriesOpt')}</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat.slug} value={cat.slug}>{t(CATEGORY_NAME_KEYS[cat.slug])}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" aria-hidden="true" />
            </div>

            {/* Şehir */}
            <div className="relative">
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                aria-label="Şehir seç"
                className="appearance-none border border-outline-variant rounded-xl bg-surface-container-low text-on-surface text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent pr-8 px-3 py-2.5 w-36"
              >
                <option value="">{t('header.allCities')}</option>
                {CITIES.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" aria-hidden="true" />
            </div>

            {/* Search Button */}
            <button
              type="submit"
              className="bg-primary text-on-primary px-5 py-2.5 rounded-xl hover:bg-primary-container transition text-sm font-semibold font-body flex-shrink-0 flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-base" aria-hidden="true">search</span>
              {t('header.searchBtn')}
            </button>
          </form>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3 flex-shrink-0">
            {role !== 'seller' && (
              <button
                onClick={handleTeklifIste}
                className="border border-primary text-primary px-4 py-2.5 rounded-xl hover:bg-primary/5 transition font-semibold text-sm font-body"
              >
                {t('header.getQuoteCta')}
              </button>
            )}
            <button
              onClick={handleIlanVer}
              className="bg-primary text-on-primary px-4 py-2.5 rounded-xl hover:bg-primary-container transition font-semibold text-sm font-body"
            >
              {t('header.postAdBtn')}
            </button>
            <UserMenu />
          </div>

          {/* Mobile: Search toggle + Auth Buttons + Hamburger */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setSearchOpen((v) => !v)}
              aria-label="Arama ve filtreleri aç"
              aria-expanded={searchOpen}
              className="p-2 text-on-surface-variant hover:text-primary transition"
            >
              {searchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
            </button>
            {!currentUser && (
              <>
                <Link
                  to="/giris"
                  className="border border-primary text-primary px-3 py-1.5 rounded-xl font-semibold text-sm hover:bg-primary/5 transition font-body"
                >
                  {t('auth.login')}
                </Link>
                <Link
                  to="/kayit"
                  className="bg-primary text-on-primary px-3 py-1.5 rounded-xl font-semibold text-sm hover:bg-primary-container transition font-body"
                >
                  {t('auth.register')}
                </Link>
              </>
            )}
            <button
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label="Menüyü aç"
              aria-expanded={mobileMenuOpen}
              className="p-2 text-on-surface-variant"
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
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg text-on-surface-variant" aria-hidden="true">search</span>
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('header.searchPlaceholderMobile')}
                aria-label="Arama"
                className="w-full pl-10 pr-3 py-2.5 border border-outline-variant rounded-xl text-sm font-body text-on-surface bg-surface-container-low focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  aria-label="Kategori seç"
                  className="w-full appearance-none border border-outline-variant rounded-xl bg-surface-container-low text-on-surface text-sm font-body px-3 py-2.5 pr-7 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">{t('header.allCategories')}</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat.slug} value={cat.slug}>{t(CATEGORY_NAME_KEYS[cat.slug])}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" aria-hidden="true" />
              </div>
              <div className="relative">
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  aria-label="Şehir seç"
                  className="w-full appearance-none border border-outline-variant rounded-xl bg-surface-container-low text-on-surface text-sm font-body px-3 py-2.5 pr-7 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">{t('header.allCities')}</option>
                  {CITIES.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" aria-hidden="true" />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-primary text-on-primary py-2.5 rounded-xl font-semibold text-sm font-body hover:bg-primary-container transition flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-base" aria-hidden="true">search</span>
              {t('header.searchBtn')}
            </button>
          </form>
        )}
      </div>

      {/* Category Navigation */}
      <nav className="border-t border-outline-variant/30 bg-surface-container-low/60" aria-label="Kategoriler">
        <div className="max-w-7xl mx-auto px-4">
          <div className="hidden md:flex items-center gap-1 py-2">

            {/* All categories dropdown */}
            <div className="relative flex-shrink-0" ref={catDropdownRef}>
              <button
                className={`flex items-center gap-1 px-3 py-2 rounded-xl transition font-medium whitespace-nowrap text-sm font-body ${
                  categoryDropdownOpen
                    ? 'text-primary bg-primary/5'
                    : 'text-on-surface hover:text-primary hover:bg-primary/5'
                }`}
                onClick={() => setCategoryDropdownOpen((v) => !v)}
                aria-haspopup="true"
                aria-expanded={categoryDropdownOpen}
              >
                <span className="material-symbols-outlined text-lg" aria-hidden="true">category</span>
                {t('header.allCategories')}
                <ChevronDown className={`w-4 h-4 transition-transform ${categoryDropdownOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
              </button>
              {categoryDropdownOpen && (
                <div
                  className="absolute top-full left-0 bg-white shadow-xl rounded-2xl py-2 min-w-56 z-50 border border-outline-variant/30 mt-1"
                  role="menu"
                >
                  <Link
                    to="/"
                    role="menuitem"
                    onClick={() => setCategoryDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-primary font-semibold hover:bg-primary/5 text-sm font-body transition"
                  >
                    <span className="material-symbols-outlined text-lg" aria-hidden="true">apps</span>
                    Hepsi
                  </Link>
                  <div className="border-t border-outline-variant/20 my-1" />
                  {CATEGORIES.map((cat) => (
                    <Link
                      key={cat.slug}
                      to={`/kategori/${cat.slug}`}
                      role="menuitem"
                      onClick={() => setCategoryDropdownOpen(false)}
                      className="block px-4 py-2.5 text-on-surface hover:bg-primary/5 hover:text-primary text-sm font-body transition"
                    >
                      {t(CATEGORY_NAME_KEYS[cat.slug])}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Separator */}
            <div className="flex-shrink-0 w-px h-5 bg-outline-variant mx-1" aria-hidden="true" />

            <Link
              to="/firmalar"
              className="flex items-center gap-1.5 px-3 py-2 text-on-surface-variant hover:text-primary hover:bg-primary/5 rounded-xl transition whitespace-nowrap text-sm flex-shrink-0 font-body"
            >
              <span className="material-symbols-outlined text-lg" aria-hidden="true">apartment</span>
              {t('nav.firms')}
            </Link>

            <Link
              to="/etkinlikler"
              className="flex items-center gap-1.5 px-3 py-2 text-on-surface-variant hover:text-primary hover:bg-primary/5 rounded-xl transition whitespace-nowrap text-sm flex-shrink-0 font-body"
            >
              <span className="material-symbols-outlined text-lg" aria-hidden="true">event</span>
              Etkinlikler
            </Link>

            <Link
              to="/blog"
              className="flex items-center gap-1.5 px-3 py-2 text-on-surface-variant hover:text-primary hover:bg-primary/5 rounded-xl transition whitespace-nowrap text-sm flex-shrink-0 font-body"
            >
              <span className="material-symbols-outlined text-lg" aria-hidden="true">edit_note</span>
              {t('nav.blog')}
            </Link>

            <Link
              to="/haberler"
              className="flex items-center gap-1.5 px-3 py-2 text-on-surface-variant hover:text-primary hover:bg-primary/5 rounded-xl transition whitespace-nowrap text-sm flex-shrink-0 font-body"
            >
              <span className="material-symbols-outlined text-lg" aria-hidden="true">newspaper</span>
              {t('nav.haberler')}
            </Link>

            <Link
              to="/fiyatlandirma"
              className="flex items-center gap-1.5 px-3 py-2 text-on-surface-variant hover:text-primary hover:bg-primary/5 rounded-xl transition whitespace-nowrap text-sm flex-shrink-0 font-body"
            >
              <span className="material-symbols-outlined text-lg" aria-hidden="true">payments</span>
              Fiyatlar
            </Link>

            <Link
              to="/hakkimizda"
              className="flex items-center gap-1.5 px-3 py-2 text-on-surface-variant hover:text-primary hover:bg-primary/5 rounded-xl transition whitespace-nowrap text-sm flex-shrink-0 font-body"
            >
              <span className="material-symbols-outlined text-lg" aria-hidden="true">info</span>
              {t('nav.about')}
            </Link>

          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-outline-variant/30">
          <div className="px-4 py-4 space-y-2">
            {role !== 'seller' && (
              <button
                onClick={() => { handleTeklifIste(); setMobileMenuOpen(false); }}
                className="block w-full border border-primary text-primary px-4 py-3 rounded-xl text-center font-semibold hover:bg-primary/5 transition font-body"
              >
                {t('header.getQuoteCta')}
              </button>
            )}
            <button
              onClick={() => { handleIlanVer(); setMobileMenuOpen(false); }}
              className="block w-full bg-primary text-on-primary px-4 py-3 rounded-xl text-center font-semibold font-body"
            >
              {t('header.freePostAd')}
            </button>
            <Link
              to="/firmalar"
              className="flex items-center gap-2 w-full px-3 py-3 rounded-xl text-on-surface hover:text-primary hover:bg-primary/5 transition font-body"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Building2 className="w-5 h-5" aria-hidden="true" />
              {t('nav.firms')}
            </Link>
            <Link
              to="/blog"
              className="block w-full px-3 py-3 rounded-xl text-on-surface hover:text-primary hover:bg-primary/5 transition font-body"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('nav.blog')}
            </Link>
            <Link
              to="/haberler"
              className="block w-full px-3 py-3 rounded-xl text-on-surface hover:text-primary hover:bg-primary/5 transition font-body"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('nav.haberler')}
            </Link>
            <Link
              to="/etkinlikler"
              className="flex items-center gap-2 w-full px-3 py-3 rounded-xl text-on-surface hover:text-primary hover:bg-primary/5 transition font-body"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="material-symbols-outlined text-lg" aria-hidden="true">event</span>
              Etkinlikler
            </Link>
            <Link
              to="/sss"
              className="block w-full px-3 py-3 rounded-xl text-on-surface hover:text-primary hover:bg-primary/5 transition font-body"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('nav.faq')}
            </Link>
            <Link
              to="/nasil-kullanilir"
              className="block w-full px-3 py-3 rounded-xl text-on-surface hover:text-primary hover:bg-primary/5 transition font-body"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('nav.howToUse')}
            </Link>
            {flags.fiyatHesaplama && (
              <Link
                to="/fiyat-hesapla"
                className="flex items-center gap-2 w-full px-3 py-3 rounded-xl text-on-surface hover:text-primary hover:bg-primary/5 transition font-body"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Calculator className="w-5 h-5" aria-hidden="true" />
                {t('nav.fiyatHesapla')}
              </Link>
            )}
            <Link
              to="/hakkimizda"
              className="block w-full px-3 py-3 rounded-xl text-on-surface hover:text-primary hover:bg-primary/5 transition font-body"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('nav.about')}
            </Link>
            <div className="pt-2 border-t border-outline-variant/30">
              <p className="text-xs text-on-surface-variant mb-2 px-2 font-body">{t('header.categoriesLabel')}</p>
              {CATEGORIES.map((cat) => (
                <Link
                  key={cat.slug}
                  to={`/kategori/${cat.slug}`}
                  className="block w-full px-3 py-3 rounded-xl text-on-surface hover:text-primary hover:bg-primary/5 transition text-sm font-body"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t(CATEGORY_NAME_KEYS[cat.slug])}
                </Link>
              ))}
            </div>

            {/* Kullanıcı bölümü */}
            <div className="pt-3 border-t border-outline-variant/30">
              {currentUser ? (
                <>
                  <Link
                    to="/profil"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-2 py-2 mb-1 hover:bg-primary/5 rounded-xl transition"
                  >
                    <div className="w-9 h-9 rounded-full bg-secondary-container flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {currentUser.photoURL ? (
                        <img src={currentUser.photoURL} alt="Profil fotoğrafı" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-on-secondary-container font-bold text-sm font-headline">
                          {(currentUser.displayName || currentUser.email || 'K').charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-on-surface truncate font-headline">
                        {currentUser.displayName || 'Kullanıcı'}
                      </p>
                      <p className="text-xs text-on-surface-variant truncate font-body">{currentUser.email}</p>
                    </div>
                  </Link>
                  <Link
                    to="/profil"
                    className="flex items-center gap-2 px-2 py-2 text-sm text-on-surface hover:text-primary font-body"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <UserCircle className="w-4 h-4" /> {t('auth.profile')}
                  </Link>
                  <Link
                    to="/firma-paneli"
                    className="flex items-center gap-2 px-2 py-2 text-sm text-on-surface hover:text-primary font-body"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <FileText className="w-4 h-4" /> {t('auth.myAds')}
                  </Link>
                  <button
                    onClick={async () => { await logout(); setMobileMenuOpen(false); }}
                    className="flex items-center gap-2 px-2 py-2 text-sm text-red-600 w-full font-body"
                  >
                    <LogOut className="w-4 h-4" /> {t('auth.logout')}
                  </button>
                </>
              ) : (
                <div className="flex gap-2">
                  <Link
                    to="/giris"
                    className="flex-1 border border-primary text-primary text-center px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary/5 transition font-body"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('auth.login')}
                  </Link>
                  <Link
                    to="/kayit"
                    className="flex-1 bg-primary text-on-primary text-center px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary-container transition font-body"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('auth.register')}
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
