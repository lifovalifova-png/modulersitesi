import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { SITE_CONFIG } from '../config/site';

export default function KullanimKosullariPage() {
  return (
    <div className="flex flex-col min-h-screen">
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
            <p className="text-sm text-gray-500 mb-8">Son güncelleme: Ocak 2025</p>

            <p className="text-gray-600 leading-relaxed mb-8">
              <strong>{SITE_CONFIG.name}</strong> platformunu kullanmadan önce lütfen bu Kullanım Koşulları'nı
              dikkatlice okuyunuz. Platforma erişerek veya platforma üye olarak bu koşulları kabul etmiş
              sayılırsınız.
            </p>

            {/* 1 — Platform Rolü */}
            <section className="mb-8">
              <h2 className="text-lg font-bold text-gray-800 mb-3 pb-2 border-b border-gray-100">
                1. Platformun Rolü ve Sorumluluğu
              </h2>
              <p className="text-gray-600 leading-relaxed mb-3">
                {SITE_CONFIG.name}, alıcılar ile modüler yapı sektöründeki üreticiler/satıcılar arasında
                aracılık hizmeti sunan elektronik bir ticaret platformudur. Platform;
              </p>
              <ul className="space-y-2 text-gray-600 mb-4">
                {[
                  'Taraflar arasındaki sözleşmenin doğrudan tarafı değildir.',
                  'İlan içeriklerinin doğruluğunu garanti etmez; içerikler ilgili firmaya aittir.',
                  'Firmalar arasında gerçekleşen ticari anlaşmazlıklardan sorumlu tutulamaz.',
                  'Platform üzerinden yalnızca teklif talebi iletilir; ödeme platformdan bağımsız yapılır.',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                Platform, 6563 sayılı Elektronik Ticaretin Düzenlenmesi Hakkında Kanun kapsamında
                aracı hizmet sağlayıcı konumundadır.
              </div>
            </section>

            {/* 2 — Üyelik */}
            <section className="mb-8">
              <h2 className="text-lg font-bold text-gray-800 mb-3 pb-2 border-b border-gray-100">
                2. Üyelik ve Hesap
              </h2>
              <div className="space-y-4">
                {[
                  {
                    title: 'Bireysel Kullanıcılar',
                    desc: 'Platforma kayıt olmak için 18 yaşını doldurmuş olmak gereklidir. Teklif talebi göndermek için kayıt zorunlu değildir; ancak işlem geçmişi ve bildirimler için hesap açılması önerilir.',
                  },
                  {
                    title: 'Firmalar / Satıcılar',
                    desc: 'İlan verebilmek için geçerli ticaret sicil kaydı ve kimlik doğrulaması zorunludur. Onay süreci tamamlanmadan ilanlar yayımlanmaz.',
                  },
                  {
                    title: 'Hesap Güvenliği',
                    desc: 'Hesabınızın güvenliğinden siz sorumlusunuz. Şifrenizi kimseyle paylaşmayınız; yetkisiz erişimi derhal bildirin.',
                  },
                ].map((block) => (
                  <div key={block.title} className="bg-gray-50 rounded-xl p-4">
                    <h3 className="font-semibold text-gray-800 mb-1">{block.title}</h3>
                    <p className="text-sm text-gray-600">{block.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* 3 — İlan Kuralları */}
            <section className="mb-8">
              <h2 className="text-lg font-bold text-gray-800 mb-3 pb-2 border-b border-gray-100">
                3. İlan Verme Kuralları
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Platform üzerinden ilan veren firmalar aşağıdaki kurallara uymakla yükümlüdür:
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-gray-600 border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left px-4 py-2 border border-gray-200 font-semibold">Kural</th>
                      <th className="text-left px-4 py-2 border border-gray-200 font-semibold">Açıklama</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['Doğru Bilgi', 'Fiyat, boyut, malzeme ve özellikler eksiksiz ve doğru belirtilmelidir.'],
                      ['Özgün İçerik', 'İlan görselleri ve açıklamaları başkasına ait materyallerden izinsiz alınamaz.'],
                      ['Yasal Uyumluluk', 'Satışa sunulan ürünler Türk hukukuna uygun olmalı; lisans/izin gerektiren ürünler için gerekli belgeler sağlanmalıdır.'],
                      ['Stok Takibi', 'Stokta olmayan ürünlerin ilanı en geç 24 saat içinde güncellenmeli veya kaldırılmalıdır.'],
                      ['Tekil İlan', 'Aynı ürün için birden fazla aktif ilan oluşturmak yasaktır.'],
                    ].map(([rule, desc]) => (
                      <tr key={rule}>
                        <td className="px-4 py-2 border border-gray-200 font-medium whitespace-nowrap">{rule}</td>
                        <td className="px-4 py-2 border border-gray-200">{desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-4 text-sm text-gray-500">
                Bu kurallara aykırı ilanlar uyarı yapılmaksızın kaldırılabilir; tekrarlı ihlallerde hesap
                askıya alınabilir veya kalıcı olarak kapatılabilir.
              </p>
            </section>

            {/* 4 — Yasak İçerikler */}
            <section className="mb-8">
              <h2 className="text-lg font-bold text-gray-800 mb-3 pb-2 border-b border-gray-100">
                4. Yasak İçerik ve Davranışlar
              </h2>
              <p className="text-gray-600 leading-relaxed mb-3">
                Aşağıdaki durumlarda platform kullanım hakkı derhal sona erer:
              </p>
              <ul className="space-y-2 text-gray-600">
                {[
                  'Sahte firma veya kimlik bilgisiyle kayıt olmak',
                  'Platform altyapısına zarar vermeye yönelik girişimler (DDoS, scraping, vb.)',
                  'Diğer kullanıcılara yönelik taciz, hakaret veya tehdit',
                  'Platformu dolaşarak doğrudan ticaret yapılmasını teşvik etmek',
                  'Sahte yorum veya değerlendirme oluşturmak',
                  'Üçüncü şahıslara ait kişisel verileri izinsiz paylaşmak',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            {/* 5 — Ücretlendirme */}
            <section className="mb-8">
              <h2 className="text-lg font-bold text-gray-800 mb-3 pb-2 border-b border-gray-100">
                5. Ücretlendirme
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  {
                    title: 'Alıcılar için',
                    badge: 'Ücretsiz',
                    badgeColor: 'bg-emerald-100 text-emerald-700',
                    items: ['İlan görüntüleme', 'Teklif talebi gönderme', 'Firma profili inceleme'],
                  },
                  {
                    title: 'Satıcılar için',
                    badge: 'Freemium',
                    badgeColor: 'bg-blue-100 text-blue-700',
                    items: ['İlk 3 ilan ücretsiz', 'Öne çıkarma paketi ücretlidir', 'Premium üyelik ek özellikler sunar'],
                  },
                ].map((plan) => (
                  <div key={plan.title} className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <h3 className="font-semibold text-gray-800">{plan.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${plan.badgeColor}`}>
                        {plan.badge}
                      </span>
                    </div>
                    <ul className="space-y-1.5">
                      {plan.items.map((item) => (
                        <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm text-gray-500">
                Ücret tarifesi önceden bildirim yapılarak değiştirilebilir. Mevcut abonelikler, dönem sonuna
                kadar eski tarife üzerinden devam eder.
              </p>
            </section>

            {/* 6 — Sorumluluk Reddi */}
            <section className="mb-8">
              <h2 className="text-lg font-bold text-gray-800 mb-3 pb-2 border-b border-gray-100">
                6. Sorumluluk Reddi
              </h2>
              <p className="text-gray-600 leading-relaxed mb-3">
                Platform; ilan içeriklerinin doğruluğu, ürün kalitesi veya taraflar arasındaki sözleşmesel
                yükümlülüklerin yerine getirilmesinden sorumlu değildir. Özellikle:
              </p>
              <ul className="space-y-2 text-gray-600">
                {[
                  'Firma tarafından verilen yanıltıcı bilgilerden doğan zararlar',
                  'Teslimat gecikmeleri veya ürün kusurları',
                  'Alıcı–satıcı arasındaki ödeme anlaşmazlıkları',
                  'Teknik arızalar veya geçici erişim kesintileri nedeniyle oluşan dolaylı zararlar',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-gray-600 leading-relaxed">
                Anlaşmazlık durumunda tarafların önce doğrudan çözüm arayışında bulunması önerilir.
                Platform, arabuluculuk hizmeti sunmamaktadır.
              </p>
            </section>

            {/* 7 — Fikri Mülkiyet */}
            <section className="mb-8">
              <h2 className="text-lg font-bold text-gray-800 mb-3 pb-2 border-b border-gray-100">
                7. Fikri Mülkiyet
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Platform tasarımı, yazılımı, logosu ve içerikleri <strong>{SITE_CONFIG.name}</strong>'a aittir ve
                fikri mülkiyet hukukuyla korunmaktadır. Kullanıcılar platform aracılığıyla paylaştıkları
                içerikler için platform'a dünya genelinde, telifsiz, alt lisans verilebilir bir kullanım
                lisansı tanır. Bu lisans; içeriğin platform üzerinde gösterilmesi, depolanması ve
                iletilmesiyle sınırlıdır.
              </p>
            </section>

            {/* 8 — Değişiklikler */}
            <section className="mb-8">
              <h2 className="text-lg font-bold text-gray-800 mb-3 pb-2 border-b border-gray-100">
                8. Koşullardaki Değişiklikler
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Platform bu koşulları önceden bildirerek güncelleme hakkını saklı tutar. Önemli değişiklikler
                kayıtlı e-posta adresinize bildirilir. Değişiklik sonrası platforma erişiminizi sürdürmeniz,
                güncel koşulları kabul ettiğiniz anlamına gelir.
              </p>
            </section>

            {/* 9 — Uygulanacak Hukuk */}
            <section className="mb-8">
              <h2 className="text-lg font-bold text-gray-800 mb-3 pb-2 border-b border-gray-100">
                9. Uygulanacak Hukuk ve Yetki
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Bu Kullanım Koşulları Türk hukukuna tabidir. Doğabilecek uyuşmazlıklarda İstanbul
                (Çağlayan) Mahkemeleri ve İcra Müdürlükleri yetkilidir.
              </p>
            </section>

            {/* 10 — İletişim */}
            <section className="mb-8">
              <h2 className="text-lg font-bold text-gray-800 mb-3 pb-2 border-b border-gray-100">
                10. İletişim
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Kullanım koşullarına ilişkin sorularınız için:
              </p>
              <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-gray-600 space-y-1">
                <p><strong>E-posta:</strong> <a href={`mailto:${SITE_CONFIG.email}`} className="text-emerald-600 hover:underline">{SITE_CONFIG.email}</a></p>
                <p><strong>Adres:</strong> {SITE_CONFIG.address}</p>
                <p><strong>Telefon:</strong> <a href={`tel:${SITE_CONFIG.phone.replace(/\s/g, '')}`} className="text-emerald-600 hover:underline">{SITE_CONFIG.phone}</a></p>
              </div>
            </section>

            <p className="text-xs text-gray-400 border-t border-gray-100 pt-6">
              Bu koşullar 6098 sayılı Türk Borçlar Kanunu, 6563 sayılı Elektronik Ticaretin Düzenlenmesi
              Hakkında Kanun ve ilgili mevzuat çerçevesinde hazırlanmıştır.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
