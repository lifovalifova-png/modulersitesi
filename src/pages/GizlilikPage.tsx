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

/* ─── Çerez verileri ──────────────────────────────────────── */
const COOKIES = [
  {
    title: 'Zorunlu Çerezler',
    badge: 'Her zaman aktif',
    badgeColor: 'bg-gray-200 text-gray-700',
    desc: 'Platformun temel işlevselliği, oturum yönetimi, güvenlik ve tercih kayıtları için zorunludur. Devre dışı bırakılamaz.',
    examples: ['session_id', 'csrf_token', 'lang_pref', 'cookie_consent'],
    retention: 'Oturum sonunda / 1 yıl',
  },
  {
    title: 'Performans / Analitik Çerezler',
    badge: 'Onayınıza bağlı',
    badgeColor: 'bg-blue-100 text-blue-700',
    desc: 'Platformun nasıl kullanıldığını anlamak için ziyaretçi sayısı, en çok görüntülenen sayfalar ve kullanıcı akışı gibi istatistiksel veriler toplanır.',
    examples: ['Google Analytics (_ga, _gid, _gat)', 'Hotjar (_hjSession, _hjSessionUser)'],
    retention: '13 ay',
  },
  {
    title: 'Pazarlama / Hedefleme Çerezleri',
    badge: 'Onayınıza bağlı',
    badgeColor: 'bg-amber-100 text-amber-700',
    desc: 'İlgilendiğiniz içeriklere göre kişiselleştirilmiş reklamlar sunmak ve kampanya etkinliğini ölçmek için kullanılır.',
    examples: ['Google Ads (_gcl_au)', 'Meta Pixel (_fbp, _fbc)', 'LinkedIn Insight'],
    retention: '90 gün — 13 ay',
  },
  {
    title: 'İşlev Çerezleri',
    badge: 'Onayınıza bağlı',
    badgeColor: 'bg-purple-100 text-purple-700',
    desc: 'Dil tercihi, konum filtresi ve erişilebilirlik ayarları gibi kişiselleştirme tercihlerinizi hatırlar.',
    examples: ['locale', 'region_filter', 'theme_pref'],
    retention: '12 ay',
  },
];

/* ─── Üçüncü taraf servisler ──────────────────────────────── */
const THIRD_PARTIES = [
  ['Google Analytics', 'Trafik ve davranış analizi', 'Anonim kullanım verisi, IP (anonimleştirilmiş)', 'ABD', 'SCCs'],
  ['Google Ads', 'Reklam performansı ölçümü', 'Çerez kimliği, dönüşüm verisi', 'ABD', 'SCCs'],
  ['Meta (Facebook)', 'Sosyal medya reklamcılığı', 'Çerez kimliği, sayfa etkinliği', 'ABD', 'SCCs'],
  ['Cloudflare', 'CDN, güvenlik, DDoS koruması', 'IP adresi, teknik log', 'ABD', 'SCCs'],
  ['SMTP sağlayıcı', 'İşlemsel e-posta gönderimi', 'E-posta adresi, ad', 'AB/ABD', 'SCCs'],
  ['Bulut depolama', 'Görsel ve dosya barındırma', 'Yüklenen içerik (görseller)', 'AB', 'Yeterlilik kararı'],
  ['Ödeme sağlayıcı', 'Ödeme işleme (PCI-DSS uyumlu)', 'Fatura bilgisi (kart no saklanmaz)', 'TR/AB', 'Sözleşme'],
];

/* ─── Güvenlik tedbirleri ─────────────────────────────────── */
const TECH_MEASURES = [
  'TLS 1.2/1.3 ile uçtan uca şifreli iletişim',
  'Veritabanı şifrelemesi (AES-256)',
  'Parola depolama: bcrypt/Argon2 (düz metin asla saklanmaz)',
  'İki faktörlü kimlik doğrulama (2FA) desteği',
  'Web Uygulama Güvenlik Duvarı (WAF)',
  'Otomatik güvenlik açığı taraması ve sızma testi (yılda en az 1 kez)',
  'Güvenli API tasarımı ve istek hız sınırlaması (rate limiting)',
];

