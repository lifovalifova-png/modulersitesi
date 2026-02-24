import { Link } from 'react-router-dom';
import { ArrowRight, Building, Container, Home, Hammer, TreePine, Recycle, Star, LucideIcon } from 'lucide-react';
import FlashDealsCarousel from '../components/FlashDealsCarousel';
import { CATEGORIES } from '../data/categories';

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  'prefabrik':           Building,
  'celik-yapilar':       Hammer,
  'yasam-konteynerleri': Container,
  'ikinci-el':           Recycle,
  'ozel-projeler':       Star,
  'ahsap-yapilar':       TreePine,
  'tiny-house':          Home,
};

const stats = [
  { label: 'Aktif İlan', value: '2,500+' },
  { label: 'Kayıtlı Firma', value: '850+' },
  { label: 'Mutlu Müşteri', value: '12,000+' },
  { label: 'Şehir', value: '81' },
];

export default function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-800 text-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4">
          <div className="max-w-3xl">
            <h1 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
              Modüler Yapı Çözümlerinde Türkiye'nin En Büyük Pazarı
            </h1>
            <p className="text-lg md:text-xl text-emerald-100 mb-8">
              Prefabrik evler, konteynerler, tiny house ve daha fazlası.
              Binlerce ilan arasından size uygun olanı bulun veya kendi ilanınızı verin.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/satici-formu"
                className="bg-white text-emerald-700 px-6 py-3 rounded-lg font-semibold hover:bg-emerald-50 transition text-center"
              >
                Ücretsiz İlan Ver
              </Link>
              <Link
                to="/kategori/prefabrik"
                className="bg-emerald-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-400 transition text-center flex items-center justify-center gap-2"
              >
                İlanları Keşfet <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-white/10 backdrop-blur rounded-lg p-4 text-center">
                <div className="text-2xl md:text-3xl font-bold">{stat.value}</div>
                <div className="text-emerald-200 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Kategoriler</h2>
              <p className="text-gray-600 mt-1">İhtiyacınıza uygun kategoriyi seçin</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {CATEGORIES.map((category) => {
              const Icon = CATEGORY_ICONS[category.slug];
              return (
                <Link
                  key={category.slug}
                  to={`/kategori/${category.slug}`}
                  className="group bg-gray-50 hover:bg-emerald-50 border border-gray-200 hover:border-emerald-300 rounded-xl p-5 transition-all duration-200"
                >
                  <div className={`${category.color} w-12 h-12 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                    {Icon && <Icon className="w-6 h-6 text-white" />}
                  </div>
                  <h3 className="font-semibold text-gray-800 group-hover:text-emerald-700 transition">
                    {category.name}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">{category.count} ilan</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Flash Deals Section */}
      <FlashDealsCarousel />

      {/* CTA Section */}
      <section className="py-12 md:py-16 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Firmanız mı var? Hemen İlan Verin!
          </h2>
          <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
            Binlerce potansiyel müşteriye ulaşın. İlk ilanınız ücretsiz!
          </p>
          <Link
            to="/satici-formu"
            className="inline-flex items-center gap-2 bg-emerald-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-emerald-500 transition"
          >
            Şimdi Başla <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Why Us Section */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-800 mb-12">
            Neden ModülerPazar?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Güvenilir Satıcılar</h3>
              <p className="text-gray-600">Tüm satıcılarımız doğrulanmış ve güvenilir firmalardır.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Hızlı Teklif</h3>
              <p className="text-gray-600">Tek tıkla teklif alın, zaman kaybetmeden karşılaştırın.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">7/24 Destek</h3>
              <p className="text-gray-600">Sorularınız için her zaman yanınızdayız.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
