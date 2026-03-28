import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, Star, MessageSquare, CheckCircle,
  UserPlus, FileText, Bell, Handshake,
  ChevronDown, ChevronUp, ArrowRight,
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEOMeta from '../components/SEOMeta';

/* ── Alıcı adımları ─────────────────────────────────────── */
const ALICI_ADIMLARI = [
  {
    icon: Search,
    baslik: 'İlan Ara ve Filtrele',
    aciklama:
      'Kategori (prefabrik, tiny house, çelik yapı…), şehir ve bütçe aralığına göre ilanları filtrele. Yüzlerce onaylı firma arasından sana uygun seçenekleri bul.',
  },
  {
    icon: Star,
    baslik: 'Teklif Sepetine Ekle',
    aciklama:
      'Beğendiğin ilanları "Teklif Sepeti"ne ekle. Aynı anda en fazla 2 farklı firmaya teklif talebi gönderebilirsin; bu sınır karşılaştırmayı kolaylaştırır.',
  },
  {
    icon: MessageSquare,
    baslik: 'Tek Tıkla Teklif Al',
    aciklama:
      'Sepetini onaylayarak her iki firmaya aynı anda proje detaylarını ilet. İstersen "Talep Havuzu"na projenizi ekleyerek uygun tüm firmaların sana ulaşmasını sağla.',
  },
  {
    icon: CheckCircle,
    baslik: 'Karşılaştır ve Karar Ver',
    aciklama:
      'Gelen teklifleri fiyat, teslim süresi, garanti ve hizmet kapsamı bazında yan yana incele. Hiçbir zaman süresi baskısı olmadan en doğru kararı ver.',
  },
];

/* ── Satıcı adımları ─────────────────────────────────────── */
const SATICI_ADIMLARI = [
  {
    icon: UserPlus,
    baslik: 'Ücretsiz Kayıt Ol',
    aciklama:
      'Firma bilgilerini ve belgelerini (ticaret sicil, vergi levhası) yükle. İnceleme süreci genellikle 1–3 iş günü sürer. Onayın ardından profilinde "Doğrulanmış Firma" rozeti belirir.',
  },
  {
    icon: FileText,
    baslik: 'İlanını Oluştur',
    aciklama:
      'Ürünlerini veya hizmetlerini fotoğraf, teknik detay ve fiyat aralığıyla listele. İlk ilanın tamamen ücretsiz; ek ilanlar için uygun fiyatlı paketler mevcut.',
  },
  {
    icon: Bell,
    baslik: 'Teklif Taleplerini Takip Et',
    aciklama:
      'Firma Paneli\'nde sana gelen tüm teklif taleplerini görürsün. Her talep için müşterinin proje detaylarını incele, kabul edersen iletişim bilgileri açılır.',
  },
  {
    icon: Handshake,
    baslik: 'Anlaş ve Teslim Et',
    aciklama:
      'Müşteriyle doğrudan iletişime geçerek detayları netleştir, sözleşme imzala ve projeyi teslim et. Platform, güvenli bir buluşma noktası sunar; ödeme süreci sizin aranızda gerçekleşir.',
  },
];

/* ── Fiyatlandırma ───────────────────────────────────────── */
interface PlanOzellik {
  ozellik: string;
  dahil: boolean;
}

interface Plan {
  isim: string;
  fiyat: string;
  aciklama: string;
  ozellikler: PlanOzellik[];
  vurguli: boolean;
  buton: string;
  href: string;
}

