import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { SITE_CONFIG, LEGAL_LINKS } from '../config/site';

/* ─── Yeniden kullanılan küçük bileşenler ─────────────────── */
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-lg font-bold text-gray-800 mb-3 pb-2 border-b border-gray-100">
      {children}
    </h2>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 text-gray-600">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/* ─── Veri tablosu satırları ──────────────────────────────── */
const DATA_CATEGORIES = [
  {
    category: 'Kimlik',
    examples: 'Ad, soyad, T.C. kimlik no (doğrulama için)',
    source: 'Kayıt formu',
    legal: 'Sözleşme ifası (m.5/2-c)',
  },
  {
    category: 'İletişim',
    examples: 'E-posta, cep telefonu, fatura adresi',
    source: 'Kayıt formu',
    legal: 'Sözleşme ifası (m.5/2-c)',
  },
  {
    category: 'Firma',
    examples: 'Ticaret unvanı, vergi no, MERSİS no, ticaret sicil no, imza yetkilisi',
    source: 'Satıcı kayıt formu',
    legal: 'Kanuni yükümlülük (m.5/2-ç)',
  },
  {
    category: 'İlan & Teklif',
    examples: 'İlan içeriği, fotoğraflar, fiyat bilgisi, teklif talepleri, mesajlar',
    source: 'Platform kullanımı',
    legal: 'Sözleşme ifası (m.5/2-c)',
  },
  {
    category: 'Ödeme',
    examples: 'Fatura bilgisi, ödeme tipi (kart numarası saklanmaz; ödeme sağlayıcı tarafından işlenir)',
    source: 'Ödeme akışı',
    legal: 'Kanuni yükümlülük (m.5/2-ç)',
  },
  {
    category: 'Teknik',
    examples: 'IP adresi, tarayıcı türü, işletim sistemi, çerez verileri, sayfa gezinme logları',
    source: 'Otomatik (çerez/log)',
    legal: 'Meşru menfaat (m.5/2-f)',
  },
  {
    category: 'Pazarlama',
    examples: 'İletişim tercihleri, kampanya etkileşimleri',
    source: 'Onay formu',
    legal: 'Açık rıza (m.5/1)',
  },
];

/* ─── Amaç & hukuki dayanak tablosu ──────────────────────── */
const PURPOSES = [
  {
    purpose: 'Üyelik kaydı ve hesap yönetimi',
    legal: 'Sözleşmenin kurulması ve ifası',
    article: 'KVKK m. 5/2-c',
  },
  {
    purpose: 'İlan yayımlama ve teklif iletimi',
    legal: 'Sözleşmenin ifası',
    article: 'KVKK m. 5/2-c',
  },
  {
    purpose: 'Firma kimlik ve ticaret sicil doğrulaması',
    legal: 'Hukuki yükümlülük',
    article: 'KVKK m. 5/2-ç',
  },
  {
    purpose: 'Fatura kesimi ve muhasebe kayıtları',
    legal: 'Hukuki yükümlülük (VUK, TTK)',
    article: 'KVKK m. 5/2-ç',
  },
  {
    purpose: 'Platform güvenliği ve dolandırıcılık önleme',
    legal: 'Meşru menfaat',
    article: 'KVKK m. 5/2-f',
  },
  {
    purpose: 'Anlaşmazlık çözümü ve hukuki süreçler',
    legal: 'Hakkın tesisi, kullanılması veya korunması',
    article: 'KVKK m. 5/2-e',
  },
  {
    purpose: 'Platform iyileştirme ve istatistiksel analiz',
    legal: 'Meşru menfaat',
    article: 'KVKK m. 5/2-f',
  },
  {
    purpose: 'Yasal bildirimlerin iletilmesi',
    legal: 'Hukuki yükümlülük',
    article: 'KVKK m. 5/2-ç',
  },
  {
    purpose: 'Pazarlama ve kampanya bildirimleri',
    legal: 'Açık rıza',
    article: 'KVKK m. 5/1',
  },
];

