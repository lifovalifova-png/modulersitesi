import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEOMeta from '../components/SEOMeta';

/* ── Types ──────────────────────────────────────────────────── */
interface SSSItem {
  soru:  string;
  cevap: string;
}

interface SSSKategori {
  key:    string;
  baslik: string;
  sorular: SSSItem[];
}

/* ── Data ───────────────────────────────────────────────────── */
const KATEGORILER: SSSKategori[] = [
  {
    key: 'genel',
    baslik: 'Genel',
    sorular: [
      {
        soru: 'ModülerPazar nedir?',
        cevap: 'ModülerPazar, Türkiye\'nin en büyük modüler yapı pazar yeridir. Prefabrik evler, çelik yapılar, konteyner evler, tiny house\'lar ve ahşap yapılar için alıcıları ve onaylı üretici firmalar ile buluşturuyoruz. Platformumuzda binlerce ilan arasında arama yapabilir, aynı anda birden fazla firmadan teklif alabilirsiniz.',
      },
      {
        soru: 'Üyelik ücretli mi?',
        cevap: 'Alıcılar için üyelik ve teklif alma işlemleri tamamen ücretsizdir. Satıcı/firma hesabı açmak da ücretsizdir; ancak premium ilan konumlandırma ve öne çıkarma seçenekleri için ücretli paketler mevcuttur. Birinci ilanınız her zaman ücretsizdir.',
      },
      {
        soru: 'Firmalar nasıl doğrulanıyor?',
        cevap: 'Her firma başvurusu; ticaret sicil belgesi, vergi levhası ve yetkili imza sirküleri doğrulamasından geçer. Ekibimiz belgeleri inceledikten sonra onay verir ve profilde "Doğrulanmış Firma" rozeti görünür. Bu süreç genellikle 1-3 iş günü sürer.',
      },
      {
        soru: 'Müşteri desteği nasıl alırım?',
        cevap: 'Destek için info@modulerpazar.com adresine e-posta gönderebilir ya da 0850 123 45 67 numaralı hattımızı arayabilirsiniz. Hafta içi 09:00–18:00 saatleri arasında yanıt veriyoruz. Acil konular için platform üzerinden canlı sohbet desteği de mevcuttur.',
      },
      {
        soru: 'Bir firma hakkında şikâyette bulunabilir miyim?',
        cevap: 'Evet. Platform üzerindeki "Firmayı Şikâyet Et" seçeneği veya destek hattı aracılığıyla şikâyetinizi iletebilirsiniz. Şikâyetler ekibimiz tarafından incelenir; belgeli ihlal durumunda firmanın onayı askıya alınır ya da tamamen kaldırılır.',
      },
    ],
  },
  {
    key: 'alicilar',
    baslik: 'Alıcılar',
    sorular: [
      {
        soru: 'Teklif nasıl alırım?',
        cevap: 'İki yöntemle teklif alabilirsiniz. Birincisi; kategori sayfasından beğendiğiniz ilanları sepete ekleyip "Teklif Sepeti" üzerinden toplu teklif talebi gönderebilirsiniz. İkincisi; "Teklif İste" butonuyla projenizi detaylı biçimde tanımlayıp Talep Havuzu\'na iletebilirsiniz; uygun firmalar sizinle iletişime geçer.',
      },
      {
        soru: 'Aynı anda kaç firmadan teklif alabilirim?',
        cevap: 'Teklif Sepeti üzerinden aynı anda en fazla 2 firmaya teklif talebi gönderebilirsiniz; bu sınır karşılaştırmayı kolaylaştırmak için tasarlanmıştır. Talep Havuzu üzerinden ise sistem otomatik olarak uygun tüm firmalarla sizi eşleştirir.',
      },
      {
        soru: 'Teklifleri nasıl karşılaştırabilirim?',
        cevap: 'Gelen teklifleri Teklif Takip panelinizde yan yana görebilirsiniz. Fiyat, teslim süresi, garanti koşulları ve dahil hizmetler gibi kriterleri kolayca karşılaştırabilirsiniz. Karar vermek için herhangi bir süre baskısı yoktur.',
      },
      {
        soru: 'Ödeme platform üzerinden mi yapılıyor?',
        cevap: 'Hayır. ModülerPazar bir pazar yeri ve tanışma platformudur; ödeme doğrudan alıcı ile firma arasında gerçekleşir. Büyük tutarlı yapı projelerinde noter sözleşmesi ve teminat mektubu gibi güvenceler almanızı şiddetle tavsiye ederiz.',
      },
      {
        soru: 'Beğenmediğim ilanı nasıl raporlayabilirim?',
        cevap: 'Her ilan kartında "Şikâyet Et" seçeneği bulunmaktadır. Yanıltıcı bilgi, yanlış fiyatlandırma veya sahte ilan gibi durumlarda bu seçeneği kullanabilirsiniz. Raporlar 24 saat içinde incelenir.',
      },
    ],
  },
  {
    key: 'saticilar',
    baslik: 'Satıcılar',
    sorular: [
      {
        soru: 'Nasıl ilan verebilirim?',
        cevap: '"Ücretsiz İlan Ver" butonuna tıklayarak firma bilgilerinizi ve ürün/hizmet detaylarınızı içeren formu doldurun. Belgelerinizi yükleyin ve onay bekleyin. Onayın ardından ilanınız arama sonuçlarında ve kategori sayfalarında görünmeye başlar.',
      },
      {
        soru: 'İlan başına ücret var mı?',
        cevap: 'İlk ilanınız ve temel hesap tamamen ücretsizdir. Sonraki ilanlar için freemium model geçerlidir: standart ilanlar ücretsiz, öne çıkan ve birinci sıra garantili ilanlar için aylık veya ilan bazlı abonelik seçenekleri mevcuttur.',
      },
      {
        soru: 'Gelen teklif taleplerini nereden görürüm?',
        cevap: 'Firma Paneli (/firma-paneli) sayfasında size iletilen tüm teklif taleplerini görebilirsiniz. Her talep için müşterinin proje detaylarını inceleyebilir, kabul veya reddetme işlemini yapabilirsiniz. Kabul ettiğinizde müşterinin iletişim bilgileri açılır.',
      },
      {
        soru: 'Onay süreci ne kadar sürüyor?',
        cevap: 'Belgeler eksiksiz yüklendiğinde onay süreci genellikle 1-3 iş günü içinde tamamlanır. Eksik veya hatalı belge olması durumunda e-posta ile bilgilendirilirsiniz.',
      },
    ],
  },
  {
    key: 'teknik',
    baslik: 'Teknik',
    sorular: [
      {
        soru: 'Prefabrik ev için inşaat ruhsatı gerekiyor mu?',
        cevap: 'Evet. Türkiye İmar Kanunu (3194 sayılı) kapsamında prefabrik yapılar, geleneksel yapılarla aynı hukuki statüdedir. Belediye sınırları içinde inşaat ruhsatı zorunludur. Ruhsat süreci; mimari proje, zemin etüdü ve statik proje hazırlanmasını gerektirir. Detaylar için "2025\'te Prefabrik Ev İzinleri" blog yazımızı inceleyin.',
      },
      {
        soru: 'Konteyner ev kaç yıl dayanır?',
        cevap: 'ISO standartlı nakliye konteynerleri, 20-25 yıllık nakliye ömrü için tasarlanmıştır. Konut amaçlı dönüştürülüp galvanoiz boya ve düzenli bakımla korunduğunda 40-50 yıl ve üzeri ömür beklentisi gerçekçidir. Denize yakın ve tuzlu hava ortamlarında daha sık bakım gerekir.',
      },
      {
        soru: 'Çelik yapıda deprem riski nedir?',
        cevap: 'Doğru projelendirilmiş çelik karkas yapılar, depreme en dayanıklı yapı sistemleri arasındadır. Çeliğin sünekliği, deprem enerjisini kırılmadan absorbe etmesini sağlar. DBYBHY\'ye uygun statik hesap ve detaylandırma şartıyla çelik yapılar 1. derece deprem bölgelerinde de güvenle kullanılabilir.',
      },
      {
        soru: 'Tiny house\'un Türkiye\'deki resmi statüsü nedir?',
        cevap: 'Türkiye\'de tiny house\'ları doğrudan düzenleyen özel bir mevzuat bulunmamaktadır. Sabit kurulan tiny house\'lar genel imar mevzuatına tabidir. Tekerlekli (seyyar) modeller araç tescili yaptırılabilir; bu durumda inşaat ruhsatı yerine araç mevzuatı uygulanır. Her iki durum da farklı avantaj ve kısıtlamalar doğurur.',
      },
      {
        soru: 'DASK modüler yapıları kapsıyor mu?',
        cevap: 'İnşaat ruhsatı ve tapusu olan modüler yapılar (prefabrik, çelik yapı, konteyner ev) DASK kapsamındadır. Ruhsatsız veya tapusuz yapılar DASK yaptırılamaz; bu durum afet sonrası tazminat hakkını ortadan kaldırır.',
      },
    ],
  },
  {
    key: 'odeme',
    baslik: 'Ödeme',
    sorular: [
      {
        soru: 'Platform üzerinden ödeme alınıyor mu?',
        cevap: 'ModülerPazar şu anda aracı ödeme (escrow) sistemi sunmamaktadır. Tüm ödemeler doğrudan alıcı ile firma arasında yapılır. Güvenli işlem için banka transferi, fatura ve noter onaylı sözleşme kullanmanızı öneririz.',
      },
      {
        soru: 'Firma ile anlaşmazlık yaşarsam ne olur?',
        cevap: 'Öncelikle firma ile doğrudan iletişime geçmenizi öneririz. Çözüm sağlanamazsa ModülerPazar destek hattına başvurabilirsiniz; durumu belgeli anlaşmazlıklarda arabuluculuk desteği sağlamaya çalışıyoruz. Yasal yollara başvurmak gerekiyorsa Tüketici Hakem Heyeti ve mahkeme süreçleri geçerliliğini korur.',
      },
      {
        soru: 'Satıcı firmalardan komisyon alınıyor mu?',
        cevap: 'Temel üyelik ve ilan için komisyon alınmamaktadır. Öne çıkarma, birinci sıra garantisi veya özel kategori listesi gibi premium hizmetler için ücret alınabilir. Tüm ücretler kayıt sırasında şeffaf biçimde sunulur.',
      },
      {
        soru: 'Firmalar fatura kesiyor mu?',
        cevap: 'Evet. Kayıtlı ve vergi mükellefi olan tüm firmalar yasal olarak fatura kesmek zorundadır. Teklif aşamasında fatura düzenlenip düzenlenmeyeceğini ve KDV durumunu mutlaka netleştirin; bu belgeler yapı denetim ve tapu süreçleri için de gereklidir.',
      },
    ],
  },
];

