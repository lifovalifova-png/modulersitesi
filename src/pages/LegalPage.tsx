import { useParams, Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEOMeta from '../components/SEOMeta';
import { SITE_CONFIG, LEGAL_LINKS } from '../config/site';

/* ═══════════════════════════════════════════════════════════
   Yeniden kullanılan küçük bileşenler
═══════════════════════════════════════════════════════════ */

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 ${className}`}>
      {children}
    </div>
  );
}

function SectionTitle({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <span className="w-8 h-8 rounded-full bg-emerald-600 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
        {n}
      </span>
      <h2 className="text-lg font-bold text-gray-800 leading-snug">{children}</h2>
    </div>
  );
}

function Bullets({ items }: { items: (string | React.ReactNode)[] }) {
  return (
    <ul className="space-y-2 text-gray-600 text-sm">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
          <span className="leading-relaxed">{item}</span>
        </li>
      ))}
    </ul>
  );
}

function InfoBox({
  color = 'gray',
  children,
}: {
  color?: 'blue' | 'amber' | 'green' | 'red' | 'gray' | 'purple';
  children: React.ReactNode;
}) {
  const cls: Record<string, string> = {
    blue:   'bg-blue-50 border-blue-200 text-blue-800',
    amber:  'bg-amber-50 border-amber-200 text-amber-800',
    green:  'bg-emerald-50 border-emerald-200 text-emerald-800',
    red:    'bg-red-50 border-red-200 text-red-800',
    gray:   'bg-gray-50 border-gray-200 text-gray-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-800',
  };
  return (
    <div className={`border rounded-xl p-4 text-sm leading-relaxed ${cls[color]}`}>
      {children}
    </div>
  );
}

function Tbl({ head, rows }: {
  head: string[];
  rows: (string | React.ReactNode)[][];
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 mt-3">
      <table className="w-full text-sm text-gray-600 border-collapse">
        <thead>
          <tr className="bg-gray-50">
            {head.map((h) => (
              <th key={h} className="text-left px-4 py-3 border-b border-gray-200 font-semibold text-gray-700 whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={i % 2 === 1 ? 'bg-gray-50' : 'bg-white'}>
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-3 border-b border-gray-100 align-top leading-relaxed">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Badge({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span className={`inline-block text-xs px-2.5 py-0.5 rounded-full font-semibold whitespace-nowrap ${color}`}>
      {children}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════
   Sayfa başlıkları
═══════════════════════════════════════════════════════════ */

const PAGE_TITLES: Record<string, string> = {
  'cerez-politikasi':            'Çerez Politikası',
  'mesafeli-satis-sozlesmesi':   'Mesafeli Satış Sözleşmesi',
};

/* ═══════════════════════════════════════════════════════════
   Çerez Politikası İçeriği
═══════════════════════════════════════════════════════════ */

function CerezPolitikasi() {
  return (
    <div className="space-y-8">
      {/* Üst başlık */}
      <Card>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Çerez Politikası</h2>
        <p className="text-emerald-600 font-medium mb-4">Son güncelleme: Mart 2025 — Versiyon 1.0</p>
        <div className="flex flex-wrap gap-2 mb-6">
          <Badge color="bg-emerald-100 text-emerald-700">KVKK Uyumlu</Badge>
          <Badge color="bg-blue-100 text-blue-700">6698 Sayılı Kanun</Badge>
        </div>
        <p className="text-gray-600 text-sm leading-relaxed">
          Bu Çerez Politikası, <strong>{SITE_CONFIG.name}</strong> platformunun (
          <a href={SITE_CONFIG.url} className="text-emerald-600 underline">{SITE_CONFIG.url}</a>)
          çerez kullanımını açıklamaktadır. Platformumuzu kullanarak bu politikayı kabul etmiş sayılırsınız.
          Kişisel verilerin işlenmesine ilişkin detaylar için{' '}
          <Link to={LEGAL_LINKS.kvkk} className="text-emerald-600 underline">KVKK Aydınlatma Metni</Link>'ni
          ve{' '}
          <Link to={LEGAL_LINKS.gizlilik} className="text-emerald-600 underline">Gizlilik Politikası</Link>'nı
          incelemenizi tavsiye ederiz.
        </p>
      </Card>

      {/* Bölüm 1 — Çerez Nedir? */}
      <Card>
        <SectionTitle n={1}>Çerez (Cookie) Nedir?</SectionTitle>
        <p className="text-gray-600 text-sm leading-relaxed mb-4">
          Çerezler, web sitelerinin tarayıcınıza yerleştirdiği küçük metin dosyalarıdır.
          Oturum bilgilerinizi saklamak, tercihlerinizi hatırlamak ve site performansını
          analiz etmek amacıyla kullanılır. Çerezler kendi başına kişisel veri içermez
          ancak bazı çerezler kişisel verilerle ilişkilendirilebilir.
        </p>
        <InfoBox color="blue">
          <strong>Yasal dayanak:</strong> 6698 sayılı KVKK m. 5/2-f kapsamında veri
          sorumlusunun meşru menfaati ve m. 5/1 kapsamında açık rıza.
        </InfoBox>
      </Card>

      {/* Bölüm 2 — Kullanılan Çerez Türleri */}
      <Card>
        <SectionTitle n={2}>Kullanılan Çerez Türleri</SectionTitle>

        <h3 className="font-semibold text-gray-700 mt-4 mb-3 text-sm border-l-4 border-emerald-400 pl-3">
          a) Zorunlu (Teknik) Çerezler
        </h3>
        <p className="text-gray-600 text-sm leading-relaxed mb-3">
          Platformun temel işlevleri için gereklidir. Bu çerezler olmadan giriş yapma,
          form gönderme gibi işlemler gerçekleştirilemez. Kapatılmaları mümkün değildir.
        </p>
        <Tbl
          head={['Çerez Adı', 'Sağlayıcı', 'Amaç', 'Süre']}
          rows={[
            ['Firebase Auth Token', 'Firebase (Google)', 'Kullanıcı oturum yönetimi ve kimlik doğrulama', 'Oturum süresi'],
            ['__session', 'Firebase', 'Oturum durumu takibi', 'Oturum süresi'],
            ['CSRF Token', SITE_CONFIG.name, 'Form güvenliği (CSRF koruması)', 'Oturum süresi'],
            ['cookie_consent', SITE_CONFIG.name, 'Çerez tercihlerinizin saklanması', '12 ay'],
          ]}
        />

        <h3 className="font-semibold text-gray-700 mt-6 mb-3 text-sm border-l-4 border-emerald-400 pl-3">
          b) Analitik / Performans Çerezleri
        </h3>
        <p className="text-gray-600 text-sm leading-relaxed mb-3">
          Platformun nasıl kullanıldığını anlamamıza yardımcı olur. Ziyaretçi sayısı,
          sayfa görüntülenme ve tıklama verileri anonim olarak toplanır.
          Bu çerezler yalnızca açık rızanızla etkinleştirilir.
        </p>
        <Tbl
          head={['Çerez Adı', 'Sağlayıcı', 'Amaç', 'Süre']}
          rows={[
            ['_ga', 'Google Analytics', 'Benzersiz ziyaretçi tanımlama (anonim)', '2 yıl'],
            ['_ga_*', 'Google Analytics 4', 'Oturum durumu ve etkileşim verileri', '2 yıl'],
            ['_gid', 'Google Analytics', 'Günlük benzersiz ziyaretçi ayrımı', '24 saat'],
            ['_gat', 'Google Analytics', 'İstek hızı sınırlama', '1 dakika'],
          ]}
        />

        <h3 className="font-semibold text-gray-700 mt-6 mb-3 text-sm border-l-4 border-emerald-400 pl-3">
          c) İşlevsel Çerezler
        </h3>
        <p className="text-gray-600 text-sm leading-relaxed mb-3">
          Dil tercihi, tema seçimi gibi kişiselleştirme ayarlarını hatırlar.
        </p>
        <Tbl
          head={['Çerez Adı', 'Sağlayıcı', 'Amaç', 'Süre']}
          rows={[
            ['lang', SITE_CONFIG.name, 'Dil tercihi (TR/EN)', '12 ay'],
            ['theme', SITE_CONFIG.name, 'Arayüz tema tercihi', '12 ay'],
          ]}
        />
      </Card>

      {/* Bölüm 3 — Üçüncü Taraf Hizmetler */}
      <Card>
        <SectionTitle n={3}>Üçüncü Taraf Hizmetleri ve Çerezleri</SectionTitle>
        <p className="text-gray-600 text-sm leading-relaxed mb-4">
          Platformumuz aşağıdaki üçüncü taraf hizmetlerini kullanmaktadır.
          Bu hizmetlerin kendi çerez politikaları bulunmaktadır:
        </p>
        <Bullets items={[
          <><strong>Firebase (Google LLC):</strong> Kimlik doğrulama, veritabanı ve barındırma. <a href="https://firebase.google.com/support/privacy" target="_blank" rel="noopener noreferrer" className="text-emerald-600 underline">Firebase Gizlilik Politikası</a></>,
          <><strong>Google Analytics:</strong> Anonim site kullanım analizi. <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-emerald-600 underline">Google Gizlilik Politikası</a></>,
          <><strong>EmailJS:</strong> E-posta bildirim hizmeti. Çerez kullanmaz, yalnızca API üzerinden çalışır.</>,
        ]} />
        <InfoBox color="amber">
          <strong>Not:</strong> Üçüncü taraf çerezleri ilgili şirketlerin kontrolündedir.
          Detaylı bilgi için yukarıdaki bağlantılardan ilgili gizlilik politikalarını inceleyiniz.
        </InfoBox>
      </Card>

      {/* Bölüm 4 — Çerez Yönetimi */}
      <Card>
        <SectionTitle n={4}>Çerez Tercihlerinizi Yönetme</SectionTitle>
        <p className="text-gray-600 text-sm leading-relaxed mb-4">
          Zorunlu çerezler dışındaki tüm çerezleri aşağıdaki yöntemlerle kontrol edebilirsiniz:
        </p>

        <h3 className="font-semibold text-gray-700 mt-4 mb-3 text-sm border-l-4 border-emerald-400 pl-3">
          a) Tarayıcı Ayarları
        </h3>
        <p className="text-gray-600 text-sm leading-relaxed mb-3">
          Tüm modern tarayıcılar çerezleri yönetmenize olanak tanır.
          Tarayıcınızın ayarlar menüsünden çerezleri silebilir, engelleyebilir
          veya yeni çerez oluşturulduğunda uyarı alabilirsiniz:
        </p>
        <Bullets items={[
          <><strong>Google Chrome:</strong> Ayarlar → Gizlilik ve Güvenlik → Çerezler ve diğer site verileri</>,
          <><strong>Mozilla Firefox:</strong> Ayarlar → Gizlilik ve Güvenlik → Çerezler ve Site Verileri</>,
          <><strong>Safari:</strong> Tercihler → Gizlilik → Çerezleri ve web sitesi verilerini yönet</>,
          <><strong>Microsoft Edge:</strong> Ayarlar → Çerezler ve site izinleri → Çerezleri yönet ve sil</>,
        ]} />

        <h3 className="font-semibold text-gray-700 mt-6 mb-3 text-sm border-l-4 border-emerald-400 pl-3">
          b) Google Analytics Devre Dışı Bırakma
        </h3>
        <p className="text-gray-600 text-sm leading-relaxed">
          Google Analytics çerezlerini özellikle devre dışı bırakmak isterseniz,
          Google'ın sunduğu{' '}
          <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-emerald-600 underline">
            tarayıcı eklentisini
          </a>{' '}
          yükleyebilirsiniz.
        </p>

        <InfoBox color="red">
          <strong>Uyarı:</strong> Zorunlu çerezlerin devre dışı bırakılması durumunda platformun
          bazı temel işlevleri (giriş yapma, form gönderme vb.) düzgün çalışmayabilir.
        </InfoBox>
      </Card>

      {/* Bölüm 5 — Veri Aktarımı */}
      <Card>
        <SectionTitle n={5}>Yurt Dışına Veri Aktarımı</SectionTitle>
        <p className="text-gray-600 text-sm leading-relaxed">
          Firebase ve Google Analytics hizmetleri Google LLC tarafından sağlanmakta olup,
          veriler ABD'deki sunucularda işlenebilmektedir. Google, AB-ABD Veri Gizlilik
          Çerçevesi (EU-US Data Privacy Framework) kapsamında sertifikalıdır. KVKK m. 9
          uyarınca yeterli korumaya sahip ülkelere veya açık rızanıza dayalı olarak
          veri aktarımı yapılmaktadır.
        </p>
      </Card>

      {/* Bölüm 6 — Haklarınız */}
      <Card>
        <SectionTitle n={6}>KVKK Kapsamındaki Haklarınız</SectionTitle>
        <p className="text-gray-600 text-sm leading-relaxed mb-4">
          6698 sayılı KVKK'nın 11. maddesi kapsamında aşağıdaki haklara sahipsiniz:
        </p>
        <Bullets items={[
          'Çerezler aracılığıyla kişisel veri işlenip işlenmediğini öğrenme',
          'İşlenmişse buna ilişkin bilgi talep etme',
          'İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme',
          'Kişisel verilerin silinmesini veya yok edilmesini isteme',
          'İşlenen verilerin münhasıran otomatik sistemler vasıtasıyla analiz edilmesi suretiyle aleyhinize bir sonucun ortaya çıkmasına itiraz etme',
        ]} />
      </Card>

      {/* Bölüm 7 — İletişim */}
      <Card>
        <SectionTitle n={7}>İletişim</SectionTitle>
        <p className="text-gray-600 text-sm leading-relaxed mb-4">
          Çerez politikamız veya kişisel verilerinizin işlenmesi hakkında
          sorularınız için bizimle iletişime geçebilirsiniz:
        </p>
        <div className="bg-gray-50 rounded-xl p-5 space-y-2 text-sm text-gray-700">
          <p><strong>Veri Sorumlusu:</strong> {SITE_CONFIG.name}</p>
          <p><strong>E-posta:</strong>{' '}
            <a href={`mailto:${SITE_CONFIG.email}`} className="text-emerald-600 underline">{SITE_CONFIG.email}</a>
          </p>
          <p><strong>Adres:</strong> {SITE_CONFIG.address}</p>
        </div>
        <InfoBox color="green">
          KVKK kapsamındaki taleplerinizi yukarıdaki e-posta adresine gönderebilirsiniz.
          Talebiniz en geç 30 gün içinde ücretsiz olarak yanıtlanacaktır.
        </InfoBox>
      </Card>

      {/* İlgili bağlantılar */}
      <Card className="bg-gray-50">
        <h3 className="font-semibold text-gray-700 mb-4">İlgili Yasal Belgeler</h3>
        <div className="flex flex-wrap gap-3">
          <Link to={LEGAL_LINKS.kvkk} className="text-sm text-emerald-600 underline hover:text-emerald-700">KVKK Aydınlatma Metni</Link>
          <span className="text-gray-300">|</span>
          <Link to={LEGAL_LINKS.gizlilik} className="text-sm text-emerald-600 underline hover:text-emerald-700">Gizlilik Politikası</Link>
          <span className="text-gray-300">|</span>
          <Link to={LEGAL_LINKS.kullanim} className="text-sm text-emerald-600 underline hover:text-emerald-700">Kullanım Koşulları</Link>
          <span className="text-gray-300">|</span>
          <Link to={LEGAL_LINKS.mesafeli} className="text-sm text-emerald-600 underline hover:text-emerald-700">Mesafeli Satış Sözleşmesi</Link>
        </div>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Mesafeli Satış Sözleşmesi İçeriği
═══════════════════════════════════════════════════════════ */

function MesafeliSatisSozlesmesi() {
  return (
    <div className="space-y-8">
      {/* Üst başlık */}
      <Card>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Mesafeli Satış Sözleşmesi</h2>
        <p className="text-emerald-600 font-medium mb-4">Son güncelleme: Mart 2025 — Versiyon 1.0</p>
        <div className="flex flex-wrap gap-2 mb-6">
          <Badge color="bg-emerald-100 text-emerald-700">6502 Sayılı Kanun Uyumlu</Badge>
          <Badge color="bg-blue-100 text-blue-700">Mesafeli Sözleşmeler Yönetmeliği</Badge>
        </div>
        <InfoBox color="amber">
          <strong>Önemli Bilgilendirme:</strong> {SITE_CONFIG.name}, alıcı ile satıcı arasındaki
          ticari işlemlere <strong>taraf değildir</strong>. Platform yalnızca modüler yapı
          üreticileri ile alıcıları bir araya getiren bir <strong>aracı hizmet sağlayıcıdır</strong>.
          Satış sözleşmesi doğrudan alıcı ile satıcı firma arasında kurulur.
        </InfoBox>
      </Card>

      {/* Bölüm 1 — Taraflar ve Tanımlar */}
      <Card>
        <SectionTitle n={1}>Taraflar ve Tanımlar</SectionTitle>

        <h3 className="font-semibold text-gray-700 mt-4 mb-3 text-sm border-l-4 border-emerald-400 pl-3">
          Platform Bilgileri (Aracı Hizmet Sağlayıcı)
        </h3>
        <div className="bg-gray-50 rounded-xl p-5 space-y-2 text-sm text-gray-700 mb-4">
          <p><strong>Platform Adı:</strong> {SITE_CONFIG.name}</p>
          <p><strong>Web Adresi:</strong>{' '}
            <a href={SITE_CONFIG.url} className="text-emerald-600 underline">{SITE_CONFIG.url}</a>
          </p>
          <p><strong>E-posta:</strong>{' '}
            <a href={`mailto:${SITE_CONFIG.email}`} className="text-emerald-600 underline">{SITE_CONFIG.email}</a>
          </p>
          <p><strong>Adres:</strong> {SITE_CONFIG.address}</p>
        </div>

        <h3 className="font-semibold text-gray-700 mt-4 mb-3 text-sm border-l-4 border-emerald-400 pl-3">
          Tanımlar
        </h3>
        <Tbl
          head={['Terim', 'Açıklama']}
          rows={[
            [<strong>Platform</strong>, <>{SITE_CONFIG.name} web sitesi ve mobil uygulaması</>],
            [<strong>Satıcı</strong>, 'Platformda ilan veren ve ürün/hizmet sunan firma veya gerçek kişi'],
            [<strong>Alıcı</strong>, 'Platform üzerinden ürün/hizmet satın alan veya teklif talep eden kişi'],
            [<strong>Ürün</strong>, 'Prefabrik evler, konteynerler, çelik yapılar, tiny house ve diğer modüler yapı ürünleri'],
            [<strong>Teklif</strong>, 'Satıcının alıcıya sunduğu fiyat ve teslimat koşullarını içeren resmi öneri'],
          ]}
        />
      </Card>

      {/* Bölüm 2 — Platformun Rolü */}
      <Card>
        <SectionTitle n={2}>Platformun Rolü ve Sorumluluk Sınırları</SectionTitle>
        <p className="text-gray-600 text-sm leading-relaxed mb-4">
          6563 sayılı Elektronik Ticaretin Düzenlenmesi Hakkında Kanun ve 6502 sayılı
          Tüketicinin Korunması Hakkında Kanun çerçevesinde {SITE_CONFIG.name}:
        </p>
        <Bullets items={[
          <><strong>Aracı hizmet sağlayıcıdır:</strong> Satışın tarafı değildir. Ürünlerin üretimi, kalitesi, teslimatı ve garantisi satıcı firmanın sorumluluğundadır.</>,
          <><strong>İlan ve teklif platformudur:</strong> Satıcı firmaların ilanlarını yayınlar, alıcıların teklif taleplerini iletir.</>,
          <><strong>Ödeme aracı değildir:</strong> Platform üzerinden doğrudan ödeme alınmaz. Ödeme koşulları alıcı ile satıcı arasında belirlenir.</>,
          <><strong>Firma doğrulaması yapar:</strong> Kayıtlı firmaların kimlik ve ticari sicil doğrulamasını yapar, ancak bu doğrulama ürünlerin garantisi anlamına gelmez.</>,
        ]} />
        <InfoBox color="purple">
          <strong>6502 sayılı Kanun m. 48:</strong> Mesafeli sözleşmelerde satıcı, sözleşme
          konusu ürünü teslim etmek ve alıcıyı bilgilendirmekle yükümlüdür. Bu yükümlülük
          platformda değil, ilgili satıcı firmada doğar.
        </InfoBox>
      </Card>

      {/* Bölüm 3 — Satıcı Sorumlulukları */}
      <Card>
        <SectionTitle n={3}>Satıcı Firma Sorumlulukları</SectionTitle>
        <p className="text-gray-600 text-sm leading-relaxed mb-4">
          Platformda ilan veren her satıcı firma aşağıdaki sorumlulukları kabul eder:
        </p>
        <Bullets items={[
          'İlanda belirtilen ürün bilgilerinin (boyut, malzeme, fiyat, teslimat süresi) doğru ve güncel olmasını sağlamak',
          'Alıcıya sözleşme öncesi bilgilendirme formunu (ön bilgilendirme) sunmak',
          'Ürünü, üzerinde anlaşılan koşullarda ve sürede teslim etmek',
          'Yasal garanti ve ayıplı mal hükümlerine uymak (6502 sayılı Kanun m. 8-12)',
          'Fatura, irsaliye ve diğer yasal belgeleri alıcıya teslim etmek',
          'İade ve iptal taleplerini mevzuata uygun olarak değerlendirmek',
          'Platformda yanıltıcı veya gerçeğe aykırı ilan yayınlamamak',
        ]} />
      </Card>

      {/* Bölüm 4 — Alıcı Sorumlulukları */}
      <Card>
        <SectionTitle n={4}>Alıcı Sorumlulukları</SectionTitle>
        <p className="text-gray-600 text-sm leading-relaxed mb-4">
          Platform üzerinden teklif talep eden veya sipariş veren her alıcı:
        </p>
        <Bullets items={[
          'Teklif talep formunda doğru ve güncel iletişim bilgileri vermekle yükümlüdür',
          'Sipariş öncesinde satıcı firmanın sunduğu ön bilgilendirme formunu incelemeli ve onaylamalıdır',
          'Ürün teslimatında teslim tutanağı imzalamadan önce ürünü kontrol etmelidir',
          'Ödeme koşullarını satıcı firma ile doğrudan görüşerek netleştirmelidir',
          'Uyuşmazlık durumunda öncelikle satıcı firma ile iletişime geçmelidir',
        ]} />
      </Card>

      {/* Bölüm 5 — Sipariş ve Teklif Süreci */}
      <Card>
        <SectionTitle n={5}>Sipariş ve Teklif Süreci</SectionTitle>
        <p className="text-gray-600 text-sm leading-relaxed mb-4">
          Platform üzerindeki alım-satım süreci aşağıdaki adımlardan oluşur:
        </p>

        <div className="space-y-4">
          {[
            { step: 1, title: 'Talep Oluşturma', desc: 'Alıcı, ihtiyacına uygun kategori, bütçe ve konum bilgilerini içeren bir talep formu doldurur.' },
            { step: 2, title: 'Teklif Alma', desc: 'Uygun satıcı firmalara bildirim gönderilir. Firmalar fiyat, teslimat süresi ve açıklama içeren teklif sunar.' },
            { step: 3, title: 'Teklif Değerlendirme', desc: 'Alıcı, gelen teklifleri karşılaştırır ve uygun bulduğu teklifi kabul eder.' },
            { step: 4, title: 'İletişim ve Anlaşma', desc: 'Kabul edilen teklif sonrası alıcı ve satıcı doğrudan iletişime geçerek detayları netleştirir.' },
            { step: 5, title: 'Sözleşme ve Ödeme', desc: 'Sözleşme ve ödeme doğrudan alıcı ile satıcı firma arasında gerçekleşir. Platform bu aşamada taraf değildir.' },
          ].map(({ step, title, desc }) => (
            <div key={step} className="flex gap-4 items-start">
              <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 text-sm font-bold flex items-center justify-center flex-shrink-0">
                {step}
              </span>
              <div>
                <p className="font-semibold text-gray-700 text-sm">{title}</p>
                <p className="text-gray-500 text-sm">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Bölüm 6 — İptal ve İade */}
      <Card>
        <SectionTitle n={6}>İptal, İade ve Cayma Hakkı</SectionTitle>
        <InfoBox color="amber">
          <strong>Önemli:</strong> Modüler yapı ürünleri genellikle <strong>sipariş üzerine üretilen</strong> ve
          alıcının özel taleplerine göre kişiselleştirilen ürünlerdir. 6502 sayılı Kanun m. 15/ç
          uyarınca, tüketicinin istekleri veya kişisel ihtiyaçları doğrultusunda hazırlanan mallarda
          cayma hakkı kullanılamaz.
        </InfoBox>

        <h3 className="font-semibold text-gray-700 mt-6 mb-3 text-sm border-l-4 border-emerald-400 pl-3">
          Genel İade Koşulları
        </h3>
        <Bullets items={[
          'İptal ve iade talepleri doğrudan satıcı firmaya iletilmelidir',
          'Ayıplı mal durumunda 6502 sayılı Kanun m. 11 hükümleri uygulanır',
          'Alıcı, malın tesliminden itibaren 30 gün içinde ayıbı satıcıya bildirmelidir',
          'Hazır ürünlerde (stoktan satış) 14 gün cayma hakkı geçerli olabilir — satıcı firma şartlarını belirler',
          <>{SITE_CONFIG.name}, iade sürecinde yalnızca yönlendirme ve bilgilendirme desteği sağlar</>,
        ]} />

        <h3 className="font-semibold text-gray-700 mt-6 mb-3 text-sm border-l-4 border-emerald-400 pl-3">
          Platform Üzerinden Teklif İptali
        </h3>
        <p className="text-gray-600 text-sm leading-relaxed">
          Henüz kabul edilmemiş teklifler platform üzerinden iptal edilebilir.
          Kabul edilmiş tekliflerin iptali için doğrudan satıcı firma ile
          iletişime geçilmesi gerekmektedir.
        </p>
      </Card>

      {/* Bölüm 7 — Uyuşmazlık Çözümü */}
      <Card>
        <SectionTitle n={7}>Uyuşmazlık Çözümü</SectionTitle>
        <p className="text-gray-600 text-sm leading-relaxed mb-4">
          Alıcı ile satıcı arasında doğabilecek uyuşmazlıklarda aşağıdaki yollar izlenebilir:
        </p>
        <Bullets items={[
          <><strong>1. Adım — Doğrudan İletişim:</strong> Öncelikle satıcı firma ile doğrudan iletişime geçerek çözüm arayınız.</>,
          <><strong>2. Adım — Platform Desteği:</strong> Çözüm sağlanamadığında {SITE_CONFIG.email} adresine başvurarak platform aracılığını talep edebilirsiniz. Platform, taraflar arasında iletişimi kolaylaştırır ancak karar merci değildir.</>,
          <><strong>3. Adım — Tüketici Hakem Heyeti:</strong> 6502 sayılı Kanun m. 68 uyarınca, belirlenen parasal sınırın altındaki uyuşmazlıklarda İl/İlçe Tüketici Hakem Heyetlerine başvurulabilir.</>,
          <><strong>4. Adım — Tüketici Mahkemesi:</strong> Parasal sınırın üzerindeki uyuşmazlıklarda Tüketici Mahkemelerine dava açılabilir.</>,
        ]} />
        <InfoBox color="blue">
          <strong>Yetkili Mahkeme:</strong> Uyuşmazlık halinde alıcının yerleşim yerindeki
          veya satıcı firmanın merkezinin bulunduğu yerdeki Tüketici Hakem Heyetleri
          ve Tüketici Mahkemeleri yetkilidir.
        </InfoBox>
      </Card>

      {/* Bölüm 8 — Platform Garantisi */}
      <Card>
        <SectionTitle n={8}>Platform Güvenlik Önlemleri</SectionTitle>
        <p className="text-gray-600 text-sm leading-relaxed mb-4">
          {SITE_CONFIG.name}, güvenli bir alışveriş ortamı sağlamak için aşağıdaki önlemleri alır:
        </p>
        <Bullets items={[
          <><strong>Firma Doğrulama:</strong> Tüm satıcı firmalar kimlik ve ticari sicil doğrulamasından geçer</>,
          <><strong>Değerlendirme Sistemi:</strong> Alıcılar, satıcı firmaları puanlayarak diğer kullanıcılara rehberlik eder</>,
          <><strong>Şikayet Mekanizması:</strong> Platform üzerinden istek ve şikayet bildirilebilir</>,
          <><strong>Yanıltıcı İlan Koruması:</strong> Uygunsuz veya yanıltıcı ilanlar tespit edildiğinde yayından kaldırılır</>,
        ]} />
      </Card>

      {/* Bölüm 9 — Yürürlük */}
      <Card>
        <SectionTitle n={9}>Yürürlük ve Değişiklikler</SectionTitle>
        <p className="text-gray-600 text-sm leading-relaxed mb-4">
          Bu sözleşme, platformun kullanılmaya başlanmasıyla yürürlüğe girer.
          {SITE_CONFIG.name}, yasal düzenlemelerdeki değişikliklere bağlı olarak bu
          sözleşmeyi güncelleme hakkını saklı tutar. Güncellemeler platformda
          yayınlandığı tarihte yürürlüğe girer.
        </p>
        <p className="text-gray-600 text-sm leading-relaxed">
          Değişiklikler hakkında kayıtlı kullanıcılara e-posta ile bildirim yapılır.
          Güncelleme sonrasında platformu kullanmaya devam etmeniz, değişiklikleri
          kabul ettiğiniz anlamına gelir.
        </p>
      </Card>

      {/* Bölüm 10 — İletişim */}
      <Card>
        <SectionTitle n={10}>İletişim</SectionTitle>
        <p className="text-gray-600 text-sm leading-relaxed mb-4">
          Bu sözleşme veya platform hizmetleri hakkında sorularınız için:
        </p>
        <div className="bg-gray-50 rounded-xl p-5 space-y-2 text-sm text-gray-700">
          <p><strong>Platform:</strong> {SITE_CONFIG.name}</p>
          <p><strong>Web:</strong>{' '}
            <a href={SITE_CONFIG.url} className="text-emerald-600 underline">{SITE_CONFIG.url}</a>
          </p>
          <p><strong>E-posta:</strong>{' '}
            <a href={`mailto:${SITE_CONFIG.email}`} className="text-emerald-600 underline">{SITE_CONFIG.email}</a>
          </p>
          <p><strong>Adres:</strong> {SITE_CONFIG.address}</p>
        </div>
      </Card>

      {/* İlgili bağlantılar */}
      <Card className="bg-gray-50">
        <h3 className="font-semibold text-gray-700 mb-4">İlgili Yasal Belgeler</h3>
        <div className="flex flex-wrap gap-3">
          <Link to={LEGAL_LINKS.kvkk} className="text-sm text-emerald-600 underline hover:text-emerald-700">KVKK Aydınlatma Metni</Link>
          <span className="text-gray-300">|</span>
          <Link to={LEGAL_LINKS.gizlilik} className="text-sm text-emerald-600 underline hover:text-emerald-700">Gizlilik Politikası</Link>
          <span className="text-gray-300">|</span>
          <Link to={LEGAL_LINKS.kullanim} className="text-sm text-emerald-600 underline hover:text-emerald-700">Kullanım Koşulları</Link>
          <span className="text-gray-300">|</span>
          <Link to={LEGAL_LINKS.cerez} className="text-sm text-emerald-600 underline hover:text-emerald-700">Çerez Politikası</Link>
        </div>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Ana LegalPage Bileşeni
═══════════════════════════════════════════════════════════ */

export default function LegalPage() {
  const { slug } = useParams<{ slug: string }>();
  const title = PAGE_TITLES[slug ?? ''] ?? 'Yasal Bilgi';
  const isCerez   = slug === 'cerez-politikasi';
  const isMesafeli = slug === 'mesafeli-satis-sozlesmesi';
  const hasContent = isCerez || isMesafeli;

  return (
    <div className="flex flex-col min-h-screen">
      <SEOMeta
        title={`${title} — ${SITE_CONFIG.name}`}
        description={`${SITE_CONFIG.name} ${title.toLowerCase()} sayfası.`}
      />
      <Header />
      <main className="flex-1 bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4">
          <nav className="text-sm text-gray-500 mb-6 flex items-center gap-2">
            <Link to="/" className="hover:text-emerald-600">Ana Sayfa</Link>
            <span>/</span>
            <span className="text-gray-800">{title}</span>
          </nav>

          {isCerez && <CerezPolitikasi />}
          {isMesafeli && <MesafeliSatisSozlesmesi />}

          {!hasContent && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">{title}</h1>
              <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-amber-700 text-sm">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Bu sayfa yakında içerikle doldurulacaktır.
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
