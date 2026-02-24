import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { SITE_CONFIG, LEGAL_LINKS } from '../config/site';

export default function GizlilikPage() {
  return (
    <div className="flex flex-col min-h-screen">
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
            <p className="text-sm text-gray-500 mb-8">Son güncelleme: Ocak 2025</p>

            <p className="text-gray-600 leading-relaxed mb-8">
              Bu Gizlilik Politikası, <strong>{SITE_CONFIG.name}</strong> platformunun
              kullanıcı verilerini nasıl topladığını, işlediğini ve koruduğunu açıklamaktadır.
              Kişisel verilerinizin işlenmesine ilişkin detaylı bilgi için
              {' '}<Link to={LEGAL_LINKS.kvkk} className="text-emerald-600 hover:underline">KVKK Aydınlatma Metni</Link>'ni
              incelemenizi tavsiye ederiz.
            </p>

            {/* 1 — Çerezler */}
            <section className="mb-8">
              <h2 className="text-lg font-bold text-gray-800 mb-3 pb-2 border-b border-gray-100">
                1. Çerezler (Cookies)
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Platformumuz, hizmet kalitesini artırmak için çerez teknolojisinden yararlanmaktadır.
                Çerezler, tarayıcınıza yerleştirilen küçük metin dosyalarıdır.
              </p>
              <div className="space-y-4">
                {[
                  {
                    title: 'Zorunlu Çerezler',
                    badge: 'Her zaman aktif',
                    badgeColor: 'bg-gray-200 text-gray-700',
                    desc: 'Platform\'un temel işlevselliği için zorunludur. Oturum yönetimi, güvenlik ve tercih kayıtlarını kapsar. Bu çerezler devre dışı bırakılamaz.',
                    examples: ['session_id', 'csrf_token', 'lang_pref'],
                  },
                  {
                    title: 'Analitik Çerezler',
                    badge: 'Onayınıza bağlı',
                    badgeColor: 'bg-blue-100 text-blue-700',
                    desc: 'Platformun nasıl kullanıldığını anlamak için kullanılır. Ziyaretçi sayısı, en çok görüntülenen sayfalar ve kullanıcı davranışı gibi istatistiksel verileri toplar.',
                    examples: ['Google Analytics (_ga, _gid)', 'Hotjar'],
                  },
                  {
                    title: 'Pazarlama Çerezleri',
                    badge: 'Onayınıza bağlı',
                    badgeColor: 'bg-amber-100 text-amber-700',
                    desc: 'İlgilendiğiniz içeriklere göre kişiselleştirilmiş reklamlar sunmak için kullanılır. Bu çerezler reklam platformlarıyla paylaşılabilir.',
                    examples: ['Google Ads', 'Meta Pixel'],
                  },
                ].map((cookie) => (
                  <div key={cookie.title} className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-800">{cookie.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cookie.badgeColor}`}>
                        {cookie.badge}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{cookie.desc}</p>
                    <p className="text-xs text-gray-400">
                      Örnekler: {cookie.examples.join(', ')}
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm text-gray-500">
                Çerez tercihlerinizi tarayıcı ayarlarınızdan veya platformumuzdaki çerez tercih panelinden
                yönetebilirsiniz. Zorunlu çerezlerin engellenmesi platform işlevselliğini olumsuz etkileyebilir.
              </p>
            </section>

            {/* 2 — Üçüncü Taraf Servisler */}
            <section className="mb-8">
              <h2 className="text-lg font-bold text-gray-800 mb-3 pb-2 border-b border-gray-100">
                2. Üçüncü Taraf Servisler
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Platform, aşağıdaki üçüncü taraf hizmet sağlayıcılardan yararlanmaktadır.
                Her sağlayıcının kendi gizlilik politikası geçerlidir:
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-gray-600 border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left px-4 py-2 border border-gray-200 font-semibold">Sağlayıcı</th>
                      <th className="text-left px-4 py-2 border border-gray-200 font-semibold">Amaç</th>
                      <th className="text-left px-4 py-2 border border-gray-200 font-semibold">Aktarılan Veri</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['Google Analytics', 'Trafik analizi', 'Anonim kullanım verisi'],
                      ['Cloudflare', 'CDN ve güvenlik', 'IP adresi, teknik log'],
                      ['SMTP sağlayıcı', 'E-posta gönderimi', 'E-posta adresi'],
                      ['Bulut depolama', 'Görsel barındırma', 'Yüklenen görseller'],
                    ].map(([provider, purpose, data]) => (
                      <tr key={provider}>
                        <td className="px-4 py-2 border border-gray-200 font-medium">{provider}</td>
                        <td className="px-4 py-2 border border-gray-200">{purpose}</td>
                        <td className="px-4 py-2 border border-gray-200">{data}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* 3 — Veri Saklama */}
            <section className="mb-8">
              <h2 className="text-lg font-bold text-gray-800 mb-3 pb-2 border-b border-gray-100">
                3. Veri Saklama Süresi
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Verileriniz yalnızca toplandıkları amaç için gerekli olan süre boyunca saklanır.
                Hesabınızı sildiğinizde kişisel verileriniz en geç 30 gün içinde sistemlerimizden kaldırılır;
                ancak yasal zorunluluk nedeniyle saklanması gereken veriler (örn. ticari kayıtlar) mevzuatta
                belirlenen süreler boyunca tutulmaya devam eder. Detaylı saklama süreleri için
                {' '}<Link to={LEGAL_LINKS.kvkk} className="text-emerald-600 hover:underline">KVKK Aydınlatma Metni</Link>'ni
                inceleyiniz.
              </p>
            </section>

            {/* 4 — Veri Güvenliği */}
            <section className="mb-8">
              <h2 className="text-lg font-bold text-gray-800 mb-3 pb-2 border-b border-gray-100">
                4. Veri Güvenliği
              </h2>
              <p className="text-gray-600 leading-relaxed mb-3">
                Kişisel verilerinizin güvenliğini sağlamak için aşağıdaki teknik ve idari önlemleri almaktayız:
              </p>
              <ul className="space-y-2 text-gray-600">
                {[
                  'TLS/SSL şifrelemesi ile veri iletimi güvence altına alınmaktadır',
                  'Erişim yetkilendirmesi rol tabanlı kontrol sistemiyle yönetilmektedir',
                  'Sistemler düzenli güvenlik denetimine tabi tutulmaktadır',
                  'Veri ihlali durumunda KVKK\'ya ve etkilenen kişilere bildirim yapılmaktadır',
                  'Çalışanlar KVKK uyumu konusunda düzenli eğitim almaktadır',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            {/* 5 — Çocukların Gizliliği */}
            <section className="mb-8">
              <h2 className="text-lg font-bold text-gray-800 mb-3 pb-2 border-b border-gray-100">
                5. 18 Yaş Altı Kullanıcılar
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Platformumuz 18 yaş ve üzeri bireylere yönelik olup bilerek 18 yaş altındaki bireylerden
                kişisel veri toplamamaktayız. Böyle bir durumun farkına varırsak söz konusu verileri
                derhal sileriz.
              </p>
            </section>

            {/* 6 — İletişim */}
            <section className="mb-8">
              <h2 className="text-lg font-bold text-gray-800 mb-3 pb-2 border-b border-gray-100">
                6. İletişim
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Gizlilik politikamıza ilişkin sorularınız için:
              </p>
              <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-gray-600 space-y-1">
                <p><strong>E-posta:</strong> <a href={`mailto:${SITE_CONFIG.email}`} className="text-emerald-600 hover:underline">{SITE_CONFIG.email}</a></p>
                <p><strong>Adres:</strong> {SITE_CONFIG.address}</p>
              </div>
            </section>

            <p className="text-xs text-gray-400 border-t border-gray-100 pt-6">
              Bu politika 6698 sayılı KVKK ve AB Genel Veri Koruma Tüzüğü (GDPR) ilkeleri gözetilerek hazırlanmıştır.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