const ADMIN_MEASURES = [
  'Çalışanlara yönelik periyodik KVKK ve siber güvenlik eğitimi',
  '"Bilinmesi gereken" prensibiyle minimum veri erişimi',
  'Tüm iş ortaklarıyla Veri İşleme Anlaşması (DPA) imzalanmaktadır',
  'Veri ihlali müdahale planı (IRP) ve tatbikatlar',
  'İhlal halinde KVKK Kurulu\'na 72 saat içinde bildirim',
  'Etkilenen veri sahiplerine şeffaf ve zamanında bildirim',
];

/* ─── Bileşen ─────────────────────────────────────────────── */
export default function GizlilikPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <SEOMeta
        title="Gizlilik Politikası — ModülerPazar"
        description="ModülerPazar gizlilik politikası: verilerinizin nasıl toplandığı, kullanıldığı ve korunduğu hakkında bilgi."
        url="/gizlilik"
      />
      <Header />

      <main className="flex-1 bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4">

          {/* Breadcrumb */}
          <nav className="text-sm text-gray-500 mb-6 flex items-center gap-2">
            <Link to="/" className="hover:text-emerald-600 transition">Ana Sayfa</Link>
            <span>/</span>
            <span className="text-gray-800">Gizlilik Politikası</span>
          </nav>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12">

            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              Gizlilik Politikası
            </h1>
            <p className="text-sm text-gray-500 mb-2">Son güncelleme: Ocak 2025 — Versiyon 1.0</p>

            <p className="text-gray-600 leading-relaxed mb-8">
              Bu Gizlilik Politikası, <strong>{SITE_CONFIG.name}</strong> platformunun kullanıcı
              verilerini nasıl topladığını, işlediğini, koruduğunu ve paylaştığını açıklamaktadır.
              Kişisel verilerinizin işlenmesine ilişkin yasal çerçeve için{' '}
              <Link to={LEGAL_LINKS.kvkk} className="text-emerald-600 hover:underline">
                KVKK Aydınlatma Metni
              </Link>'ni incelemenizi tavsiye ederiz.
            </p>

            {/* 1 — Hangi Verileri Topluyoruz */}
            <section className="mb-10">
              <SectionTitle>1. Hangi Verileri Topluyoruz?</SectionTitle>
              <p className="text-gray-600 leading-relaxed mb-4">
                Platformu kullanım şeklinize göre farklı veri kategorileri toplanmaktadır:
              </p>
              <div className="space-y-3">
                {[
                  {
                    icon: '👤',
                    title: 'Hesap ve Kimlik Verileri',
                    items: ['Ad, soyad', 'E-posta adresi ve telefon numarası', 'Firma bilgileri (satıcılar için): ticaret unvanı, vergi no, MERSİS no', 'Kimlik doğrulama için T.C. kimlik no (satıcı onay sürecinde)'],
                  },
                  {
                    icon: '📋',
                    title: 'Platform Kullanım Verileri',
                    items: ['Oluşturduğunuz ilanlar ve içerikleri', 'Gönderdiğiniz teklif talepleri', 'Platform içi mesajlar', 'Favori ve kayıtlı ilanlar'],
                  },
                  {
                    icon: '💳',
                    title: 'Ödeme ve Fatura Verileri',
                    items: ['Fatura ad / unvan ve adresi', 'Vergi kimlik numarası', 'Ödeme tipi (kredi kartı numarası tarafımızca saklanmaz; ödeme sağlayıcı tarafından PCI-DSS uyumlu şekilde işlenir)'],
                  },
                  {
                    icon: '🖥️',
                    title: 'Teknik ve Cihaz Verileri',
                    items: ['IP adresi (anonimleştirilerek saklanır)', 'Tarayıcı türü ve sürümü', 'İşletim sistemi', 'Sayfa gezinme logları ve tıklama verileri', 'Çerez ve yerel depolama verileri'],
                  },
                ].map((group) => (
                  <div key={group.title} className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{group.icon}</span>
                      <h3 className="font-semibold text-gray-800 text-sm">{group.title}</h3>
                    </div>
                    <BulletList items={group.items} />
                  </div>
                ))}
              </div>
            </section>

            {/* 2 — Çerezler */}
            <section className="mb-10">
              <SectionTitle>2. Çerezler (Cookies) ve Takip Teknolojileri</SectionTitle>
              <p className="text-gray-600 leading-relaxed mb-4">
                Çerezler, tarayıcınıza kaydedilen küçük metin dosyalarıdır. Platformumuz dört çerez
                kategorisi kullanmaktadır. İlk ziyaretinizde çerez tercih paneliyle onayınız alınır:
              </p>
              <div className="space-y-4">
                {COOKIES.map((cookie) => (
                  <div key={cookie.title} className="bg-gray-50 rounded-xl p-4">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-800 text-sm">{cookie.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cookie.badgeColor}`}>
                        {cookie.badge}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{cookie.desc}</p>
                    <div className="flex flex-wrap gap-x-4 text-xs text-gray-400">
                      <span><strong>Örnekler:</strong> {cookie.examples.join(', ')}</span>
                      <span><strong>Saklama:</strong> {cookie.retention}</span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm text-gray-500">
                Tercihlerinizi tarayıcı ayarları veya platformumuzun çerez tercih panelinden
                güncelleyebilirsiniz. Detaylar için{' '}
                <Link to={LEGAL_LINKS.cerez} className="text-emerald-600 hover:underline">Çerez Politikası</Link>'mıza
                bakınız.
              </p>
            </section>

            {/* 3 — Üçüncü Taraf Servisler */}
            <section className="mb-10">
              <SectionTitle>3. Üçüncü Taraf Hizmet Sağlayıcılar</SectionTitle>
              <p className="text-gray-600 leading-relaxed mb-4">
                Platformumuz aşağıdaki üçüncü taraf sağlayıcılarla çalışmaktadır. Her sağlayıcı
                kendi gizlilik politikasına tabidir ve kişisel verilerinizi yalnızca belirtilen amaçla
                kullanmakla yükümlüdür:
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-gray-600 border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left px-3 py-2 border border-gray-200 font-semibold">Sağlayıcı</th>
                      <th className="text-left px-3 py-2 border border-gray-200 font-semibold">Amaç</th>
                      <th className="text-left px-3 py-2 border border-gray-200 font-semibold">Aktarılan Veri</th>
                      <th className="text-left px-3 py-2 border border-gray-200 font-semibold">Konum</th>
                      <th className="text-left px-3 py-2 border border-gray-200 font-semibold">Güvence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {THIRD_PARTIES.map(([p, a, d, l, g], i) => (
                      <tr key={p} className={i % 2 === 1 ? 'bg-gray-50' : ''}>
                        <td className="px-3 py-2 border border-gray-200 font-medium whitespace-nowrap">{p}</td>
                        <td className="px-3 py-2 border border-gray-200">{a}</td>
                        <td className="px-3 py-2 border border-gray-200">{d}</td>
                        <td className="px-3 py-2 border border-gray-200 whitespace-nowrap">{l}</td>
                        <td className="px-3 py-2 border border-gray-200 text-xs text-gray-500">{g}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-xs text-gray-400">
                SCCs: Standart Sözleşme Maddeleri. Verileriniz ticari amaçla hiçbir üçüncü tarafa satılmaz.
              </p>
            </section>

            {/* 4 — Veri Saklama */}
            <section className="mb-10">
              <SectionTitle>4. Veri Saklama Süreleri</SectionTitle>
              <p className="text-gray-600 leading-relaxed mb-4">
                Verileriniz yalnızca işlenme amacının gerektirdiği süre boyunca saklanır. Hesabınızı
                silmeniz halinde kişisel verileriniz aşağıdaki tablodaki süreler dahilinde sistemlerimizden
                kaldırılır. Yasal zorunluluk taşıyan veriler mevzuatta belirlenen süreler boyunca tutulmaya
                devam eder:
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
                    {[
                      ['Hesap verileri', 'Silme tarihinden itibaren 30 gün (geri alma süresi); ardından 2 yıl'],
                      ['İlan ve teklif verileri', '3 yıl (ticari kayıt niteliği)'],
                      ['Ödeme ve fatura kayıtları', '10 yıl (Türk Ticaret Kanunu m. 82)'],
                      ['Mesajlaşma geçmişi', '2 yıl'],
                      ['Teknik erişim logları', '1 yıl (5651 sayılı Kanun)'],
                      ['Pazarlama izin kayıtları', 'Geri alımdan sonra 3 yıl (ispat amaçlı)'],
                      ['Analitik çerez verileri', 'En fazla 13 ay'],
                    ].map(([type, dur], i) => (
                      <tr key={type} className={i % 2 === 1 ? 'bg-gray-50' : ''}>
                        <td className="px-3 py-2 border border-gray-200">{type}</td>
                        <td className="px-3 py-2 border border-gray-200">{dur}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* 5 — Veri Güvenliği */}
            <section className="mb-10">
              <SectionTitle>5. Veri Güvenliği Önlemleri</SectionTitle>
              <p className="text-gray-600 leading-relaxed mb-4">
                Kişisel verilerinizin güvenliğini sağlamak için KVKK'nın 12. maddesi kapsamında
                aşağıdaki teknik ve idari önlemler alınmaktadır:
              </p>
              <h3 className="font-semibold text-gray-700 mb-2">Teknik Önlemler</h3>
              <BulletList items={TECH_MEASURES} />
              <h3 className="font-semibold text-gray-700 mb-2 mt-5">İdari Önlemler</h3>
              <BulletList items={ADMIN_MEASURES} />

              <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                <strong>Veri İhlali Bildirimi:</strong> Kişisel verilerinizi etkileyen güvenlik ihlali
                tespit edilmesi halinde KVKK Kurulu'na 72 saat, sizi etkileyen durumlarda ise
                makul sürede tarafınıza bildirim yapılmaktadır.
              </div>
            </section>

            {/* 6 — Çocukların Gizliliği */}
            <section className="mb-10">
              <SectionTitle>6. 18 Yaş Altı Kullanıcılar</SectionTitle>
              <p className="text-gray-600 leading-relaxed">
                Platformumuz 18 yaş ve üzeri bireylere yönelik olup bilerek 18 yaş altındaki
                kullanıcılardan kişisel veri toplamamaktayız. Bir kullanıcının 18 yaş altında olduğunu
                tespit etmemiz halinde hesap derhal askıya alınır ve ilgili veriler en geç 30 gün içinde
                sistemlerimizden kalıcı olarak silinir. Ebeveynler ya da veliler,
                reşit olmayan birine ait hesap tespiti durumunda{' '}
                <a href={`mailto:${SITE_CONFIG.email}`} className="text-emerald-600 hover:underline">
                  {SITE_CONFIG.email}
                </a>{' '}
                adresine başvurabilir.
              </p>
            </section>

            {/* 7 — Haklarınız */}
            <section className="mb-10">
              <SectionTitle>7. Haklarınız ve Başvuru Yöntemi</SectionTitle>
              <p className="text-gray-600 leading-relaxed mb-4">
                KVKK'nın 11. maddesi kapsamında kişisel verilerinize erişim, düzeltme, silme,
                işlemeyi kısıtlama ve itiraz haklarına sahipsiniz. Detaylı açıklamalar için{' '}
                <Link to={LEGAL_LINKS.kvkk} className="text-emerald-600 hover:underline">KVKK Aydınlatma Metni</Link>'ni
                inceleyiniz.
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
                  Başvurularınız en geç 30 gün içinde sonuçlandırılır. Kimlik doğrulama belgesi
                  eklenmesi gereklidir.
                </p>
              </div>
            </section>

            {/* 8 — Politika Değişiklikleri */}
            <section className="mb-8">
              <SectionTitle>8. Politika Güncellemeleri</SectionTitle>
              <p className="text-gray-600 leading-relaxed mb-3">
                Bu politika mevzuat değişiklikleri, yeni ürün özellikleri veya iş ortaklıkları
                nedeniyle güncellenebilir. Değişiklikler şu kanallarla duyurulur:
              </p>
              <BulletList items={[
                'Sayfanın en üstündeki "Son güncelleme" tarihi revize edilir.',
                'Önemli değişiklikler kayıtlı e-posta adresinize bildirilir.',
                'Değişiklik sonrası platforma girişiniz güncel politikayı kabul ettiğiniz anlamına gelir.',
              ]} />
            </section>

            <p className="text-xs text-gray-400 border-t border-gray-100 pt-6">
              Bu politika 6698 sayılı KVKK, 6563 sayılı Elektronik Ticaret Kanunu ve AB Genel Veri
              Koruma Tüzüğü (GDPR) ilkeleri gözetilerek hazırlanmıştır.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