/* ── Accordion Item ─────────────────────────────────────────── */
function AccordionItem({ soru, cevap, isOpen, onToggle }: {
  soru:     string;
  cevap:    string;
  isOpen:   boolean;
  onToggle: () => void;
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
          : <ChevronDown className="w-4 h-4 text-gray-400    flex-shrink-0" />
        }
      </button>
      {isOpen && (
        <div className="px-5 pb-5 bg-white border-t border-gray-100">
          <p className="text-sm text-gray-600 leading-relaxed pt-3">{cevap}</p>
        </div>
      )}
    </div>
  );
}

/* ── Component ──────────────────────────────────────────────── */
export default function SSSPage() {
  const [activeKat, setActiveKat]     = useState(KATEGORILER[0].key);
  const [openIndex, setOpenIndex]     = useState<number | null>(0);

  const aktifKat = KATEGORILER.find((k) => k.key === activeKat)!;

  const handleKatChange = (key: string) => {
    setActiveKat(key);
    setOpenIndex(null);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <SEOMeta
        title="Sık Sorulan Sorular — ModülerPazar"
        description="Modüler yapı alım sürecine dair merak edilenlerin cevapları. Teklif alma, firma seçimi, ödeme ve garanti konularında SSS."
        url="/sss"
      />
      <Header />

      <main className="flex-1 bg-gray-50">

        {/* ── Hero ─────────────────────────────────────── */}
        <section className="bg-gradient-to-br from-emerald-700 to-emerald-900 text-white py-12 md:py-16">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-3">Sıkça Sorulan Sorular</h1>
            <p className="text-emerald-100 text-base md:text-lg">
              Modüler yapı, platform kullanımı ve satın alma süreciyle ilgili merak ettiklerinizi yanıtlıyoruz.
            </p>
          </div>
        </section>

        {/* ── İçerik ───────────────────────────────────── */}
        <div className="max-w-4xl mx-auto px-4 py-10 md:py-14">

          {/* Kategori sekmeleri */}
          <div className="flex flex-wrap gap-2 mb-8 justify-center">
            {KATEGORILER.map((k) => (
              <button
                key={k.key}
                onClick={() => handleKatChange(k.key)}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition ${
                  activeKat === k.key
                    ? 'bg-emerald-600 text-white shadow'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-emerald-300 hover:text-emerald-700'
                }`}
              >
                {k.baslik}
              </button>
            ))}
          </div>

          {/* Accordion */}
          <div className="space-y-3">
            {aktifKat.sorular.map((item, i) => (
              <AccordionItem
                key={i}
                soru={item.soru}
                cevap={item.cevap}
                isOpen={openIndex === i}
                onToggle={() => setOpenIndex(openIndex === i ? null : i)}
              />
            ))}
          </div>
        </div>

        {/* ── CTA ──────────────────────────────────────── */}
        <section className="py-12 bg-white border-t border-gray-200">
          <div className="max-w-2xl mx-auto px-4 text-center">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-6 h-6 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Cevap bulamadın mı?</h2>
            <p className="text-gray-500 text-sm mb-6">
              Aklındaki soruyu bize yaz, en kısa sürede yanıtlayalım.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="mailto:info@modulerpazar.com"
                className="inline-flex items-center justify-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold text-sm hover:bg-emerald-700 transition"
              >
                E-posta Gönder
              </a>
              <Link
                to="/talep-olustur"
                className="inline-flex items-center justify-center gap-2 border border-emerald-600 text-emerald-600 px-6 py-3 rounded-lg font-semibold text-sm hover:bg-emerald-50 transition"
              >
                Teklif Al
              </Link>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
