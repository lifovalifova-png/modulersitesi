import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEOMeta from '../components/SEOMeta';
import {
  Target, Search, FileText, Handshake,
  ShieldCheck, CheckCircle, Sparkles, Lock,
  ArrowRight, Mail,
} from 'lucide-react';

const STEPS = [
  {
    icon: Search,
    step: 1,
    title: 'İhtiyacını Belirle',
    desc: 'Talep oluştur veya kategorileri keşfet. Fiyat hesaplayıcıyla ön bütçeni belirle.',
    color: 'bg-emerald-100 text-emerald-700',
  },
  {
    icon: FileText,
    step: 2,
    title: 'Firmalardan Teklif Al',
    desc: '2 firmayı teklif sepetine ekle, tek formla her ikisine teklif talebi gönder ve karşılaştır.',
    color: 'bg-blue-100 text-blue-700',
  },
  {
    icon: Handshake,
    step: 3,
    title: 'En Uygun Firmayı Seç',
    desc: 'Doğrulanmış firma rozetlerine, kullanıcı yorumlarına ve fiyat karşılaştırmasına göre karar ver.',
    color: 'bg-purple-100 text-purple-700',
  },
];

const WHY_ITEMS = [
  {
    icon: ShieldCheck,
    title: 'Doğrulanmış Firmalar',
    desc: 'Platformdaki tüm firmalar belge doğrulamasından geçirilir. Yeşil rozetle işaretlenmiş firmalar güvenli seçimdir.',
    color: 'bg-emerald-100 text-emerald-600',
  },
  {
    icon: CheckCircle,
    title: 'Ücretsiz Teklif Alma',
    desc: 'Teklif almak, karşılaştırmak ve firmalarla iletişime geçmek tamamen ücretsizdir. Herhangi bir komisyon alınmaz.',
    color: 'bg-blue-100 text-blue-600',
  },
  {
    icon: Sparkles,
    title: 'Yapay Zeka Destekli Öneri',
    desc: 'Ana sayfadaki AI asistanımız ihtiyacınızı analiz ederek en uygun yapı tipini ve fiyat aralığını önerir.',
    color: 'bg-amber-100 text-amber-600',
  },
  {
    icon: Lock,
    title: 'KVKK Uyumlu Güvenli Platform',
    desc: 'Kişisel verileriniz KVKK kapsamında korunur. Bilgileriniz üçüncü taraflarla izniniz olmadan paylaşılmaz.',
    color: 'bg-purple-100 text-purple-600',
  },
];

export default function HakkimizdaPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <SEOMeta
        title="Hakkımızda — ModülerPazar"
        description="ModülerPazar, Türkiye'nin en büyük modüler yapı platformudur. Prefabrik ev, çelik yapı, konteyner ev alıcılarını doğrulanmış üreticilerle buluşturuyoruz."
        url="/hakkimizda"
      />
      <Header />

      <main className="flex-1">

        {/* Hero */}
        <section className="bg-gradient-to-br from-emerald-700 to-teal-600 text-white py-16 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Target className="w-7 h-7" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Türkiye'nin Modüler Yapı Pazarı
            </h1>
            <p className="text-emerald-100 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
              ModülerPazar, prefabrik ev, çelik yapı, konteyner ev ve tiny house arayanları
              Türkiye'nin dört bir yanındaki doğrulanmış üreticiler ve satıcılarla buluşturan
              dijital pazaryeridir.
            </p>
          </div>
        </section>

        {/* Misyon */}
        <section className="py-14 px-4 bg-white">
          <div className="max-w-4xl mx-auto text-center">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-3 block">
              Misyonumuz
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">
              Alıcıları ve üreticileri tek platformda buluşturuyoruz
            </h2>
            <p className="text-gray-500 text-base leading-relaxed max-w-2xl mx-auto">
              Modüler yapı sektöründe güvenilir firma bulmak, doğru fiyatı öğrenmek ve
              karşılaştırma yapmak zorlu bir süreçtir. ModülerPazar bu süreci şeffaf, hızlı
              ve güvenli hale getirmek için kuruldu. Her adımda yanınızdayız.
            </p>
          </div>
        </section>

        {/* Nasıl Çalışır */}
        <section className="py-14 px-4 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Nasıl Çalışır?</h2>
              <p className="text-gray-500 mt-2 text-sm">3 adımda hayalinizdeki yapıya ulaşın</p>
            </div>
            <div className="grid sm:grid-cols-3 gap-6">
              {STEPS.map(({ icon: Icon, step, title, desc, color }) => (
                <div
                  key={step}
                  className="relative bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-emerald-600 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
                      {step}
                    </span>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                  <h3 className="font-semibold text-gray-800">{title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Neden ModülerPazar */}
        <section className="py-14 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Neden ModülerPazar?</h2>
              <p className="text-gray-500 mt-2 text-sm">Sizi rakiplerimizden ayıran 4 temel güvence</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-5">
              {WHY_ITEMS.map(({ icon: Icon, title, desc, color }) => (
                <div key={title} className="flex gap-4 bg-gray-50 border border-gray-100 rounded-2xl p-5">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-1">{title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* İletişim */}
        <section className="py-14 px-4 bg-gray-50">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Mail className="w-6 h-6 text-emerald-600" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-3">Bize Ulaşın</h2>
            <p className="text-gray-500 text-sm mb-5">
              Sorularınız veya iş birliği teklifleriniz için aşağıdaki e-posta adresinden bize yazabilirsiniz.
            </p>
            <a
              href="mailto:modulerpazar@yandex.com"
              className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-emerald-700 transition text-sm"
            >
              <Mail className="w-4 h-4" />
              modulerpazar@yandex.com
            </a>

            <div className="mt-8 pt-8 border-t border-gray-200">
              <p className="text-gray-500 text-sm mb-4">Platformu keşfetmeye hazır mısınız?</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  to="/kategori/prefabrik"
                  className="inline-flex items-center justify-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-emerald-700 transition text-sm"
                >
                  İlanları Keşfet <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/talep-olustur"
                  className="inline-flex items-center justify-center gap-2 border border-emerald-600 text-emerald-600 px-5 py-2.5 rounded-xl font-semibold hover:bg-emerald-50 transition text-sm"
                >
                  Ücretsiz Teklif Al
                </Link>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Breadcrumb */}
      <div className="max-w-4xl mx-auto px-4 py-4 w-full">
        <nav className="text-xs text-gray-400 flex items-center gap-1.5">
          <Link to="/" className="hover:text-emerald-600 transition">Ana Sayfa</Link>
          <span>/</span>
          <span className="text-gray-600">Hakkımızda</span>
        </nav>
      </div>

      <Footer />
    </div>
  );
}
