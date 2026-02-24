import { useParams, Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

const PAGE_TITLES: Record<string, string> = {
  'kvkk-aydinlatma-metni':      'KVKK Aydınlatma Metni',
  'gizlilik-politikasi':         'Gizlilik Politikası',
  'kullanim-kosullari':          'Kullanım Koşulları',
  'cerez-politikasi':            'Çerez Politikası',
  'mesafeli-satis-sozlesmesi':   'Mesafeli Satış Sözleşmesi',
};

export default function LegalPage() {
  const { slug } = useParams<{ slug: string }>();
  const title = PAGE_TITLES[slug ?? ''] ?? 'Yasal Bilgi';

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4">
          <nav className="text-sm text-gray-500 mb-6 flex items-center gap-2">
            <Link to="/" className="hover:text-emerald-600">Ana Sayfa</Link>
            <span>/</span>
            <span className="text-gray-800">{title}</span>
          </nav>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">{title}</h1>
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-amber-700 text-sm">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Bu sayfa yakında içerikle doldurulacaktır.
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
