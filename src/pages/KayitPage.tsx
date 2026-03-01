import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User, Mail, Lock, Eye, EyeOff, AlertCircle, Loader2,
  Building2, ShoppingBag, Hash, MapPin, Factory, Store, CheckSquare, Square,
} from 'lucide-react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth, authErrorMessage } from '../context/AuthContext';
import { CATEGORIES } from '../data/categories';
import Header from '../components/Header';
import Footer from '../components/Footer';
import logoSrc from '../assets/logo.svg';

/* ── Google logosu ──────────────────────────────────────── */
function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

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

type UserType = 'alici' | 'satici';
type SaticiTipi = 'uretici' | 'bayi' | '';
type UrunDurumu = 'sifir' | 'ikinci_el' | 'her_ikisi' | '';

/* ── Hata satırı yardımcısı ─────────────────────────────── */
function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
      <AlertCircle className="w-3 h-3 flex-shrink-0" />{msg}
    </p>
  );
}

export default function KayitPage() {
  const { currentUser, register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) navigate('/', { replace: true });
  }, [currentUser, navigate]);

  /* ── Temel form ─────────────────────────────────────────── */
  const [form, setForm] = useState({
    displayName: '', email: '', password: '', passwordCnf: '', kvkk: false,
  });
  const [userType, setUserType] = useState<UserType>('alici');

  /* ── Satıcı ek alanları ─────────────────────────────────── */
  const [seller, setSeller] = useState({
    firmaAdi:   '',
    vergiNo:    '',
    sehir:      '',
    saticiTipi: '' as SaticiTipi,
    urunDurumu: '' as UrunDurumu,
    kategoriler: [] as string[],
  });

  const [showPass, setShowPass] = useState(false);
  const [showCnf,  setShowCnf]  = useState(false);
  const [errors,   setErrors]   = useState<Record<string, string>>({});
  const [status,   setStatus]   = useState<'idle' | 'loading' | 'google'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  function set(key: string, val: string | boolean) {
    setForm((f) => ({ ...f, [key]: val }));
    if (errors[key]) setErrors((e) => { const n = { ...e }; delete n[key]; return n; });
    setErrorMsg('');
  }

  function setSel(key: string, val: string) {
    setSeller((s) => ({ ...s, [key]: val }));
    if (errors[key]) setErrors((e) => { const n = { ...e }; delete n[key]; return n; });
  }

  function toggleKategori(name: string) {
    setSeller((s) => ({
      ...s,
      kategoriler: s.kategoriler.includes(name)
        ? s.kategoriler.filter((k) => k !== name)
        : [...s.kategoriler, name],
    }));
    if (errors.kategoriler) setErrors((e) => { const n = { ...e }; delete n.kategoriler; return n; });
  }

  /* ── Doğrulama ──────────────────────────────────────────── */
  function validate() {
    const e: Record<string, string> = {};
    if (!form.displayName.trim())           e.displayName = 'Ad soyad zorunludur.';
    if (!form.email.trim())                 e.email       = 'E-posta zorunludur.';
    if (form.password.length < 6)           e.password    = 'Şifre en az 6 karakter olmalıdır.';
    if (form.password !== form.passwordCnf) e.passwordCnf = 'Şifreler eşleşmiyor.';
    if (!form.kvkk)                         e.kvkk        = 'KVKK metnini kabul etmelisiniz.';

    if (userType === 'satici') {
      if (!seller.firmaAdi.trim())                     e.firmaAdi   = 'Firma adı zorunludur.';
      if (!/^\d{10}$/.test(seller.vergiNo.replace(/\s/g, '')))
                                                        e.vergiNo    = 'Vergi numarası 10 haneli olmalıdır.';
      if (!seller.sehir)                               e.sehir      = 'Şehir seçimi zorunludur.';
      if (!seller.saticiTipi)                          e.saticiTipi = 'Satış tipi seçimi zorunludur.';
      if (!seller.urunDurumu)                          e.urunDurumu = 'Ürün durumu seçimi zorunludur.';
      if (seller.kategoriler.length === 0)             e.kategoriler = 'En az bir kategori seçiniz.';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  /* ── Firestore'a kullanıcı profili kaydet ───────────────── */
  async function saveUserDoc(uid: string) {
    const base = { olusturmaTarihi: serverTimestamp() };
    if (userType === 'buyer' as unknown as UserType || userType === 'alici') {
      await setDoc(doc(db, 'users', uid), { role: 'buyer', ...base });
    } else {
      await setDoc(doc(db, 'users', uid), {
        role:        'seller',
        firmaAdi:    seller.firmaAdi.trim(),
        vergiNo:     seller.vergiNo.replace(/\s/g, ''),
        sehir:       seller.sehir,
        saticiTipi:  seller.saticiTipi,
        urunDurumu:  seller.urunDurumu,
        kategoriler: seller.kategoriler,
        ...base,
      });
    }
  }

  function getRedirect() {
    return userType === 'satici' ? '/satici-formu' : '/';
  }

  /* ── E-posta kayıt ──────────────────────────────────────── */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setStatus('loading');
    setErrorMsg('');
    try {
      const user = await register(form.email.trim(), form.password, form.displayName.trim());
      await saveUserDoc(user.uid);
      navigate(getRedirect(), { replace: true });
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? '';
      setErrorMsg(authErrorMessage(code));
      setStatus('idle');
    }
  }

  /* ── Google kayıt ───────────────────────────────────────── */
  async function handleGoogle() {
    setStatus('google');
    setErrorMsg('');
    try {
      const user = await loginWithGoogle();
      await setDoc(doc(db, 'users', user.uid), {
        role: userType === 'satici' ? 'seller' : 'buyer',
        olusturmaTarihi: serverTimestamp(),
      });
      navigate(getRedirect(), { replace: true });
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? '';
      console.error('[Google Auth]', code, err);
      setErrorMsg(authErrorMessage(code));
      setStatus('idle');
    }
  }

  const isLoading = status === 'loading';
  const isGoogle  = status === 'google';
  const isSatici  = userType === 'satici';

  return (
    <>
      <Header />

      <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12 px-4">
        <div className={`w-full transition-all ${isSatici ? 'max-w-lg' : 'max-w-md'}`}>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">

            {/* Logo */}
            <div className="flex justify-center mb-6">
              <Link to="/"><img src={logoSrc} alt="ModülerPazar" className="h-9 w-auto" /></Link>
            </div>

            <h1 className="text-2xl font-bold text-gray-800 text-center mb-1">Kayıt Ol</h1>
            <p className="text-sm text-gray-500 text-center mb-7">ModülerPazar'a ücretsiz üye olun</p>

            {errorMsg && (
              <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-5">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /><span>{errorMsg}</span>
              </div>
            )}

            {/* ── Hesap tipi ────────────────────────────── */}
            <div className="mb-5">
              <p className="text-sm font-medium text-gray-700 mb-2">Hesap tipi</p>
              <div className="grid grid-cols-2 gap-3">
                {([
                  { key: 'alici',  Icon: ShoppingBag, label: 'Alıcı',         sub: 'Teklif alacağım' },
                  { key: 'satici', Icon: Building2,   label: 'Satıcı / Firma', sub: 'İlan vereceğim' },
                ] as const).map(({ key, Icon, label, sub }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => { setUserType(key); setErrors({}); }}
                    className={`flex flex-col items-center gap-2 py-3 px-4 rounded-xl border-2 text-sm font-medium transition ${
                      userType === key
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {label}
                    <span className="text-[11px] font-normal text-gray-400">{sub}</span>
                  </button>
                ))}
              </div>
              {isSatici && (
                <p className="mt-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
                  Kayıt sonrası ilan vermek için firma sayfasına yönlendirileceksiniz.
                </p>
              )}
            </div>

            {/* ── Google ──────────────────────────────────── */}
            <button
              type="button"
              onClick={handleGoogle}
              disabled={isLoading || isGoogle}
              className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-xl py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-60 mb-5"
            >
              {isGoogle ? <Loader2 className="w-5 h-5 animate-spin" /> : <GoogleIcon />}
              Google ile Kayıt Ol
            </button>

            {/* Ayraç */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400 flex-shrink-0">veya e-posta ile</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* ── Form ────────────────────────────────────── */}
            <form onSubmit={handleSubmit} noValidate className="space-y-4">

              {/* Ad Soyad */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ad Soyad <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text" autoComplete="name"
                    value={form.displayName} onChange={(e) => set('displayName', e.target.value)}
                    placeholder="Adınız Soyadınız"
                    className={`w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${errors.displayName ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                  />
                </div>
                <FieldError msg={errors.displayName} />
              </div>

              {/* E-posta */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  E-posta <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email" autoComplete="email"
                    value={form.email} onChange={(e) => set('email', e.target.value)}
                    placeholder="ornek@email.com"
                    className={`w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${errors.email ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                  />
                </div>
                <FieldError msg={errors.email} />
              </div>

              {/* Şifre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Şifre <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPass ? 'text' : 'password'} autoComplete="new-password"
                    value={form.password} onChange={(e) => set('password', e.target.value)}
                    placeholder="En az 6 karakter"
                    className={`w-full pl-9 pr-10 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${errors.password ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                  />
                  <button type="button" onClick={() => setShowPass((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <FieldError msg={errors.password} />
              </div>

              {/* Şifre tekrar */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Şifre Tekrar <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showCnf ? 'text' : 'password'} autoComplete="new-password"
                    value={form.passwordCnf} onChange={(e) => set('passwordCnf', e.target.value)}
                    placeholder="Şifrenizi tekrar girin"
                    className={`w-full pl-9 pr-10 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${errors.passwordCnf ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                  />
                  <button type="button" onClick={() => setShowCnf((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showCnf ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <FieldError msg={errors.passwordCnf} />
              </div>

              {/* ══ SATICI EK ALANLARI ══════════════════════ */}
              {isSatici && (
                <div className="space-y-4 pt-2 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide pt-2">
                    Firma Bilgileri
                  </p>

                  {/* Firma Adı */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Firma Adı <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={seller.firmaAdi} onChange={(e) => setSel('firmaAdi', e.target.value)}
                        placeholder="Firmanızın tam adı"
                        className={`w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${errors.firmaAdi ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                      />
                    </div>
                    <FieldError msg={errors.firmaAdi} />
                  </div>

                  {/* Vergi Numarası */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Vergi Numarası <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text" inputMode="numeric" maxLength={10}
                        value={seller.vergiNo} onChange={(e) => setSel('vergiNo', e.target.value.replace(/\D/g, ''))}
                        placeholder="10 haneli vergi numarası"
                        className={`w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${errors.vergiNo ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                      />
                    </div>
                    <FieldError msg={errors.vergiNo} />
                  </div>

                  {/* Şehir */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Şehir <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      <select
                        value={seller.sehir} onChange={(e) => setSel('sehir', e.target.value)}
                        className={`w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white ${errors.sehir ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                      >
                        <option value="">Şehir seçiniz</option>
                        {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <FieldError msg={errors.sehir} />
                  </div>

                  {/* Satış Tipi */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Satış Tipi <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {([
                        { key: 'uretici', Icon: Factory, label: 'Üretici',     sub: 'Kendi üretimim' },
                        { key: 'bayi',    Icon: Store,   label: 'Bayi / Satıcı', sub: 'Satış ve aracılık' },
                      ] as const).map(({ key, Icon, label, sub }) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setSel('saticiTipi', key)}
                          className={`flex flex-col items-center gap-1.5 py-3 px-3 rounded-xl border-2 text-sm font-medium transition ${
                            seller.saticiTipi === key
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                              : 'border-gray-200 text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                          {label}
                          <span className="text-[11px] font-normal text-gray-400">{sub}</span>
                        </button>
                      ))}
                    </div>
                    <FieldError msg={errors.saticiTipi} />
                  </div>

                  {/* Ürün Durumu */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ürün Durumu <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {([
                        { key: 'sifir',       label: 'Sıfır' },
                        { key: 'ikinci_el',   label: '2. El' },
                        { key: 'her_ikisi',   label: 'Her İkisi' },
                      ] as const).map(({ key, label }) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setSel('urunDurumu', key)}
                          className={`py-2.5 rounded-xl border-2 text-sm font-medium transition ${
                            seller.urunDurumu === key
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                              : 'border-gray-200 text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    <FieldError msg={errors.urunDurumu} />
                  </div>

                  {/* Kategoriler (çoklu seçim) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Kategoriler <span className="text-red-500">*</span>
                      <span className="ml-1 text-xs font-normal text-gray-400">(birden fazla seçebilirsiniz)</span>
                    </label>
                    <div className="space-y-1.5">
                      {CATEGORIES.map((cat) => {
                        const checked = seller.kategoriler.includes(cat.name);
                        return (
                          <button
                            key={cat.slug}
                            type="button"
                            onClick={() => toggleKategori(cat.name)}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg border text-sm transition ${
                              checked
                                ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                                : 'border-gray-200 text-gray-600 hover:border-gray-300'
                            }`}
                          >
                            {checked
                              ? <CheckSquare className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                              : <Square className="w-4 h-4 flex-shrink-0 text-gray-300" />
                            }
                            {cat.name}
                          </button>
                        );
                      })}
                    </div>
                    <FieldError msg={errors.kategoriler} />
                  </div>
                </div>
              )}

              {/* KVKK */}
              <div>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox" checked={form.kvkk}
                    onChange={(e) => set('kvkk', e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-emerald-600 border-gray-300 focus:ring-emerald-500"
                  />
                  <span className="text-xs text-gray-600 leading-relaxed">
                    <Link to="/kvkk" target="_blank" className="text-emerald-600 hover:underline font-medium">KVKK Aydınlatma Metni</Link>{' '}ve{' '}
                    <Link to="/kullanim-kosullari" target="_blank" className="text-emerald-600 hover:underline font-medium">Kullanım Koşulları</Link>'nı
                    okudum, kabul ediyorum. <span className="text-red-500">*</span>
                  </span>
                </label>
                <FieldError msg={errors.kvkk} />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading || isGoogle}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 transition disabled:opacity-60"
              >
                {isLoading
                  ? <><Loader2 className="w-4 h-4 animate-spin" />Kayıt oluşturuluyor…</>
                  : 'Kayıt Ol'
                }
              </button>
            </form>
          </div>

          <p className="text-center text-sm text-gray-500 mt-5">
            Zaten hesabın var mı?{' '}
            <Link to="/giris" className="text-emerald-600 hover:underline font-semibold">Giriş Yap</Link>
          </p>
        </div>
      </main>

      <Footer />
    </>
  );
}
