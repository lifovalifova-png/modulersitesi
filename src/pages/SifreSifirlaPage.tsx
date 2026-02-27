import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, AlertCircle, CheckCircle, Loader2, ArrowLeft } from 'lucide-react';
import { useAuth, authErrorMessage } from '../context/AuthContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import logoSrc from '../assets/logo.svg';

export default function SifreSifirlaPage() {
  const { resetPassword } = useAuth();

  const [email,    setEmail]    = useState('');
  const [status,   setStatus]   = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) { setErrorMsg('E-posta adresi zorunludur.'); return; }
    setStatus('loading');
    setErrorMsg('');
    try {
      await resetPassword(email.trim());
      setStatus('success');
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? '';
      setErrorMsg(authErrorMessage(code));
      setStatus('error');
    }
  }

  return (
    <>
      <Header />

      <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">

            {/* Logo */}
            <div className="flex justify-center mb-6">
              <Link to="/">
                <img src={logoSrc} alt="ModülerPazar" className="h-9 w-auto" />
              </Link>
            </div>

            {status === 'success' ? (
              /* Başarı durumu */
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-emerald-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">E-posta Gönderildi</h2>
                <p className="text-sm text-gray-500 mb-2">
                  <strong className="text-gray-700">{email}</strong> adresine şifre sıfırlama bağlantısı gönderildi.
                </p>
                <p className="text-xs text-gray-400 mb-6">
                  E-posta gelmezse spam/junk klasörünü kontrol edin.
                </p>
                <Link
                  to="/giris"
                  className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-medium text-sm hover:bg-emerald-700 transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Giriş Sayfasına Dön
                </Link>
              </div>
            ) : (
              /* Form */
              <>
                <h1 className="text-2xl font-bold text-gray-800 text-center mb-1">Şifre Sıfırla</h1>
                <p className="text-sm text-gray-500 text-center mb-7">
                  Kayıtlı e-posta adresinize sıfırlama bağlantısı göndereceğiz.
                </p>

                {errorMsg && (
                  <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-5">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} noValidate className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      E-posta <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setErrorMsg(''); }}
                        placeholder="ornek@email.com"
                        className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 transition disabled:opacity-60"
                  >
                    {status === 'loading'
                      ? <><Loader2 className="w-4 h-4 animate-spin" />Gönderiliyor…</>
                      : 'Sıfırlama Bağlantısı Gönder'
                    }
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <Link
                    to="/giris"
                    className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-emerald-600 transition"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Giriş sayfasına dön
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