const PLANLAR: Plan[] = [
  {
    isim: 'Ücretsiz',
    fiyat: '₺0',
    aciklama: 'Temel başlangıç paketi',
    vurguli: false,
    buton: 'Ücretsiz Başla',
    href: '/kayit?tip=satici',
    ozellikler: [
      { ozellik: '1 aktif ilan', dahil: true },
      { ozellik: 'Standart listeleme sırası', dahil: true },
      { ozellik: 'Teklif talebi alma', dahil: true },
      { ozellik: 'Firma profil sayfası', dahil: true },
      { ozellik: 'Öne çıkan ilan', dahil: false },
      { ozellik: 'Kategori başı garantisi', dahil: false },
      { ozellik: 'Talep Havuzu önceliği', dahil: false },
      { ozellik: 'Detaylı analitik rapor', dahil: false },
    ],
  },
  {
    isim: 'Standart',
    fiyat: '₺1.490',
    aciklama: 'Aylık / firma başına',
    vurguli: true,
    buton: 'Hemen Başla',
    href: '/satici-formu',
    ozellikler: [
      { ozellik: '5 aktif ilan', dahil: true },
      { ozellik: 'Standart listeleme sırası', dahil: true },
      { ozellik: 'Teklif talebi alma', dahil: true },
      { ozellik: 'Firma profil sayfası', dahil: true },
      { ozellik: '1 öne çıkan ilan / ay', dahil: true },
      { ozellik: 'Kategori başı garantisi', dahil: false },
      { ozellik: 'Talep Havuzu önceliği', dahil: false },
      { ozellik: 'Temel analitik rapor', dahil: true },
    ],
  },
  {
    isim: 'Premium',
    fiyat: '₺3.490',
    aciklama: 'Aylık / firma başına',
    vurguli: false,
    buton: 'Premium\'a Geç',
    href: '/satici-formu',
    ozellikler: [
      { ozellik: 'Sınırsız ilan', dahil: true },
      { ozellik: 'Öncelikli listeleme', dahil: true },
      { ozellik: 'Teklif talebi alma', dahil: true },
      { ozellik: 'Firma profil sayfası', dahil: true },
      { ozellik: 'Sınırsız öne çıkan ilan', dahil: true },
      { ozellik: 'Kategori başı garantisi', dahil: true },
      { ozellik: 'Talep Havuzu önceliği', dahil: true },
      { ozellik: 'Detaylı analitik rapor', dahil: true },
    ],
  },
];

/* ── SSS ─────────────────────────────────────────────────── */
interface SSSItem {
  soru:  string;
  cevap: string;
}

const SSS_LISTESI: SSSItem[] = [
  {
    soru: 'ModülerPazar\'a üye olmak zorunlu mu?',
    cevap:
      'Alıcılar üye olmadan ilanları inceleyebilir; ancak teklif talep etmek veya Talep Havuzu\'na proje eklemek için ücretsiz kayıt gereklidir. Satıcı/firma hesabı oluşturmak ve ilan vermek için de kayıt zorunludur.',
  },
  {
    soru: 'Teklif Sepeti ile Talep Havuzu arasındaki fark nedir?',
    cevap:
      'Teklif Sepeti, belirli bir ilanı beğendiğinde o firmaya doğrudan teklif talebi göndermenizi sağlar (maksimum 2 firma). Talep Havuzu ise projenizi sisteme girip uygun firmaların sizi bulmasını sağlayan ters açık artırma yöntemidir.',
  },
  {
    soru: 'Firma doğrulama süreci ne kadar sürer?',
    cevap:
      'Belgeler eksiksiz yüklendiğinde genellikle 1–3 iş günü içinde tamamlanır. Onay sonrasında firma profilinde "Doğrulanmış Firma" rozeti görünür ve tüm ilanlar yayına girer.',
  },
  {
    soru: 'Alıcılar için platform tamamen ücretsiz mi?',
    cevap:
      'Evet. Alıcılar için üyelik, ilan arama, teklif alma ve Talep Havuzu kullanımı tamamen ücretsizdir. ModülerPazar\'ın geliri yalnızca satıcı firmalar için sunulan premium hizmetlerden sağlanmaktadır.',
  },
  {
    soru: 'Ödeme platformdan mı yapılıyor?',
    cevap:
      'Hayır. ModülerPazar bir buluşma ve pazar yeri platformudur; tüm ödemeler alıcı ile firma arasında doğrudan gerçekleşir. Güvenli işlem için noter onaylı sözleşme ve banka transferi kullanmanızı tavsiye ederiz.',
  },
  {
    soru: 'Satıcı olarak kaç ilan verebilirim?',
    cevap:
      'Ücretsiz planda 1 aktif ilan hakkınız bulunur. Standart planda 5 ilan, Premium planda ise sınırsız ilan verebilirsiniz. Ayrıca ek ilan satın alma seçeneği de mevcuttur.',
  },
];

