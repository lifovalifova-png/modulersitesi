import { Link } from 'react-router-dom';
import { Home, ArrowLeft, Search } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEOMeta from '../components/SEOMeta';

export default function NotFoundPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <SEOMeta
        title="Sayfa Bulunamadı — ModülerPazar"
        description="Aradığınız sayfa bulunamadı."
        url="/404"
      />
      <Header />

      <main className="flex-1 flex items-center justify-center bg-gray-50 px-4 py-20">
        <div className="max-w-md w-full text-center">

          {/* Numara */}
          <div className="relative mb-8 select-none">
            <p className="text-[10rem] font-extrabold text-gray-100 leading-none tracking-tighter">
              404
            </p>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-6xl">🏗️</span>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-800 mb-3">
            Sayfa bulunamadı
          </h1>
          <p className="text-gray-500 text-sm leading-relaxed mb-8">
            Aradığınız sayfa taşınmış, silinmiş veya hiç var olmamış olabilir.
            Ana sayfaya dönerek aramaya devam edebilirsiniz.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-emerald-700 transition"
            >
              <Home className="w-4 h-4" />
              Ana Sayfaya Dön
            </Link>
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center justify-center gap-2 border border-gray-300 text-gray-700 px-6 py-3 rounded-xl font-semibold text-sm hover:bg-gray-50 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Geri Dön
            </button>
          </div>

          {/* Hızlı kategoriler */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-xs text-gray-400 mb-4 flex items-center justify-center gap-1.5">
              <Search className="w-3.5 h-3.5" />
              Popüler kategorilere göz atın
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {[
                { label: 'Prefabrik', slug: 'prefabrik' },
                { label: 'Tiny House', slug: 'tiny-house' },
                { label: 'Konteyner', slug: 'yasam-konteynerleri' },
                { label: 'Çelik Yapı', slug: 'celik-yapilar' },
              ].map((cat) => (
                <Link
                  key={cat.slug}
                  to={`/kategori/${cat.slug}`}
                  className="text-xs bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-full hover:border-emerald-300 hover:text-emerald-600 transition"
                >
                  {cat.label}
                </Link>
              ))}
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
