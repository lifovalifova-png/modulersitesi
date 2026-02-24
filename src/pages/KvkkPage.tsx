import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { SITE_CONFIG } from '../config/site';

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

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12 prose prose-gray max-w-none">

            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              Kişisel Verilerin Korunması Kanunu (KVKK) Aydınlatma Metni
            </h1>
            <p className="text-sm text-gray-500 mb-8">Son güncelleme: Ocak 2025</p>

            {/* 1 */}
            <section className="mb-8">
              <h2 className="text-lg font-bold text-gray-800 mb-3 pb-2 border-b border-gray-100">
                1. Veri Sorumlusu
              </h2>
              <p className="text-gray-600 leading-relaxed">
                6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında veri sorumlusu sıfatıyla
                <strong> {SITE_CONFIG.name}</strong> ("Platform") olarak aşağıda belirtilen kişisel verilerinizi,
                işbu Aydınlatma Metni'nde açıklanan amaç ve yöntemlerle işlemekteyiz.
              </p>
              <div className="mt-4 bg-gray-50 rounded-xl p-4 text-sm text-gray-600 space-y-1">
                <p><strong>Ticaret Unvanı:</strong> {SITE_CONFIG.name}</p>
                <p><strong>Adres:</strong> {SITE_CONFIG.address}</p>
                <p><strong>E-posta:</strong> {SITE_CONFIG.email}</p>
                <p><strong>Telefon:</strong> {SITE_CONFIG.phone}</p>
              </div>
            </section>

            {/* 2 */}
            <section className="mb-8">
              <h2 className="text-lg font-bold text-gray-800 mb-3 pb-2 border-b border-gray-100">
                2. Toplanan Kişisel Veriler ve Yöntemleri
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Platformumuz üzerinden aşağıdaki kişisel veriler otomatik ve otomatik olmayan yollarla
                toplanmaktadır:
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-gray-600 border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left px-4 py-2 border border-gray-200 font-semibold">Veri Kategorisi</th>
                      <th className="text-left px-4 py-2 border border-gray-200 font-semibold">Örnekler</th>
                      <th className="text-left px-4 py-2 border border-gray-200 font-semibold">Toplama Yöntemi</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="px-4 py-2 border border-gray-200">Kimlik</td>
                      <td className="px-4 py-2 border border-gray-200">Ad, soyad</td>
                      <td className="px-4 py-2 border border-gray-200">Form doldurma</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-4 py-2 border border-gray-200">İletişim</td>
                      <td className="px-4 py-2 border border-gray-200">E-posta, telefon numarası</td>
                      <td className="px-4 py-2 border border-gray-200">Form doldurma</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 border border-gray-200">Firma Bilgisi</td>
                      <td className="px-4 py-2 border border-gray-200">Ticaret unvanı, vergi no, adres</td>
                      <td className="px-4 py-2 border border-gray-200">İlan formu</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-4 py-2 border border-gray-200">İşlem</td>
                      <td className="px-4 py-2 border border-gray-200">Teklif talepleri, mesajlar</td>
                      <td className="px-4 py-2 border border-gray-200">Platform kullanımı</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 border border-gray-200">Teknik</td>
                      <td className="px-4 py-2 border border-gray-200">IP adresi, tarayıcı türü, çerez verileri</td>
                      <td className="px-4 py-2 border border-gray-200">Otomatik (çerezler)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* 3 */}
            <section className="mb-8">
              <h2 className="text-lg font-bold text-gray-800 mb-3 pb-2 border-b border-gray-100">
                3. Kişisel Verilerin İşlenme Amaçları
              </h2>
              <p className="text-gray-600 leading-relaxed mb-3">
                Kişisel verileriniz KVKK'nın 5. ve 6. maddeleri kapsamında aşağıdaki amaçlarla işlenmektedir:
              </p>
              <ul className="space-y-2 text-gray-600">
                {[
                  'Platform üzerinden teklif talebi ve ilan hizmetlerinin sunulması',
                  'Alıcı ile satıcı arasındaki iletişimin sağlanması',
                  'Firma doğrulama ve güvenilirlik süreçlerinin yürütülmesi',
                  'Yasal yükümlülüklerin yerine getirilmesi (vergi, ticaret mevzuatı)',
                  'Platform güvenliğinin ve bütünlüğünün korunması',
                  'İstatistiksel analiz ve platform iyileştirme çalışmaları',
                  'Açık rızanız dahilinde pazarlama ve kampanya bildirimleri',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            {/* 4 */}
            <section className="mb-8">
              <h2 className="text-lg font-bold text-gray-800 mb-3 pb-2 border-b border-gray-100">
                4. Kişisel Verilerin Aktarıldığı Taraflar
              </h2>
              <p className="text-gray-600 leading-relaxed mb-3">
                Kişisel verileriniz KVKK'nın 8. maddesi uyarınca aşağıdaki taraflarla ve yalnızca belirtilen
                amaçlarla paylaşılabilir:
              </p>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                  <span><strong>Platform üyeleri (firmalar):</strong> Teklif talebinizin iletilmesi için seçtiğiniz firmalarla paylaşılır.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                  <span><strong>Hizmet sağlayıcılar:</strong> Barındırma, e-posta altyapısı, ödeme sistemleri gibi teknik hizmet sağlayıcılar (veri işleyen sıfatıyla).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                  <span><strong>Yetkili kurumlar:</strong> Yasal zorunluluk kapsamında mahkemeler ve düzenleyici kurumlar.</span>
                </li>
              </ul>
              <p className="mt-3 text-gray-600 text-sm">
                Verileriniz üçüncü taraflara ticari amaçla satılmaz.
              </p>
            </section>

            {/* 5 */}
            <section className="mb-8">
              <h2 className="text-lg font-bold text-gray-800 mb-3 pb-2 border-b border-gray-100">
                5. Veri Saklama Süreleri
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-gray-600 border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left px-4 py-2 border border-gray-200 font-semibold">Veri Türü</th>
                      <th className="text-left px-4 py-2 border border-gray-200 font-semibold">Saklama Süresi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['İlan ve teklif verileri', 'Hesap silme tarihinden itibaren 3 yıl'],
                      ['İletişim ve mesaj kayıtları', '2 yıl'],
                      ['Fatura ve ticari kayıtlar', '10 yıl (Türk Ticaret Kanunu)'],
                      ['Teknik log kayıtları', '1 yıl'],
                      ['Pazarlama onay kayıtları', 'Onayın geri alınmasına kadar'],
                    ].map(([type, duration]) => (
                      <tr key={type}>
                        <td className="px-4 py-2 border border-gray-200">{type}</td>
                        <td className="px-4 py-2 border border-gray-200">{duration}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* 6 */}
            <section className="mb-8">
              <h2 className="text-lg font-bold text-gray-800 mb-3 pb-2 border-b border-gray-100">
                6. Veri Sahibinin Hakları (KVKK Madde 11)
              </h2>
              <p className="text-gray-600 leading-relaxed mb-3">
                KVKK'nın 11. maddesi uyarınca kişisel verilerinize ilişkin aşağıdaki haklara sahipsiniz:
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  ['Bilgi edinme', 'Kişisel verilerinizin işlenip işlenmediğini öğrenme'],
                  ['Bilgi talep etme', 'İşlenen veriler hakkında bilgi isteme'],
                  ['Amaç sorgulama', 'İşlenme amacını ve amaca uygunluğu sorgulama'],
                  ['Aktarım bilgisi', "Verilerin aktarıldığı üçüncü kişileri öğrenme"],
                  ['Düzeltme', 'Eksik veya yanlış verilerin düzeltilmesini isteme'],
                  ['Silme/yok etme', 'Koşulların oluşması halinde silinmesini talep etme'],
                  ['İtiraz', 'Otomatik sistemlerle analiz sonuçlarına itiraz etme'],
                  ['Tazminat', 'Zarara uğramanız halinde tazminat talep etme'],
                ].map(([title, desc]) => (
                  <div key={title} className="bg-gray-50 rounded-lg p-3">
                    <p className="font-semibold text-gray-700 text-sm">{title}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* 7 */}
            <section className="mb-8">
              <h2 className="text-lg font-bold text-gray-800 mb-3 pb-2 border-b border-gray-100">
                7. Başvuru Yöntemi
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Yukarıda belirtilen haklarınızı kullanmak için kimliğinizi doğrulayan belgelerle birlikte aşağıdaki
                kanallardan bize ulaşabilirsiniz:
              </p>
              <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-gray-600 space-y-1">
                <p><strong>E-posta:</strong> <a href={`mailto:${SITE_CONFIG.email}`} className="text-emerald-600 hover:underline">{SITE_CONFIG.email}</a></p>
                <p><strong>Posta:</strong> {SITE_CONFIG.address}</p>
                <p className="text-gray-500 text-xs mt-2">
                  Başvurularınız en geç 30 gün içinde sonuçlandırılır. Talebin niteliğine göre ücret alınabilir.
                </p>
              </div>
            </section>

            <p className="text-xs text-gray-400 border-t border-gray-100 pt-6">
              Bu metin, 6698 sayılı Kişisel Verilerin Korunması Kanunu ve ilgili ikincil mevzuat çerçevesinde hazırlanmıştır.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
