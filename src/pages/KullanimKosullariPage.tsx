import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEOMeta from '../components/SEOMeta';
import { SITE_CONFIG, LEGAL_LINKS } from '../config/site';

/* ─── Yardımcı bileşenler ─────────────────────────────────── */
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-lg font-bold text-gray-800 mb-3 pb-2 border-b border-gray-100">
      {children}
    </h2>
  );
}

function BulletList({ items, color = 'bg-emerald-500' }: { items: string[]; color?: string }) {
  return (
    <ul className="space-y-2 text-gray-600">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2">
          <span className={`w-1.5 h-1.5 rounded-full ${color} mt-2 flex-shrink-0`} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/* ─── İlan kuralları tablosu ──────────────────────────────── */
const LISTING_RULES = [
  ['Doğru Bilgi', 'Fiyat, boyutlar, malzeme ve özellikler eksiksiz ve gerçeğe uygun belirtilmelidir. Yanıltıcı ilan hukuki sorumluluk doğurur.'],
  ['Özgün İçerik', 'Fotoğraf ve açıklamalar özgün olmalı; başkasına ait materyaller telif sahibinin izni olmadan kullanılamaz.'],
  ['Yasal Uyumluluk', 'Satışa sunulan ürünler Türk hukukuna uygun olmalı; lisans/izin/TS belgesi gerektiren ürünler için belgeler hazır bulundurulmalıdır.'],
  ['Stok Güncelliği', 'Stoğu tükenmiş veya artık geçerli olmayan ilanlar 24 saat içinde kapatılmalı ya da güncellenmelidir.'],
  ['Tekil İlan', 'Aynı ürün için birden fazla aktif ilan açmak yasaktır; tekrarlı ilanlar uyarı yapılmaksızın kaldırılır.'],
  ['Fiyat Şeffaflığı', 'KDV dahil/hariç durumu açıkça belirtilmelidir. Gizli ücret veya belirsiz fiyat kabul edilmez.'],
  ['Teslim Koşulları', 'Teslim süresi, kurulum dahil/hariç durumu ve nakliye sorumluluğu ilanda açıklanmalıdır.'],
  ['Gerçek Görseller', 'İlana ait olmayan stok görseller kullanılabilir, ancak "temsili görsel" ibaresi eklenmelidir.'],
];

/* ─── Yasak içerikler ─────────────────────────────────────── */
const PROHIBITED = [
  'Sahte firma veya kimlik bilgisiyle kayıt olmak',
  'İzinsiz veya ruhsatsız yapı, konteyner satışı (ruhsat gerektiren durumlarda)',
  'Hileli, yanıltıcı veya abartılı ilan içeriği oluşturmak',
  'Başka kullanıcıların ilanlarını izinsiz kopyalamak',
  'Platform altyapısına zarar vermeye yönelik girişimler (DoS, scraping, otomatik bot kullanımı)',
  'Diğer kullanıcılara yönelik taciz, hakaret veya tehdit içerikli mesajlar',
  'Platformu devre dışı bırakarak doğrudan ticaret yapmaya yönlendirme',
  'Sahte değerlendirme veya yorum oluşturmak',
  'Üçüncü şahısların kişisel verilerini izinsiz paylaşmak',
  'Spam mesaj veya toplu ilan paylaşımı',
];

/* ─── Ücretlendirme ───────────────────────────────────────── */
const PRICING = [
  {
    title: 'Alıcılar / Bireysel Kullanıcılar',
    badge: 'Tamamen Ücretsiz',
    badgeColor: 'bg-emerald-100 text-emerald-700',
    items: [
      'Sınırsız ilan görüntüleme',
      'Teklif talebi gönderme (üyelik gerekmez)',
      'Firma profili ve referans inceleme',
      'Favorilere ekleme (üyelik gerektirir)',
    ],
  },
  {
    title: 'Satıcılar / Firmalar',
    badge: 'Freemium',
    badgeColor: 'bg-blue-100 text-blue-700',
    items: [
      'İlk 3 ilan ücretsizdir',
      'Ek ilan paketi ücretlidir (güncel tarifeler panelde görünür)',
      'Öne çıkarma ve vitrin paketi ücretlidir',
      'Premium üyelik: sınırsız ilan + istatistik erişimi',
    ],
  },
];

/* ─── Sorumluluk sınırları ────────────────────────────────── */
const LIABILITY_LIMITS = [
  'Platform, yalnızca teknik altyapı sağlayıcısıdır; ürün veya hizmetin satıcısı ya da sağlayıcısı sıfatıyla hareket etmez.',
  '6502 sayılı TKHK kapsamında "satıcı" veya "sağlayıcı" sayılmaz; ayıplı mal/hizmet sorumluluğu doğrudan ilgili firmaya aittir.',
  'Firma tarafından verilen yanlış veya yanıltıcı ilan bilgilerinden doğan zararlar',
  'Teslimat gecikmeleri, ürün kusurları veya monte hataları',
  'Alıcı–satıcı arasındaki ödeme anlaşmazlıkları ve cezai şartlar',
  'Doğal afet, siber saldırı gibi mücbir sebeplerden kaynaklanan hizmet kesintileri',
  'Üçüncü taraf bağlantı ve hizmetlerinin içerik veya erişilebilirliği',
  'Teknik arızalar nedeniyle oluşan dolaylı veya iş kaybı niteliğindeki zararlar',
];

/* ─── Bileşen ─────────────────────────────────────────────── */
export default function KullanimKosullariPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <SEOMeta
        title="Kullanım Koşulları — ModülerPazar"
        description="ModülerPazar platformunu kullanım koşulları ve kullanıcı sözleşmesi."
        url="/kullanim-kosullari"
      />
      <Header />

      <main className="flex-1 bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4">

          {/* Breadcrumb */}
          <nav className="text-sm text-gray-500 mb-6 flex items-center gap-2">
            <Link to="/" className="hover:text-emerald-600 transition">Ana Sayfa</Link>
            <span>/</span>
            <span className="text-gray-800">Kullanım Koşulları</span>
          </nav>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12">

            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              Kullanım Koşulları
            </h1>
            <p className="text-sm text-gray-500 mb-2">Son güncelleme: Ocak 2025 — Versiyon 1.0</p>

            <p className="text-gray-600 leading-relaxed mb-6">
              Bu Kullanım Koşulları, <strong>{SITE_CONFIG.name}</strong> platformunun
              (bundan böyle "Platform") kullanımına ilişkin hak ve yükümlülükleri düzenlemektedir.
              Platforma erişerek veya hesap oluşturarak bu koşulları okuduğunuzu, anladığınızı ve
              kabul ettiğinizi beyan edersiniz. Koşulları kabul etmiyorsanız lütfen platformu
              kullanmayınız.
            </p>

            {/* ── Platformun Aracı Rolü — Vurgulu Kutu ── */}
            <div className="mb-8 bg-amber-50 border-l-4 border-amber-400 rounded-xl p-5">
              <p className="text-sm font-bold text-amber-800 mb-2 uppercase tracking-wide">
                Önemli Bilgi: Platformun Aracı Rolü
              </p>
              <p className="text-sm text-amber-900 leading-relaxed">
                <strong>{SITE_CONFIG.name}</strong>, alıcı ve satıcıları bir araya getiren elektronik
                bir <strong>aracı hizmet sağlayıcıdır</strong>. Platform, taraflar arasındaki satım
                veya hizmet sözleşmesinin tarafı <strong>değildir</strong>; yalnızca tarafları
                buluşturan bir ortam sağlar. Fiyat, kalite, teslim ve satış sonrası hizmet gibi tüm
                ticari yükümlülükler, alıcı ile ilgili satıcı firma arasında doğrudan kalır.
                Platform bu yükümlülüklerin hiçbirini üstlenmez.
              </p>
            </div>

            {/* 1 — Taraflar ve Platform Rolü */}
            <section className="mb-10">
              <SectionTitle>1. Taraflar ve Platformun Rolü</SectionTitle>
              <p className="text-gray-600 leading-relaxed mb-4">
                Bu koşullar; <strong>{SITE_CONFIG.name}</strong> ("Hizmet Sağlayıcı") ile platforma
                erişen her gerçek veya tüzel kişi ("Kullanıcı") arasında akdedilmektedir.
              </p>
              <div className="bg-gray-50 rounded-xl p-5 mb-4 text-sm text-gray-600 space-y-2">
                <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
                  <p><span className="font-semibold text-gray-700">Ticaret Unvanı:</span> {SITE_CONFIG.name}</p>
                  <p><span className="font-semibold text-gray-700">Adres:</span> {SITE_CONFIG.address}</p>
                  <p><span className="font-semibold text-gray-700">E-posta:</span>{' '}
                    <a href={`mailto:${SITE_CONFIG.email}`} className="text-emerald-600 hover:underline">{SITE_CONFIG.email}</a>
                  </p>
                  <p><span className="font-semibold text-gray-700">Telefon:</span>{' '}
                    <a href={`tel:${SITE_CONFIG.phone.replace(/\s/g, '')}`} className="text-emerald-600 hover:underline">{SITE_CONFIG.phone}</a>
                  </p>
                </div>
              </div>

              <p className="text-gray-600 leading-relaxed mb-3">
                Platform, alıcılar ile modüler yapı sektöründeki üretici ve satıcılar arasında
                aracılık hizmeti sunan elektronik bir ticaret ortamıdır. Bu bağlamda:
              </p>
              <BulletList items={[
                'Platform, taraflar arasındaki satış sözleşmesinin doğrudan tarafı değildir.',
                'İlan içeriklerinin doğruluğundan ilgili firma sorumludur; platform garanti vermez.',
                'Platform üzerinden yalnızca teklif talebi iletilir; ödeme ve teslimat satıcı ile alıcı arasında gerçekleşir.',
                'Platform, 6563 sayılı Elektronik Ticaretin Düzenlenmesi Hakkında Kanun kapsamında aracı hizmet sağlayıcı konumundadır.',
              ]} />
            </section>

            {/* 2 — Üyelik ve Hesap */}
            <section className="mb-10">
              <SectionTitle>2. Üyelik, Hesap ve Doğrulama</SectionTitle>
              <div className="space-y-4">
                {[
                  {
                    title: '2.1 Bireysel Kullanıcılar',
                    items: [
                      'Kayıt için 18 yaşını doldurmuş olmak zorunludur.',
                      'Teklif talebi göndermek kayıt gerektirmez; ancak talep takibi ve bildirimler için hesap önerilir.',
                      'Gerçeğe aykırı bilgi vermek hesap kapatma gerekçesidir.',
                    ],
                  },
                  {
                    title: '2.2 Firmalar / Satıcılar',
                    items: [
                      'İlan verebilmek için ticaret sicil belgesi ve vergi levhası zorunludur.',
                      'Kimlik doğrulaması tamamlanmadan ilanlar yayımlanmaz.',
                      'Firma bilgilerindeki değişiklikler 30 gün içinde platforma bildirilmelidir.',
                      'Doğrulama belgelerinin sahte olduğu tespit edildiğinde hesap derhal kapatılır ve yasal yollara başvurulur.',
                    ],
                  },
                  {
                    title: '2.3 Hesap Güvenliği',
                    items: [
                      'Şifrenizin güvenliğinden siz sorumlusunuz; şifrenizi kimseyle paylaşmayınız.',
                      'Yetkisiz erişim şüphesinde derhal destek@modulerpazar.com adresine bildirin.',
                      'Güçlü şifre ve iki faktörlü kimlik doğrulama (2FA) kullanmanız önerilir.',
                      'Hesabınızın üçüncü kişi tarafından kötüye kullanılmasından platform sorumlu tutulamaz.',
                    ],
                  },
                ].map((block) => (
                  <div key={block.title} className="bg-gray-50 rounded-xl p-4">
                    <h3 className="font-semibold text-gray-800 mb-2 text-sm">{block.title}</h3>
                    <BulletList items={block.items} />
                  </div>
                ))}
              </div>
            </section>

            {/* 3 — İlan Kuralları ve Firma Yükümlülükleri */}
            <section className="mb-10">
              <SectionTitle>3. İlan Verme Kuralları ve Firma Yükümlülükleri</SectionTitle>
              <p className="text-gray-600 leading-relaxed mb-4">
                Platform üzerinden ilan veren her kullanıcı ve firma aşağıdaki kurallara uymakla
                yükümlüdür. Aykırılık tespit edildiğinde ilan uyarı yapılmaksızın kaldırılabilir,
                hesap askıya alınabilir:
              </p>
              <div className="overflow-x-auto mb-6">
                <table className="w-full text-sm text-gray-600 border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left px-3 py-2 border border-gray-200 font-semibold">Kural</th>
                      <th className="text-left px-3 py-2 border border-gray-200 font-semibold">Açıklama</th>
                    </tr>
                  </thead>
                  <tbody>
                    {LISTING_RULES.map(([rule, desc], i) => (
                      <tr key={rule} className={i % 2 === 1 ? 'bg-gray-50' : ''}>
                        <td className="px-3 py-2 border border-gray-200 font-medium whitespace-nowrap align-top">{rule}</td>
                        <td className="px-3 py-2 border border-gray-200">{desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mb-5 text-sm text-gray-500">
                Kurallara uymayan ilanlar için önce uyarı e-postası gönderilir. Tekrarlı ihlallerde
                hesap geçici olarak askıya alınır; üçüncü ihlalde hesap kalıcı olarak kapatılır.
              </p>

              {/* Firma Yükümlülükleri — Güçlendirilmiş */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
                <h3 className="font-semibold text-blue-900 mb-3 text-sm uppercase tracking-wide">
                  3.1 Firma Yükümlülükleri
                </h3>
                <div className="space-y-3 text-sm text-blue-900">
                  <div className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                    <p><strong>Hizmetin Arkasında Durma:</strong> Firmalar, ilan verdikleri ürün ve hizmetlerin
                    kalitesinden, kurulumdan, teslimattan ve satış sonrası hizmetlerden alıcıya karşı
                    doğrudan ve münhasıran sorumludur. Platform bu sorumlulukların hiçbirini üstlenmez.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                    <p><strong>Şikayet Muhataplığı:</strong> Alıcı şikayetleri öncelikle ilgili firmaya
                    yöneltilir. Firmalar platforma iletilen şikayetlere <strong>10 iş günü</strong> içinde
                    yanıt vermekle yükümlüdür; yanıt verilmemesi hesap askıya alma gerekçesidir.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                    <p><strong>Gerçek Bilgi Zorunluluğu:</strong> Sahte firma kimliği, gerçeğe aykırı vergi/sicil
                    belgesi veya yanıltıcı ilan içeriği kesinlikle yasaktır. Bu durum hesabın derhal
                    kapatılması ve gerektiğinde ilgili kamu kurumlarına bildirim gerekçesidir.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                    <p><strong>Kayıt ile Kabul:</strong> Platforma firma kaydı yapan her kullanıcı, işbu
                    Kullanım Koşulları'nı ve Firma Yükümlülükleri'ni tümüyle okuduğunu ve kabul ettiğini
                    beyan eder. Sonradan "bilmiyordum" savunması geçerli kabul edilmez.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* 4 — Yasak İçerik */}
            <section className="mb-10">
              <SectionTitle>4. Yasak İçerik ve Davranışlar</SectionTitle>
              <p className="text-gray-600 leading-relaxed mb-3">
                Aşağıdaki eylemler platforma erişim hakkının derhal ve kalıcı olarak sona erdirilmesi
                gerekçesidir. Ağır ihlallerde yasal yollara başvurulacaktır:
              </p>
              <BulletList items={PROHIBITED} color="bg-red-400" />
              <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800">
                Platform, yasadışı içerik veya davranış tespit ettiğinde ilgili makamları
                (Siber Suçlarla Mücadele Birimi, KVKK Kurulu vb.) bilgilendirme hakkını saklı tutar.
              </div>
            </section>

            {/* 5 — Teklif Sistemi */}
            <section className="mb-10">
              <SectionTitle>5. Teklif Sistemi ve Aracılık Süreci</SectionTitle>
              <p className="text-gray-600 leading-relaxed mb-3">
                Platform, alıcıların aynı anda en fazla <strong>2 firmaya</strong> teklif talebi
                gönderebildiği karşılaştırmalı bir teklif sistemi sunar.
              </p>
              <BulletList items={[
                'Teklif talebi, alıcının firmaya yönelik resmi bir bağlayıcı teklif değildir; yalnızca iletişim başlatma aracıdır.',
                'Firmalar gelen taleplere yanıt verme konusunda yükümlü değildir; yanıt süresi firma inisiyatifindedir.',
                'Teklif talebinde paylaşılan iletişim bilgileri yalnızca belirtilen firma ile paylaşılır.',
                'Alıcı ve satıcı arasında varılan anlaşma platformdan bağımsız olarak yürütülür; platform bu anlaşmanın tarafı değildir.',
                'Teklif taleplerinin kötüye kullanımı (spam, manipülasyon) hesap kapatma gerekçesidir.',
              ]} />
            </section>

            {/* 6 — Talep Havuzu Sistemi (YENİ) */}
            <section className="mb-10">
              <SectionTitle>6. Talep Havuzu Sistemi</SectionTitle>
              <p className="text-gray-600 leading-relaxed mb-4">
                Platform, alıcıların proje gereksinimlerini sisteme girerek birden fazla firmadan
                teklif alabildiği bir <strong>talep havuzu</strong> işletmektedir. Bu sistem
                hakkında bilinmesi gerekenler:
              </p>
              <div className="space-y-3">
                {[
                  {
                    icon: '📋',
                    title: 'Talep Akışı',
                    desc: 'Alıcı, proje detaylarını (boyut, bütçe, konum, özellikler) platforma girer. Sistem bu talebi uygun kategorideki firmalarla eşleştirir ve bildirim gönderir.',
                  },
                  {
                    icon: '🔒',
                    title: 'Gizlilik',
                    desc: 'Taleple birlikte paylaşılan iletişim bilgileri (ad, telefon, e-posta) yalnızca alıcının seçtiği veya eşleşen firmalarla paylaşılır; diğer kullanıcılara kapalıdır.',
                  },
                  {
                    icon: '⚠️',
                    title: 'Garanti Yoktur',
                    desc: 'Platform, firmaların talebi yanıtlayacağını, uygun fiyat teklif edeceğini veya bir anlaşmanın gerçekleşeceğini garanti etmez. Yanıt vermek firmanın takdirine bırakılmıştır.',
                  },
                  {
                    icon: '🔄',
                    title: 'Alternatif Arayışı',
                    desc: 'Seçilen firmalardan yanıt alınamadığı durumlarda alıcı, platforma yeni bir talep göndererek farklı firmalarla iletişime geçmekte tamamen serbesttir.',
                  },
                ].map((item) => (
                  <div key={item.title} className="flex gap-4 bg-gray-50 rounded-xl p-4">
                    <span className="text-xl flex-shrink-0 mt-0.5">{item.icon}</span>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{item.title}</p>
                      <p className="text-sm text-gray-500 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 7 — Ücretlendirme */}
            <section className="mb-10">
              <SectionTitle>7. Ücretlendirme ve Abonelik</SectionTitle>
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                {PRICING.map((plan) => (
                  <div key={plan.title} className="bg-gray-50 rounded-xl p-4">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <h3 className="font-semibold text-gray-800 text-sm">{plan.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${plan.badgeColor}`}>
                        {plan.badge}
                      </span>
                    </div>
                    <BulletList items={plan.items} />
                  </div>
                ))}
              </div>
              <BulletList items={[
                'Ücretli hizmetler için sözleşme, ödeme tamamlandıktan sonra kurulur.',
                'Abonelikler dönem sonunda otomatik yenilenir; yenileme e-posta ile önceden bildirilir.',
                'Ücret iadesi: hizmet kullanılmadan önce yapılan iptallerde tam iade; kısmen kullanımda orantılı iade değerlendirmesi yapılır.',
                'Platform fiyatları önceden duyurulmak kaydıyla değiştirme hakkını saklı tutar. Değişiklik mevcut abonelik dönemini etkilemez.',
              ]} />
            </section>

            {/* 8 — Sorumluluk Reddi (GÜNCELLENDİ) */}
            <section className="mb-10">
              <SectionTitle>8. Sorumluluk Reddi ve Sınırlandırması</SectionTitle>

              <div className="mb-4 bg-orange-50 border border-orange-200 rounded-xl p-4 text-sm text-orange-900">
                <strong>Altyapı Sağlayıcısı Beyanı:</strong> Platform, yalnızca teknik bir buluşma
                ortamı sağlar. 6502 sayılı Tüketicinin Korunması Hakkında Kanun (TKHK) kapsamında
                "satıcı" veya "sağlayıcı" sıfatıyla hareket etmez; bu nedenle ürün ve hizmetten
                kaynaklanan tüketici talepleri doğrudan ilgili firmaya yöneltilmelidir.
              </div>

              <p className="text-gray-600 leading-relaxed mb-3">
                Platform, aracı hizmet sağlayıcı konumunda olup aşağıdaki durumlardan kaynaklanan
                zararlardan sorumlu tutulamaz:
              </p>
              <BulletList items={LIABILITY_LIMITS} color="bg-gray-400" />
              <p className="mt-4 text-gray-600 leading-relaxed">
                Platformun herhangi bir nedenle sorumlu tutulabileceği hallerde sorumluluğu,
                kullanıcının son 12 ay içinde platforma ödediği abonelik bedeli ile sınırlıdır.
              </p>
              <div className="mt-4 bg-gray-50 rounded-xl p-4 text-sm text-gray-600">
                <strong>Arabuluculuk Yükümlülüğü Yok:</strong> Platform, alıcı ve satıcı arasında
                çıkan uyuşmazlıklarda arabuluculuk, tahkim veya uzlaştırma hizmeti sunmakla yükümlü
                değildir. Tarafların anlaşmazlıklarını öncelikle birbiriyle çözmeleri; çözüm
                sağlanamaması halinde yasal mercilere başvurmaları beklenir.
              </div>
            </section>

            {/* 9 — Fikri Mülkiyet */}
            <section className="mb-10">
              <SectionTitle>9. Fikri Mülkiyet Hakları</SectionTitle>
              <p className="text-gray-600 leading-relaxed mb-3">
                Platform tasarımı, yazılımı, logosu, veritabanı yapısı ve özgün içerikleri
                <strong> {SITE_CONFIG.name}</strong>'a aittir ve fikri mülkiyet hukukuyla
                korunmaktadır. Bu kapsamda:
              </p>
              <BulletList items={[
                'Platform içeriği yazılı izin olmadan kopyalanamaz, dağıtılamaz veya ticari amaçla kullanılamaz.',
                'Kullanıcılar, platforma yükledikleri içerikler (görseller, açıklamalar) için özgün haklarını korur.',
                'Platforma yüklenen içerik için; içeriğin platform üzerinde gösterilmesi, depolanması ve iletilmesiyle sınırlı, dünya genelinde, telifsiz bir lisans tanınmaktadır.',
                'Bu lisans hesabın kapatılmasıyla sona erer; ancak yasal saklama süreleri boyunca arşiv amaçlı devam edebilir.',
                'Platform markası, logosu ve alan adı üzerinde hiçbir kullanım hakkı tanınmamaktadır.',
              ]} />
            </section>

            {/* 10 — Gizlilik */}
            <section className="mb-10">
              <SectionTitle>10. Gizlilik ve Kişisel Veriler</SectionTitle>
              <p className="text-gray-600 leading-relaxed">
                Kişisel verilerinizin işlenmesi, platformun{' '}
                <Link to={LEGAL_LINKS.kvkk} className="text-emerald-600 hover:underline">KVKK Aydınlatma Metni</Link> ve{' '}
                <Link to={LEGAL_LINKS.gizlilik} className="text-emerald-600 hover:underline">Gizlilik Politikası</Link> ile
                yönetilmektedir. Bu belgeler işbu Kullanım Koşulları'nın ayrılmaz bir parçasını
                oluşturmaktadır. Platforma kayıt olarak söz konusu belgelerle Aydınlatma Metni
                kapsamında bilgilendirildiğinizi kabul etmiş olursunuz.
              </p>
            </section>

            {/* 11 — Hizmet Değişiklikleri */}
            <section className="mb-10">
              <SectionTitle>11. Hizmetin Değiştirilmesi ve Askıya Alınması</SectionTitle>
              <BulletList items={[
                'Platform, hizmetlerin kapsamını, arayüzünü veya özelliklerini önceden bildirim yapmaksızın değiştirme hakkını saklı tutar.',
                'Bakım, güvenlik veya teknik zorunluluklar nedeniyle hizmet geçici olarak kesintiye uğrayabilir; planlı kesintiler önceden duyurulur.',
                'Kullanım koşullarını ihlal eden hesaplar uyarı yapılmaksızın askıya alınabilir veya kapatılabilir.',
                'Platform tamamını kapatma kararı alırsa kayıtlı kullanıcılara en az 30 gün önceden bildirim yapılır.',
              ]} />
            </section>

            {/* 12 — Koşul Değişiklikleri */}
            <section className="mb-10">
              <SectionTitle>12. Koşullardaki Değişiklikler</SectionTitle>
              <p className="text-gray-600 leading-relaxed mb-3">
                Bu koşullar zaman zaman güncellenebilir. Değişiklikler şu şekilde duyurulur:
              </p>
              <BulletList items={[
                'Sayfanın başındaki "Son güncelleme" tarihi revize edilir.',
                'Önemli değişiklikler (ücretlendirme, sorumluluk, fikri mülkiyet) kayıtlı e-postanıza iletilir ve en az 15 gün önceden yürürlüğe girer.',
                'Değişiklik tarihinden sonra platforma girişiniz güncel koşulları kabul ettiğiniz anlamına gelir.',
                'Güncel olmayan koşullar arşivlenir; e-posta ile talep üzerine erişilebilir.',
              ]} />
            </section>

            {/* 13 — Uyuşmazlık Çözümü (GÜNCELLENDİ) */}
            <section className="mb-10">
              <SectionTitle>13. Uygulanacak Hukuk ve Uyuşmazlık Çözümü</SectionTitle>
              <p className="text-gray-600 leading-relaxed mb-3">
                Bu Kullanım Koşulları Türk hukukuna tabidir. Uyuşmazlıklarda aşağıdaki yollar
                sırasıyla değerlendirilir:
              </p>
              <div className="space-y-3">
                {[
                  {
                    step: '1',
                    color: 'bg-emerald-100 text-emerald-800',
                    title: 'Platform Şikayet Kanalı',
                    desc: 'Şikayetinizi önce platform destek kanalları aracılığıyla (e-posta / iletişim formu) iletiniz. Platform, ilgili firmayı bilgilendirerek çözüm arayışında aracı olabilir; ancak sonucun garantisi yoktur. 30 gün içinde yanıt alınmaya çalışılır.',
                  },
                  {
                    step: '2',
                    color: 'bg-blue-100 text-blue-800',
                    title: 'İstanbul Tüketici Hakem Heyeti',
                    desc: 'Tüketici niteliğindeki bireysel kullanıcılar, yasal para sınırları dahilinde İstanbul Tüketici Hakem Heyeti\'ne başvurabilir. Bu başvuru yalnızca firma ile alıcı arasındaki ticari uyuşmazlıklar için geçerlidir; platforma yönelik iddialar için aynı yol uygulanmaz.',
                  },
                  {
                    step: '3',
                    color: 'bg-gray-200 text-gray-800',
                    title: 'İstanbul Mahkemeleri',
                    desc: 'Diğer tüm anlaşmazlıklarda ve ticari nitelikteki davalarda İstanbul (Çağlayan) Mahkemeleri ve İcra Müdürlükleri münhasıran yetkilidir. Firmalar ile alıcılar arasındaki anlaşmazlıkta platform taraf tutmaz.',
                  },
                ].map((item) => (
                  <div key={item.step} className="flex gap-4 bg-gray-50 rounded-xl p-4">
                    <span className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 ${item.color}`}>
                      {item.step}
                    </span>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{item.title}</p>
                      <p className="text-sm text-gray-500 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 14 — İletişim */}
            <section className="mb-8">
              <SectionTitle>14. İletişim</SectionTitle>
              <p className="text-gray-600 leading-relaxed mb-3">
                Kullanım Koşulları'na ilişkin soru ve başvurularınız için:
              </p>
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 text-sm text-gray-600 space-y-2">
                <p><strong>E-posta:</strong>{' '}
                  <a href={`mailto:${SITE_CONFIG.email}`} className="text-emerald-600 hover:underline">{SITE_CONFIG.email}</a>
                </p>
                <p><strong>KEP:</strong> modulerpazar@hs01.kep.tr</p>
                <p><strong>Adres:</strong> {SITE_CONFIG.address}</p>
                <p><strong>Telefon:</strong>{' '}
                  <a href={`tel:${SITE_CONFIG.phone.replace(/\s/g, '')}`} className="text-emerald-600 hover:underline">{SITE_CONFIG.phone}</a>
                </p>
                <p className="text-xs text-gray-400 pt-1">
                  Yanıt süresi iş günlerinde en geç 5 (beş) iş günüdür.
                </p>
              </div>
            </section>

            <p className="text-xs text-gray-400 border-t border-gray-100 pt-6">
              Bu koşullar 6098 sayılı Türk Borçlar Kanunu, 6563 sayılı Elektronik Ticaretin
              Düzenlenmesi Hakkında Kanun, 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve
              ilgili mevzuat çerçevesinde hazırlanmıştır.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