/* ─── Saklama süreleri ────────────────────────────────────── */
const RETENTION = [
  ['Üyelik ve hesap bilgileri', 'Hesap silme tarihinden itibaren 2 yıl'],
  ['İlan ve teklif verileri', 'Hesap silme tarihinden itibaren 3 yıl'],
  ['Mesajlaşma kayıtları', '2 yıl'],
  ['Fatura ve ticari kayıtlar', '10 yıl (Türk Ticaret Kanunu m. 82 / VUK m. 253)'],
  ['Teknik log ve erişim kayıtları', '1 yıl (5651 sayılı Kanun)'],
  ['Pazarlama onay kayıtları', 'Onayın geri alınmasına kadar; akabinde 3 yıl ispat amaçlı'],
  ['Çerez verileri (analitik)', 'En fazla 13 ay (Google Analytics önerisi)'],
  ['KVKK başvuru kayıtları', '3 yıl'],
];

/* ─── KVKK Madde 11 hakları ───────────────────────────────── */
const RIGHTS = [
  {
    title: 'Bilgi edinme',
    desc: 'Kişisel verilerinizin işlenip işlenmediğini öğrenme hakkına sahipsiniz.',
  },
  {
    title: 'Bilgi talep etme',
    desc: 'İşlenmiş ise buna ilişkin bilgi talep edebilirsiniz; hangi verilerin, hangi amaçla işlendiğini öğrenebilirsiniz.',
  },
  {
    title: 'Amaç ve uygunluk sorgulama',
    desc: 'İşlenme amacını ve verilerin amaca uygun kullanılıp kullanılmadığını sorgulayabilirsiniz.',
  },
  {
    title: 'Yurt içi/yurt dışı aktarım bilgisi',
    desc: 'Verilerinizin aktarıldığı üçüncü kişileri ve aktarım gerekçelerini öğrenebilirsiniz.',
  },
  {
    title: 'Düzeltme talep etme',
    desc: 'Eksik veya yanlış işlenmiş kişisel verilerinizin düzeltilmesini ve bu düzeltmenin aktarılan üçüncü kişilere bildirilmesini isteyebilirsiniz.',
  },
  {
    title: 'Silme veya yok etme',
    desc: 'İşlenmesini gerektiren sebeplerin ortadan kalkması halinde verilerinizin silinmesini veya yok edilmesini talep edebilirsiniz.',
  },
  {
    title: 'Otomatik işleme itiraz',
    desc: 'İşlenen verilerin yalnızca otomatik sistemler aracılığıyla analiz edilmesi nedeniyle aleyhinize doğan bir sonuca itiraz etme hakkına sahipsiniz.',
  },
  {
    title: 'Zarar tazminatı',
    desc: 'Mevzuata aykırı veri işleme nedeniyle zarara uğramanız halinde tazminat talep edebilirsiniz.',
  },
];

/* ─── Güvenlik tedbirleri ─────────────────────────────────── */
const SECURITY_TECHNICAL = [
  'TLS 1.2/1.3 protokolüyle şifreli veri iletimi',
  'Veritabanı şifrelemesi (AES-256)',
  'Rol tabanlı erişim kontrolü (RBAC)',
  'İki faktörlü kimlik doğrulama (2FA) desteği',
  'Düzenli sızma testi ve güvenlik açığı taraması',
  'Otomatik oturum zaman aşımı',
  'Güvenlik duvarı (WAF) ve DDoS koruma',
];

const SECURITY_ADMINISTRATIVE = [
  'Çalışanlar için periyodik KVKK ve veri güvenliği eğitimi',
  'Veri erişimi "bilinmesi gereken" prensibiyle sınırlandırılmıştır',
  'Veri işleme sözleşmeleri (DPA) tüm iş ortaklarıyla imzalanmaktadır',
  'Veri ihlali müdahale planı (Incident Response Plan) mevcuttur',
  'İhlal durumunda KVKK Kurulu\'na 72 saat içinde bildirim yapılmaktadır',
  'Etkilenen veri sahiplerine makul sürede bildirim gönderilmektedir',
];