/* ── Accordion ───────────────────────────────────────────── */
function AccordionItem({
  soru, cevap, isOpen, onToggle,
}: {
  soru: string; cevap: string; isOpen: boolean; onToggle: () => void;
}) {
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left bg-white hover:bg-gray-50 transition"
        aria-expanded={isOpen}
      >
        <span className="font-medium text-gray-800 text-sm">{soru}</span>
        {isOpen
          ? <ChevronUp   className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          : <ChevronDown className="w-4 h-4 text-gray-400    flex-shrink-0" />}
      </button>
      {isOpen && (
        <div className="px-5 pb-5 bg-white border-t border-gray-100">
          <p className="text-sm text-gray-600 leading-relaxed pt-3">{cevap}</p>
        </div>
      )}
    </div>
  );
}

/* ── Sayfa ───────────────────────────────────────────────── */
export default function NasilKullanilirPage() {
  const [aktifTab, setAktifTab]   = useState<'alici' | 'satici'>('alici');
  const [openSss, setOpenSss]     = useState<number | null>(0);

  const adimlar = aktifTab === 'alici' ? ALICI_ADIMLARI : SATICI_ADIMLARI;

  return (
    <div className="flex flex-col min-h-screen">
      <SEOMeta
        title="ModülerPazar Nasıl Kullanılır? Alıcı ve Satıcı Rehberi"
        description="ModülerPazar'ı nasıl kullanacağınızı adım adım öğrenin. Alıcılar için teklif alma, satıcılar için ilan verme rehberi. Fiyatlandırma ve SSS."
        url="/nasil-kullanilir"
      />
      <Header />

      <main className="flex-1 bg-gray-50">

        {/* ── Hero ───────────────────────────────────── */}
        <section className="bg-gradient-to-br from-emerald-700 to-emerald-900 text-white py-14 md:py-20">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">ModülerPazar'ı Keşfedin</h1>
            <p className="text-emerald-100 text-base md:text-lg mb-8">
              Türkiye'nin en büyük modüler yapı pazarında alıcı ve satıcı olarak nasıl hareket edeceğinizi öğrenin. Birkaç adımda hayalinizdeki yapıya ulaşın.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/talep-olustur"
                className="inline-flex items-center justify-center gap-2 bg-white text-emerald-700 px-6 py-3 rounded-lg font-semibold text-sm hover:bg-emerald-50 transition"
              >
                Teklif Al <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/satici-formu"
                className="inline-flex items-center justify-center gap-2 border border-white text-white px-6 py-3 rounded-lg font-semibold text-sm hover:bg-white/10 transition"
              >
                İlan Ver
              </Link>
            </div>
          </div>
        </section>

        {/* ── Rehber Sekmeleri ───────────────────────── */}
        <section className="py-12 md:py-16">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Adım Adım Rehber</h2>
              <p className="text-gray-500 text-sm">Rolünüzü seçin ve nasıl çalıştığını görün</p>
            </div>

            {/* Tab butonları */}
            <div className="flex justify-center gap-3 mb-10">
              <button
                onClick={() => setAktifTab('alici')}
                className={`px-6 py-2.5 rounded-full text-sm font-semibold transition ${
                  aktifTab === 'alici'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-emerald-300 hover:text-emerald-700'
                }`}
              >
                Alıcı / Müşteri
              </button>
              <button
                onClick={() => setAktifTab('satici')}
                className={`px-6 py-2.5 rounded-full text-sm font-semibold transition ${
                  aktifTab === 'satici'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-emerald-300 hover:text-emerald-700'
                }`}
              >
                Satıcı / Firma
              </button>
            </div>

            {/* Adımlar */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {adimlar.map((adim, i) => {
                const Icon = adim.icon;
                return (
                  <div
                    key={i}
                    className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex gap-4"
                  >
                    <div className="flex-shrink-0">
                      <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-emerald-600" aria-hidden="true" />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                          {i + 1}. Adım
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">{adim.baslik}</h3>
                      <p className="text-sm text-gray-500 leading-relaxed">{adim.aciklama}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Tab CTA */}
            <div className="mt-8 text-center">
              {aktifTab === 'alici' ? (
                <Link
                  to="/talep-olustur"
                  className="inline-flex items-center gap-2 bg-emerald-600 text-white px-7 py-3 rounded-lg font-semibold text-sm hover:bg-emerald-700 transition"
                >
                  Hemen Teklif Al <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <Link
                  to="/kayit?tip=satici"
                  className="inline-flex items-center gap-2 bg-emerald-600 text-white px-7 py-3 rounded-lg font-semibold text-sm hover:bg-emerald-700 transition"
                >
                  Ücretsiz Kayıt Ol <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* ── Fiyatlandırma ──────────────────────────── */}
        <section className="py-12 md:py-16 bg-white border-t border-gray-100">
          <div className="max-w-5xl mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Fiyatlandırma</h2>
              <p className="text-gray-500 text-sm">Alıcılar için her zaman ücretsiz. Satıcılar için esnek paketler.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {PLANLAR.map((plan) => (
                <div
                  key={plan.isim}
                  className={`rounded-2xl p-6 flex flex-col ${
                    plan.vurguli
                      ? 'bg-emerald-600 text-white shadow-xl ring-2 ring-emerald-500 ring-offset-2'
                      : 'bg-gray-50 border border-gray-200'
                  }`}
                >
                  <div className="mb-4">
                    <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${plan.vurguli ? 'text-emerald-200' : 'text-emerald-600'}`}>
                      {plan.isim}
                    </p>
                    <p className={`text-3xl font-extrabold ${plan.vurguli ? 'text-white' : 'text-gray-900'}`}>
                      {plan.fiyat}
                    </p>
                    <p className={`text-xs mt-0.5 ${plan.vurguli ? 'text-emerald-200' : 'text-gray-400'}`}>
                      {plan.aciklama}
                    </p>
                  </div>

                  <ul className="space-y-2.5 mb-6 flex-1">
                    {plan.ozellikler.map((oz, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <span className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold ${
                          oz.dahil
                            ? plan.vurguli ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-600'
                            : plan.vurguli ? 'bg-white/10 text-white/40' : 'bg-gray-200 text-gray-400'
                        }`}>
                          {oz.dahil ? '✓' : '×'}
                        </span>
                        <span className={oz.dahil ? (plan.vurguli ? 'text-white' : 'text-gray-700') : (plan.vurguli ? 'text-white/50' : 'text-gray-400')}>
                          {oz.ozellik}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    to={plan.href}
                    className={`block text-center py-2.5 rounded-lg font-semibold text-sm transition ${
                      plan.vurguli
                        ? 'bg-white text-emerald-700 hover:bg-emerald-50'
                        : 'bg-emerald-600 text-white hover:bg-emerald-700'
                    }`}
                  >
                    {plan.buton}
                  </Link>
                </div>
              ))}
            </div>

            <p className="text-center text-xs text-gray-400 mt-6">
              Fiyatlar KDV hariçtir. Paket detayları için{' '}
              <a href="mailto:modulerpazar@yandex.com" className="text-emerald-600 hover:underline">
                modulerpazar@yandex.com
              </a>{' '}
              ile iletişime geçin.
            </p>
          </div>
        </section>

        {/* ── SSS ────────────────────────────────────── */}
        <section className="py-12 md:py-16">
          <div className="max-w-3xl mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Sık Sorulan Sorular</h2>
              <p className="text-gray-500 text-sm">Aklınızdaki soruların cevaplarına hızlıca ulaşın</p>
            </div>

            <div className="space-y-3">
              {SSS_LISTESI.map((item, i) => (
                <AccordionItem
                  key={i}
                  soru={item.soru}
                  cevap={item.cevap}
                  isOpen={openSss === i}
                  onToggle={() => setOpenSss(openSss === i ? null : i)}
                />
              ))}
            </div>

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-500 mb-3">Daha fazla sorunuz var mı?</p>
              <Link
                to="/sss"
                className="inline-flex items-center gap-2 border border-emerald-600 text-emerald-600 px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-emerald-50 transition"
              >
                Tüm SSS'lere Git <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* ── CTA ────────────────────────────────────── */}
        <section className="py-12 bg-emerald-700 text-white">
          <div className="max-w-2xl mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold mb-3">Hemen Başlayın</h2>
            <p className="text-emerald-100 text-sm mb-7">
              Türkiye genelinde 500'den fazla onaylı firma arasından size uygun olanı bulun ya da firmanızı listeleyin.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/talep-olustur"
                className="inline-flex items-center justify-center gap-2 bg-white text-emerald-700 px-6 py-3 rounded-lg font-semibold text-sm hover:bg-emerald-50 transition"
              >
                Teklif Al
              </Link>
              <Link
                to="/satici-formu"
                className="inline-flex items-center justify-center gap-2 border border-white text-white px-6 py-3 rounded-lg font-semibold text-sm hover:bg-white/10 transition"
              >
                İlan Ver
              </Link>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
