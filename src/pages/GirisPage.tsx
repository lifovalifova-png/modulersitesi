import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth, authErrorMessage } from '../context/AuthContext';
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

export default function GirisPage() {
  const { currentUser, login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location  = useLocation();

  /* Giriş yapılmışsa yönlendir */
  const from = (location.state as { from?: string })?.from ?? '/';
  useEffect(() => {
    if (currentUser) navigate(from, { replace: true });
  }, [currentUser, navigate, from]);

  const [form, setForm]         = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors]     = useState<Record<string, string>>({});
  const [status, setStatus]     = useState<'idle' | 'loading' | 'google'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  function set(key: string, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
    if (errors[key]) setErrors((e) => { const n = { ...e }; delete n[key]; return n; });
    setErrorMsg('');
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.email.trim())  e.email    = 'E-posta zorunludur.';
    if (!form.password)       e.password = 'Şifre zorunludur.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setStatus('loading');
    setErrorMsg('');
    try {
      await login(form.email.trim(), form.password);
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? '';
      setErrorMsg(authErrorMessage(code));
      setStatus('idle');
    }
  }

  async function handleGoogle() {
    setStatus('google');
    setErrorMsg('');
    try {
      await loginWithGoogle();
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? '';
      setErrorMsg(authErrorMessage(code));
      setStatus('idle');
    }
  }

  const isLoading = status === 'loading';
  const isGoogle  = status === 'google';

  return (
    <>
      <Header />

      <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">

          {/* Kart */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">

            {/* Logo */}
            <div className="flex justify-center mb-6">
              <Link to="/">
                <img src={logoSrc} alt="ModülerPazar" className="h-9 w-auto" />
              </Link>
            </div>

            <h1 className="text-2xl font-bold text-gray-800 text-center mb-1">Giriş Yap</h1>
            <p className="text-sm text-gray-500 text-center mb-7">
              Hesabınıza giriş yaparak ilanları takip edin
            </p>

            {/* Global hata */}
            {errorMsg && (
              <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-5">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Google */}
            <button
              type="button"
              onClick={handleGoogle}
              disabled={isLoading || isGoogle}
              className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-xl py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-60 mb-5"
            >
              {isGoogle ? <Loader2 className="w-5 h-5 animate-spin" /> : <GoogleIcon />}
              Google ile Giriş Yap
            </button>

            {/* Ayraç */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400 flex-shrink-0">veya e-posta ile</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} noValidate className="space-y-4">

              {/* E-posta */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  E-posta <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={(e) => set('email', e.target.value)}
                    placeholder="ornek@email.com"
                    className={`w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      errors.email ? 'border-red-400 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />{errors.email}
                  </p>
                )}
              </div>

              {/* Şifre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Şifre <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={form.password}
                    onChange={(e) => set('password', e.target.value)}
                    placeholder="••••••••"
                    className={`w-full pl-9 pr-10 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      errors.password ? 'border-red-400 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    aria-label={showPass ? 'Şifreyi gizle' : 'Şifreyi göster'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />{errors.password}
                  </p>
                )}
              </div>

              {/* Şifremi unuttum */}
              <div className="text-right">
                <Link
                  to="/sifre-sifirla"
                  className="text-xs text-emerald-600 hover:underline font-medium"
                >
                  Şifremi Unuttum
                </Link>
              </div>

              {/* Giriş butonu */}
              <button
                type="submit"
                disabled={isLoading || isGoogle}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 transition disabled:opacity-60"
              >
                {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" />Giriş yapılıyor…</> : 'Giriş Yap'}
              </button>
            </form>
          </div>

          {/* Kayıt linki */}
          <p className="text-center text-sm text-gray-500 mt-5">
            Hesabın yok mu?{' '}
            <Link to="/kayit" className="text-emerald-600 hover:underline font-semibold">
              Kayıt Ol
            </Link>
          </p>
        </div>
      </main>

      <Footer />
    </>
  );
}