/* ─── Bileşen ─────────────────────────────────────────────── */
export default function KvkkPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4">

          {/* Breadcrumb */}
          <nav className="text-sm text-gray-500 mb-6 flex items-center gap-2">
            <Link to="/" className="hover:text-emerald-600 transition">Ana Sayfa</Link>
            <span>/</span>
            <span className="text-gray-800">KVKK Aydınlatma Metni</span>
          </nav>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12">

            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              Kişisel Verilerin Korunması Kanunu (KVKK)<br />Aydınlatma Metni
            </h1>
            <p className="text-sm text-gray-500 mb-2">Son güncelleme: Ocak 2025 — Versiyon 1.0</p>
            <p className="text-sm text-gray-500 mb-8">
              Bu metin, 6698 sayılı Kişisel Verilerin Korunması Kanunu'nun 10. maddesi ve
              Aydınlatma Yükümlülüğünün Yerine Getirilmesinde Uyulacak Usul ve Esaslar Hakkında
              Tebliğ uyarınca hazırlanmıştır.
            </p>

            {/* 1 — Veri Sorumlusu */}
            <section className="mb-10">
              <SectionTitle>1. Veri Sorumlusu</SectionTitle>
              <p className="text-gray-600 leading-relaxed mb-4">
                6698 sayılı Kanun kapsamında <strong>veri sorumlusu</strong> sıfatıyla kişisel
                verilerinizi işleyen platform aşağıda tanımlanmıştır:
              </p>
              <div className="bg-gray-50 rounded-xl p-5 text-sm text-gray-600 space-y-2">
                <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
                  <p><span className="font-semibold text-gray-700">Ticaret Unvanı:</span> {SITE_CONFIG.name}</p>
                  <p><span className="font-semibold text-gray-700">Adres:</span> {SITE_CONFIG.address}</p>
                  <p><span className="font-semibold text-gray-700">E-posta:</span>{' '}
                    <a href={`mailto:${SITE_CONFIG.email}`} className="text-emerald-600 hover:underline">{SITE_CONFIG.email}</a>
                  </p>
                  <p><span className="font-semibold text-gray-700">Telefon:</span>{' '}
                    <a href={`tel:${SITE_CONFIG.phone.replace(/\s/g, '')}`} className="text-emerald-600 hover:underline">{SITE_CONFIG.phone}</a>
                  </p>
                  <p><span className="font-semibold text-gray-700">KEP Adresi:</span> modulerpazar@hs01.kep.tr</p>
                  <p><span className="font-semibold text-gray-700">KVKK Başvuru Birimi:</span> Veri Koruma Sorumlusu (DPO)</p>
                </div>
              </div>
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
                <strong>KVKK Veri Sorumluları Sicil Bilgi Sistemi (VERBİS):</strong> Platformumuz,
                KVKK Kurulu'nun belirlediği yükümlülükler kapsamında VERBİS'e kayıt yükümlülüğüne
                tabidir ve kaydımız aktif durumdadır.
              </div>
            </section>

            {/* 2 — Toplanan Veriler */}
            <section className="mb-10">
              <SectionTitle>2. Toplanan Kişisel Veriler, Kaynakları ve Hukuki Dayanakları</SectionTitle>
              <p className="text-gray-600 leading-relaxed mb-4">
                Platformumuz aşağıdaki kişisel veri kategorilerini otomatik ve otomatik olmayan
                yollarla toplamaktadır:
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-gray-600 border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left px-3 py-2 border border-gray-200 font-semibold">Kategori</th>
                      <th className="text-left px-3 py-2 border border-gray-200 font-semibold">Veri Örnekleri</th>
                      <th className="text-left px-3 py-2 border border-gray-200 font-semibold">Kaynak</th>
                      <th className="text-left px-3 py-2 border border-gray-200 font-semibold">Hukuki Dayanak</th>
                    </tr>
                  </thead>
                  <tbody>
                    {DATA_CATEGORIES.map((row, i) => (
                      <tr key={row.category} className={i % 2 === 1 ? 'bg-gray-50' : ''}>
                        <td className="px-3 py-2 border border-gray-200 font-medium whitespace-nowrap">{row.category}</td>
                        <td className="px-3 py-2 border border-gray-200">{row.examples}</td>
                        <td className="px-3 py-2 border border-gray-200 whitespace-nowrap">{row.source}</td>
                        <td className="px-3 py-2 border border-gray-200 whitespace-nowrap text-xs text-gray-500">{row.legal}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-xs text-gray-400">
                * Özel nitelikli kişisel veri (KVKK m. 6) yalnızca açık rızanız alınarak işlenir.
                Ödeme kartı verileri platformumuzda saklanmaz; PCI-DSS uyumlu ödeme sağlayıcı tarafından işlenir.
              </p>
            </section>

            {/* 3 — Amaçlar ve Hukuki Dayanaklar */}
            <section className="mb-10">
              <SectionTitle>3. Kişisel Verilerin İşlenme Amaçları ve Hukuki Dayanakları</SectionTitle>
              <p className="text-gray-600 leading-relaxed mb-4">
                Kişisel verileriniz aşağıdaki amaçlarla ve belirtilen KVKK hükümlerine dayalı olarak işlenmektedir:
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-gray-600 border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left px-3 py-2 border border-gray-200 font-semibold">İşleme Amacı</th>
                      <th className="text-left px-3 py-2 border border-gray-200 font-semibold">Hukuki Dayanak</th>
                      <th className="text-left px-3 py-2 border border-gray-200 font-semibold">KVKK Maddesi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {PURPOSES.map((row, i) => (
                      <tr key={row.purpose} className={i % 2 === 1 ? 'bg-gray-50' : ''}>
                        <td className="px-3 py-2 border border-gray-200">{row.purpose}</td>
                        <td className="px-3 py-2 border border-gray-200">{row.legal}</td>
                        <td className="px-3 py-2 border border-gray-200 text-xs font-mono text-emerald-700">{row.article}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 bg-gray-50 rounded-xl p-4 text-xs text-gray-500 space-y-1">
                <p><strong>m. 5/1:</strong> Açık rıza — Pazarlama gibi zorunlu olmayan işlemler için ayrıca onayınız alınır.</p>
                <p><strong>m. 5/2-c:</strong> Sözleşmenin kurulması veya ifası</p>
                <p><strong>m. 5/2-ç:</strong> Kanunlarda açıkça öngörülmesi (VUK, TTK, 5651 sayılı Kanun vb.)</p>
                <p><strong>m. 5/2-e:</strong> Bir hakkın tesisi, kullanılması veya korunması</p>
                <p><strong>m. 5/2-f:</strong> İlgili kişinin temel hak ve özgürlüklerine zarar vermemek kaydıyla meşru menfaat</p>
              </div>
            </section>

            {/* 4 — Veri Aktarımı */}
            <section className="mb-10">
              <SectionTitle>4. Kişisel Verilerin Aktarıldığı Taraflar ve Aktarım Koşulları</SectionTitle>

              <h3 className="font-semibold text-gray-700 mb-2 mt-4">4.1 Yurt İçi Aktarım</h3>
              <p className="text-gray-600 leading-relaxed mb-3">
                Kişisel verileriniz KVKK'nın 8. maddesi uyarınca aşağıdaki taraflarla paylaşılabilir:
              </p>
              <ul className="space-y-3 text-gray-600 mb-4">
                {[
                  { bold: 'Platform üyesi firmalar:', text: 'Teklif talebinizde seçtiğiniz firmalarla yalnızca talep kapsamındaki verileriniz paylaşılır.' },
                  { bold: 'Ödeme hizmet sağlayıcıları:', text: 'Fatura bilgileri ödeme altyapısı sağlayıcılarıyla sözleşmesel güvence altında paylaşılır.' },
                  { bold: 'Yetkili kurum ve kuruluşlar:', text: 'Mahkemeler, savcılıklar, vergi daireleri ve düzenleyici kurumlar yasal zorunluluk kapsamında.' },
                  { bold: 'Denetçi ve danışmanlar:', text: 'Hukuki veya mali denetim süreçlerinde gizlilik sözleşmesiyle bağlı profesyoneller.' },
                ].map((item) => (
                  <li key={item.bold} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                    <span><strong>{item.bold}</strong> {item.text}</span>
                  </li>
                ))}
              </ul>

              <h3 className="font-semibold text-gray-700 mb-2">4.2 Yurt Dışı Aktarım</h3>
              <p className="text-gray-600 leading-relaxed mb-3">
                Kişisel verileriniz KVKK'nın 9. maddesi çerçevesinde aşağıdaki teknik altyapı
                sağlayıcılarına yurt dışında aktarılabilir:
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-gray-600 border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left px-3 py-2 border border-gray-200 font-semibold">Sağlayıcı</th>
                      <th className="text-left px-3 py-2 border border-gray-200 font-semibold">Konum</th>
                      <th className="text-left px-3 py-2 border border-gray-200 font-semibold">Aktarılan Veri</th>
                      <th className="text-left px-3 py-2 border border-gray-200 font-semibold">Güvence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['Google Analytics', 'ABD', 'Anonim teknik veriler', 'SCCs / Yeterlilik kararı'],
                      ['Cloudflare', 'ABD', 'IP, teknik log', 'SCCs'],
                      ['SMTP / E-posta altyapısı', 'AB/ABD', 'E-posta adresi', 'SCCs'],
                      ['Bulut depolama', 'AB', 'Yüklenen görseller', 'AB Yeterlilik kararı'],
                    ].map(([provider, loc, data, guarantee], i) => (
                      <tr key={provider} className={i % 2 === 1 ? 'bg-gray-50' : ''}>
                        <td className="px-3 py-2 border border-gray-200 font-medium">{provider}</td>
                        <td className="px-3 py-2 border border-gray-200">{loc}</td>
                        <td className="px-3 py-2 border border-gray-200">{data}</td>
                        <td className="px-3 py-2 border border-gray-200 text-xs text-gray-500">{guarantee}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-xs text-gray-400">
                SCCs: Standart Sözleşme Maddeleri (Standard Contractual Clauses). Aktarımların tamamı
                KVKK m. 9 ve Kurul kararlarıyla uyumlu güvencelerle gerçekleştirilmektedir.
              </p>
              <p className="mt-2 text-sm text-gray-500">
                Verileriniz hiçbir koşulda ticari amaçla üçüncü taraflara satılmaz.
              </p>
            </section>

            {/* 5 — Saklama Süreleri */}
            <section className="mb-10">
              <SectionTitle>5. Kişisel Veri Saklama Süreleri</SectionTitle>
              <p className="text-gray-600 leading-relaxed mb-4">
                Verileriniz yalnızca işlenme amacının gerektirdiği süre boyunca saklanır. Amaç ortadan
                kalktığında veya yasal saklama süresi dolduğunda veriler silinir, yok edilir veya
                anonim hale getirilir. Belirlenen süreler aşağıdaki tabloda listelenmiştir:
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-gray-600 border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left px-3 py-2 border border-gray-200 font-semibold">Veri Türü</th>
                      <th className="text-left px-3 py-2 border border-gray-200 font-semibold">Saklama Süresi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {RETENTION.map(([type, duration], i) => (
                      <tr key={type} className={i % 2 === 1 ? 'bg-gray-50' : ''}>
                        <td className="px-3 py-2 border border-gray-200">{type}</td>
                        <td className="px-3 py-2 border border-gray-200">{duration}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* 6 — Haklar */}
            <section className="mb-10">
              <SectionTitle>6. Veri Sahibinin Hakları (KVKK Madde 11)</SectionTitle>
              <p className="text-gray-600 leading-relaxed mb-4">
                KVKK'nın 11. maddesi uyarınca kişisel verilerinize ilişkin aşağıdaki haklara sahipsiniz.
                Bu haklarınızı kullanmak için 7. bölümdeki başvuru yöntemini izleyiniz.
              </p>
              <div className="space-y-3">
                {RIGHTS.map((right, i) => (
                  <div key={right.title} className="flex gap-4 bg-gray-50 rounded-xl p-4">
                    <span className="w-7 h-7 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{right.title}</p>
                      <p className="text-sm text-gray-500 mt-0.5">{right.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                Haklarınızı kullanmak için kimliğinizi doğrulayan belgeyi (T.C. kimlik fotokopisi vb.)
                başvurunuza eklemeniz gerekmektedir. Kimliği doğrulanamayan başvurular yanıtsız bırakılabilir.
              </div>
            </section>

            {/* 7 — Başvuru Yöntemi */}
            <section className="mb-10">
              <SectionTitle>7. Başvuru Yöntemi ve Yanıt Süresi</SectionTitle>
              <p className="text-gray-600 leading-relaxed mb-4">
                KVKK kapsamındaki haklarınızı kullanmak için aşağıdaki kanallardan herhangi birini
                tercih edebilirsiniz:
              </p>
              <div className="space-y-3">
                {[
                  {
                    channel: 'E-posta',
                    detail: SITE_CONFIG.email,
                    note: 'Kayıtlı e-posta adresinizden gönderilmelidir. Güvenli e-imza veya mobil imza ile imzalanmış başvurular da kabul edilir.',
                    href: `mailto:${SITE_CONFIG.email}`,
                    color: 'bg-emerald-50 border-emerald-200',
                  },
                  {
                    channel: 'KEP (Kayıtlı Elektronik Posta)',
                    detail: 'modulerpazar@hs01.kep.tr',
                    note: 'Hukuki geçerliliği olan resmi kanalımızdır.',
                    href: undefined,
                    color: 'bg-blue-50 border-blue-200',
                  },
                  {
                    channel: 'Yazılı / Posta',
                    detail: SITE_CONFIG.address,
                    note: '"Kişisel Veri Sahibi Başvurusu" ibaresiyle ıslak imzalı dilekçe ile. Kimlik fotokopisi eklenmelidir.',
                    href: undefined,
                    color: 'bg-gray-50 border-gray-200',
                  },
                ].map((item) => (
                  <div key={item.channel} className={`border rounded-xl p-4 text-sm ${item.color}`}>
                    <p className="font-semibold text-gray-800 mb-1">{item.channel}</p>
                    {item.href
                      ? <a href={item.href} className="text-emerald-600 hover:underline">{item.detail}</a>
                      : <p className="text-gray-700">{item.detail}</p>
                    }
                    <p className="text-gray-500 text-xs mt-1">{item.note}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 bg-gray-50 rounded-xl p-4 text-sm text-gray-600">
                <p className="font-semibold mb-1">Yanıt Süresi</p>
                <p>Başvurunuz en geç <strong>30 (otuz) gün</strong> içinde sonuçlandırılır. Talebin karmaşıklığına
                göre bu süre bir defaya mahsus 30 gün uzatılabilir; uzatma gerekçesiyle birlikte tarafınıza
                bildirilir.</p>
                <p className="mt-2 text-xs text-gray-400">
                  Başvurunun sonuçlandırılması kural olarak ücretsizdir. Yanıtın 10 sayfayı aşan çıktı
                  gerektirmesi halinde KVKK Kurulu tarifesiyle ücret alınabilir.
                </p>
              </div>
            </section>

            {/* 8 — Çerez Politikası */}
            <section className="mb-10">
              <SectionTitle>8. Çerez (Cookie) Politikası Özeti</SectionTitle>
              <p className="text-gray-600 leading-relaxed mb-4">
                Platformumuz zorunlu, analitik ve pazarlama çerezleri kullanmaktadır. Zorunlu çerezler
                hizmetin işleyişi için gereklidir; diğerleri yalnızca onayınız dahilinde etkinleştirilir.
              </p>
              <div className="grid sm:grid-cols-3 gap-3 mb-4">
                {[
                  { name: 'Zorunlu', color: 'bg-gray-100 text-gray-700', desc: 'Her zaman aktif. Oturum ve güvenlik yönetimi.' },
                  { name: 'Analitik', color: 'bg-blue-100 text-blue-700', desc: 'Onayınıza bağlı. Ziyaretçi istatistikleri.' },
                  { name: 'Pazarlama', color: 'bg-amber-100 text-amber-700', desc: 'Onayınıza bağlı. Kişiselleştirilmiş reklamlar.' },
                ].map((c) => (
                  <div key={c.name} className="bg-gray-50 rounded-xl p-3 text-sm">
                    <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium mb-2 ${c.color}`}>{c.name}</span>
                    <p className="text-gray-600">{c.desc}</p>
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-500">
                Çerez tercihlerinizi istediğiniz zaman tarayıcı ayarlarınızdan veya platformumuzdaki tercih
                panelinden değiştirebilirsiniz. Detaylı bilgi için{' '}
                <Link to={LEGAL_LINKS.cerez} className="text-emerald-600 hover:underline">Çerez Politikası</Link>'mızı
                inceleyiniz.
              </p>
            </section>

            {/* 9 — Güvenlik Tedbirleri */}
            <section className="mb-10">
              <SectionTitle>9. Güvenlik Tedbirleri</SectionTitle>
              <p className="text-gray-600 leading-relaxed mb-4">
                KVKK'nın 12. maddesi uyarınca kişisel verilerinizin hukuka aykırı işlenmesini ve
                yetkisiz erişimi önlemek amacıyla aşağıdaki teknik ve idari tedbirler alınmaktadır:
              </p>

              <h3 className="font-semibold text-gray-700 mb-2">Teknik Tedbirler</h3>
              <BulletList items={SECURITY_TECHNICAL} />

              <h3 className="font-semibold text-gray-700 mb-2 mt-5">İdari Tedbirler</h3>
              <BulletList items={SECURITY_ADMINISTRATIVE} />
            </section>

            {/* 10 — Değişiklik Bildirimi */}
            <section className="mb-8">
              <SectionTitle>10. Aydınlatma Metnindeki Değişiklikler</SectionTitle>
              <p className="text-gray-600 leading-relaxed mb-3">
                Bu Aydınlatma Metni, yasal değişiklikler, yeni hizmetler veya Kurul kararları
                doğrultusunda güncellenebilir. Değişiklikler şu şekilde duyurulur:
              </p>
              <BulletList items={[
                'Platform anasayfasında "Son Güncelleme" tarihi revize edilir.',
                'Önemli değişiklikler kayıtlı e-posta adresinize bildirilir.',
                'Değişiklik sonrası platforma girişiniz, güncel metni kabul ettiğiniz anlamına gelir.',
              ]} />
              <p className="mt-3 text-sm text-gray-500">
                Arşivlenmiş önceki versiyonlara e-posta aracılığıyla talep edebilirsiniz.
              </p>
            </section>

            <p className="text-xs text-gray-400 border-t border-gray-100 pt-6">
              Bu metin 6698 sayılı Kişisel Verilerin Korunması Kanunu, Aydınlatma Yükümlülüğünün
              Yerine Getirilmesinde Uyulacak Usul ve Esaslar Hakkında Tebliğ ile AB Genel Veri Koruma
              Tüzüğü (GDPR) ilkeleri gözetilerek hazırlanmıştır.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
