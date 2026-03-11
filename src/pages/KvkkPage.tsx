import { Link } from 'react-router-dom';
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

function Sub({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-semibold text-gray-700 mt-6 mb-3 text-sm border-l-4 border-emerald-400 pl-3">
      {children}
    </h3>
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

function Badge({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span className={`inline-block text-xs px-2.5 py-0.5 rounded-full font-semibold whitespace-nowrap ${color}`}>
      {children}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════
   Statik veri
═══════════════════════════════════════════════════════════ */

/* Bölüm 2 — Kanal bazlı aydınlatma */
const CHANNELS = [
  {
    form: 'Firma Kayıt / İlan Ver Formu',
    legal: 'Sözleşmenin kurulması ve ifası — KVKK m. 5/2-c',
    badgeColor: 'bg-emerald-100 text-emerald-700',
    rows: [
      ['Kimlik',    'Ad, soyad (firma yetkilisi)',                              'Hesap ve iletişim yönetimi'],
      ['Firma',     'Ticaret unvanı, vergi numarası, firma yapısı',             'Firma kimlik doğrulaması (m. 5/2-ç)'],
      ['İletişim',  'Telefon, e-posta',                                         'Teklif ve platform bildirimleri'],
      ['Konum',     'Şehir, ilçe, açık adres',                                  'Bölgesel eşleşme ve ilan gösterimi'],
      ['Hizmet',    'Ürün kategorileri, hizmet bölgeleri, tanıtım metni',       'İlan yayımlama ve alıcı eşleşmesi'],
    ],
  },
  {
    form: 'Teklif Al Formu',
    legal: 'Sözleşme ifası + Açık rıza (firma aktarımı) — KVKK m. 5/2-c & m. 5/1',
    badgeColor: 'bg-blue-100 text-blue-700',
    rows: [
      ['Kimlik',   'Ad, soyad',                           'Firma ile kişisel iletişim'],
      ['İletişim', 'Telefon, e-posta',                    'Firma tarafından teklif iletimi'],
      ['İşlem',   'Talep mesajı, talep edilen ürün/hizmet', 'Firma\'nın teklif hazırlaması'],
    ],
  },
  {
    form: 'İletişim Formu',
    legal: 'Meşru menfaat — KVKK m. 5/2-f',
    badgeColor: 'bg-purple-100 text-purple-700',
    rows: [
      ['Kimlik',   'Ad, soyad', 'Başvuru sahibini tanımlama'],
      ['İletişim', 'E-posta',   'Yanıt iletimi'],
      ['İçerik',  'Mesaj metni','Destek talebini işleme alma'],
    ],
  },
];

/* Bölüm 3 — Amaçlar hukuki dayanak gruplu */
const PURPOSES_GROUPED = [
  {
    basis:   'Sözleşmenin Kurulması ve İfası',
    article: 'KVKK m. 5/2-c',
    color:   'bg-emerald-100 text-emerald-700',
    note:    null,
    items: [
      'Teklif talebi alma, işleme ve ilgili firmaya yönlendirme',
      'Firma kaydı oluşturma ve ilan yayımlama',
      'Alıcı–satıcı eşleşmesi ve iletişim kurulması',
      'Üyelik ve hesap yönetimi',
    ],
  },
  {
    basis:   'Kanuni Yükümlülük',
    article: 'KVKK m. 5/2-ç',
    color:   'bg-blue-100 text-blue-700',
    note:    null,
    items: [
      'Firma kimlik ve ticaret sicil doğrulaması (TTK, VUK)',
      'Fatura kesimi ve muhasebe kayıtları (VUK m. 253)',
      'Yetkili kurum ve mahkeme taleplerine yanıt verme',
      'İnternet ortamında bağlantı log kayıtları (5651 sayılı Kanun)',
    ],
  },
  {
    basis:   'Meşru Menfaat',
    article: 'KVKK m. 5/2-f',
    color:   'bg-purple-100 text-purple-700',
    note:    '⚖️ Denge Testi: Meşru menfaat kapsamındaki işlemlerde, ilgili kişinin temel hak ve özgürlüklerine zarar vermeyeceği, denge testi yapılarak değerlendirilmektedir. Bu testi yazılı olarak talep etme hakkınız saklıdır.',
    items: [
      'Platform güvenliği, dolandırıcılık ve kötüye kullanım önleme',
      'Sistem performansı analizi ve teknik iyileştirme',
      'Anlaşmazlık çözümü için belge ve kayıt tutma',
      'İstatistiksel raporlama (anonim/toplu veri)',
    ],
  },
  {
    basis:   'Açık Rıza',
    article: 'KVKK m. 5/1',
    color:   'bg-amber-100 text-amber-700',
    note:    '📋 Ayrı Onay Kutusu: Bu kapsamdaki işlemler için form gönderim ekranında ayrı bir onay kutusu yer almaktadır. Rızanızı vermemeniz, sözleşme kapsamındaki diğer hizmetleri etkilemez. Rızanızı istediğiniz zaman geri alabilirsiniz.',
    items: [
      'Teklif talebinin seçtiğiniz firmaya iletilmesi',
      'Ticari elektronik ileti gönderimi (kampanya, duyuru)',
      'Profilleme ve kişiselleştirilmiş içerik sunumu',
      'Analitik ve pazarlama çerez kullanımı',
    ],
  },
];

/* Bölüm 5 — Veri minimizasyonu */
const MINIMIZATION = [
  { data: 'Ad, Soyad',         reason: 'Firma yetkilileriyle kişisel iletişim; anonim talepler kabul edilmemektedir.',               form: 'Tüm formlar' },
  { data: 'Telefon',           reason: 'Teklif sürecinde hızlı iletişim; yalnızca teklif talep edilen firmaya iletilir.',             form: 'Teklif Al, Kayıt' },
  { data: 'E-posta',           reason: 'Teklif durumu, hesap ve platform bildirimleri için birincil iletişim kanalı.',                form: 'Tüm formlar' },
  { data: 'Vergi Numarası',    reason: 'Firma kimlik doğrulaması ve sahte kayıt önleme; kanuni yükümlülük (TTK/VUK).',               form: 'Firma Kayıt' },
  { data: 'Şehir / İlçe',     reason: 'Alıcıyı yerel firmalarla eşleştirme; kesin GPS koordinatı veya hassas konum talep edilmez.', form: 'Firma Kayıt' },
  { data: 'IP Adresi',        reason: 'Dolandırıcılık önleme ve 5651 sayılı Kanun kapsamında zorunlu log tutma.',                   form: 'Otomatik' },
  { data: 'Çerez Verileri',   reason: 'Oturum yönetimi (zorunlu) ve ziyaretçi istatistikleri (analitik — onaya bağlı).',            form: 'Otomatik' },
];

/* Bölüm 7 — Çerezler */
const COOKIES_TABLE = [
  { cat: 'Zorunlu',   color: 'bg-gray-200 text-gray-700',     consent: 'Onay gerekmez',   duration: 'Oturum süresi',    examples: 'session_id, csrf_token',     purpose: 'Oturum ve güvenlik yönetimi',               etk: '—' },
  { cat: 'Tercih',    color: 'bg-blue-100 text-blue-700',     consent: 'Onay gerekir',    duration: '1 yıl',             examples: 'language, theme',             purpose: 'Dil ve görünüm tercihleri',                  etk: '—' },
  { cat: 'Analitik',  color: 'bg-purple-100 text-purple-700', consent: 'Onay gerekir',    duration: 'En fazla 13 ay',   examples: '_ga, _gid',                  purpose: 'Ziyaretçi istatistikleri, performans',      etk: 'İYS kapsamı dışı' },
  { cat: 'Pazarlama', color: 'bg-amber-100 text-amber-700',   consent: 'Açık rıza şart',  duration: '90 gün',           examples: 'fbp, _gcl_au',               purpose: 'Kişiselleştirilmiş reklam / yeniden hedef', etk: 'ETK m.6 / İYS uyumu zorunlu' },
];

/* Bölüm 9 — Veri Aktarımı */
const DOMESTIC_TRANSFERS = [
  {
    recipient: 'Üretici ve satıcı firmalar',
    data:      'Ad, telefon, e-posta, talep mesajı',
    basis:     'Açık rıza (m. 5/1) + Sözleşme ifası (m. 5/2-c)',
    note:      'Yalnızca teklif talebinde seçilen firmaya, yalnızca ilgili teklif kapsamında iletilir.',
  },
  {
    recipient: 'Yetkili kamu kurum ve kuruluşları',
    data:      'Yasal zorunluluk kapsamındaki her türlü veri',
    basis:     'Kanuni yükümlülük (m. 5/2-ç)',
    note:      'Mahkeme, savcılık, vergi dairesi, BDDK, BTK vb.',
  },
  {
    recipient: 'Hukuki ve mali danışmanlar',
    data:      'İlgili dava/denetim kapsamındaki veriler',
    basis:     'Meşru menfaat (m. 5/2-f)',
    note:      'Gizlilik sözleşmesiyle bağlı profesyoneller.',
  },
];

const INTERNATIONAL_TRANSFERS = [
  ['Firebase (Google LLC)',   'ABD', 'Kimlik, form ve ilan verileri', 'SCCs + Google Cloud DPA'],
  ['Google Analytics',        'ABD', 'Anonim teknik veriler',          'SCCs / Yeterlilik kararı'],
  ['Cloudflare Inc.',         'ABD', 'IP adresi, teknik log',          'SCCs'],
  ['E-posta altyapısı (SMTP)','AB / ABD', 'E-posta adresi',           'SCCs'],
];

/* Bölüm 10 — Saklama Süreleri */
const RETENTION = [
  ['Üyelik ve hesap bilgileri',       'Hesap silme tarihinden itibaren 2 yıl',              'KVKK m. 7 / TTK m. 82'],
  ['İlan ve teklif verileri',         'Hesap silme tarihinden itibaren 3 yıl',              'Sözleşme delil süresi'],
  ['Teklif talep kayıtları',          '3 yıl',                                               'TKHK m. 83'],
  ['Mesajlaşma kayıtları',            '2 yıl',                                               'KVKK m. 7'],
  ['Fatura ve ticari kayıtlar',       '10 yıl',                                              'VUK m. 253 / TTK m. 82'],
  ['Teknik log ve erişim kayıtları',  '1 yıl',                                               '5651 sayılı Kanun m. 5'],
  ['Pazarlama onay/red kayıtları',    'Rıza geri alınmasından sonra 3 yıl (ispat amaçlı)', 'İYS / ETK m. 12'],
  ['Çerez verileri (analitik)',       'En fazla 13 ay',                                     'Google Analytics politikası'],
  ['KVKK başvuru kayıtları',          '3 yıl',                                               'KVKK m. 13'],
  ['İhlal bildirimi kayıtları',       '5 yıl',                                               'KVKK Kurul kararları'],
];

/* Bölüm 11 — Haklar */
const RIGHTS = [
  { title: 'Bilgi Edinme',              desc: 'Kişisel verilerinizin işlenip işlenmediğini ve işlenmişse buna ilişkin bilgileri öğrenme hakkına sahipsiniz.' },
  { title: 'Amaç ve Uygunluk Sorgulama', desc: 'Verilerinizin işlenme amacını ve amaca uygun kullanılıp kullanılmadığını sorgulayabilirsiniz.' },
  { title: 'Aktarım Bilgisi',           desc: 'Verilerinizin aktarıldığı yurt içi ve yurt dışı üçüncü kişileri ve aktarım gerekçelerini öğrenebilirsiniz.' },
  { title: 'Düzeltme Talep Etme',       desc: 'Eksik veya yanlış işlenmiş verilerinizin düzeltilmesini ve bu düzeltmenin üçüncü kişilere bildirilmesini talep edebilirsiniz.' },
  { title: 'Silme veya Yok Etme',       desc: 'İşlenmesini gerektiren sebeplerin ortadan kalkması hâlinde verilerinizin silinmesini veya yok edilmesini talep edebilirsiniz.' },
  { title: 'Aktarılan Taraflara Bildirim', desc: 'Düzeltme ve silme işlemlerinin verilerinizi alan üçüncü kişilere bildirilmesini talep edebilirsiniz.' },
  { title: 'Otomatik İşleme İtiraz',    desc: 'Yalnızca otomatik sistemler aracılığıyla yapılan analizler sonucunda aleyhinize doğan kararlara itiraz edebilirsiniz.' },
  { title: 'Zararın Tazmini',           desc: 'Mevzuata aykırı veri işleme nedeniyle zarara uğramanız hâlinde tazminat talep edebilirsiniz.' },
];

/* ═══════════════════════════════════════════════════════════
   Sayfa bileşeni
═══════════════════════════════════════════════════════════ */

export default function KvkkPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <SEOMeta
        title="KVKK Aydınlatma Metni — ModülerPazar"
        description="ModülerPazar kişisel verilerin korunması kanunu (KVKK) kapsamında aydınlatma metni."
        url="/kvkk"
      />
      <Header />

      <main className="flex-1 bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 space-y-5">

          {/* Breadcrumb */}
          <nav className="text-sm text-gray-500 flex items-center gap-2">
            <Link to="/" className="hover:text-emerald-600 transition">Ana Sayfa</Link>
            <span>/</span>
            <span className="text-gray-800">KVKK Aydınlatma Metni</span>
          </nav>

          {/* Hero header */}
          <Card>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 leading-snug">
              Kişisel Verilerin Korunması Kanunu<br />
              <span className="text-emerald-600">Aydınlatma Metni</span>
            </h1>
            <div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-500">
              <span className="bg-gray-100 rounded-full px-3 py-1">Son güncelleme: Şubat 2025</span>
              <span className="bg-gray-100 rounded-full px-3 py-1">Versiyon 2.0</span>
              <span className="bg-emerald-100 text-emerald-700 rounded-full px-3 py-1 font-medium">12 Mart 2024 Değişikliklerine Uyumlu</span>
            </div>
            <p className="text-sm text-gray-500 mt-4 leading-relaxed">
              Bu metin; 6698 sayılı Kişisel Verilerin Korunması Kanunu'nun 10. maddesi,
              Aydınlatma Yükümlülüğünün Yerine Getirilmesinde Uyulacak Usul ve Esaslar
              Hakkında Tebliğ ve 12 Mart 2024 tarihli KVKK değişiklikleri uyarınca hazırlanmıştır.
            </p>
          </Card>

          {/* ── 1. Veri Sorumlusu ───────────────────────── */}
          <Card>
            <SectionTitle n={1}>Veri Sorumlusu</SectionTitle>
            <p className="text-sm text-gray-600 mb-4">
              6698 sayılı Kanun kapsamında <strong>veri sorumlusu</strong> sıfatıyla
              kişisel verilerinizi işleyen platform aşağıda tanımlanmıştır:
            </p>
            <div className="bg-gray-50 rounded-xl p-5 text-sm text-gray-600 grid sm:grid-cols-2 gap-x-8 gap-y-2.5">
              <p><span className="font-semibold text-gray-700">Ticaret Unvanı:</span>{' '}{SITE_CONFIG.name}</p>
              <p><span className="font-semibold text-gray-700">Adres:</span>{' '}{SITE_CONFIG.address}</p>
              <p>
                <span className="font-semibold text-gray-700">E-posta:</span>{' '}
                <a href={`mailto:${SITE_CONFIG.email}`} className="text-emerald-600 hover:underline">
                  {SITE_CONFIG.email}
                </a>
              </p>
              <p className="text-xs text-gray-400">Teknik sorunlar 3-5 iş günü içinde çözülür.</p>
              <p><span className="font-semibold text-gray-700">KEP Adresi:</span>{' '}modulerpazar@hs01.kep.tr</p>
              <p><span className="font-semibold text-gray-700">Veri Koruma Sorumlusu:</span>{' '}kvkk@modulerpazar.com</p>
            </div>
            <div className="mt-4">
              <InfoBox color="blue">
                <strong>VERBİS Kaydı:</strong> Platformumuz, KVKK Kurulu'nun belirlediği yükümlülükler
                kapsamında Veri Sorumluları Sicil Bilgi Sistemi'ne (VERBİS) kayıtlıdır.
              </InfoBox>
            </div>
          </Card>

          {/* ── 2. Aydınlatma Yükümlülüğü ───────────────── */}
          <Card>
            <SectionTitle n={2}>Aydınlatma Yükümlülüğü (KVKK m. 10) — Kanal Bazlı</SectionTitle>
            <p className="text-sm text-gray-600 mb-5">
              Kişisel verileriniz platformdaki aşağıdaki kanallar aracılığıyla doğrudan
              sizden toplanmaktadır. Her kanal için toplanan veriler ve hukuki dayanak
              ayrı ayrı belirtilmiştir.
            </p>
            <div className="space-y-6">
              {CHANNELS.map((ch) => (
                <div key={ch.form}>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <p className="font-semibold text-gray-800 text-sm">{ch.form}</p>
                    <Badge color={ch.badgeColor}>{ch.legal}</Badge>
                  </div>
                  <Tbl
                    head={['Veri Kategorisi', 'Toplanan Veriler', 'İşlenme Amacı']}
                    rows={ch.rows}
                  />
                </div>
              ))}
            </div>
          </Card>

          {/* ── 3. İşlenme Amaçları ve Hukuki Dayanaklar ── */}
          <Card>
            <SectionTitle n={3}>Kişisel Verilerin İşlenme Amaçları ve Hukuki Dayanakları (KVKK m. 5)</SectionTitle>
            <p className="text-sm text-gray-600 mb-5">
              Kişisel verileriniz, aşağıda hukuki dayanak gruplarına göre sıralanmış
              amaçlarla işlenmektedir:
            </p>
            <div className="space-y-5">
              {PURPOSES_GROUPED.map((grp) => (
                <div key={grp.basis} className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-200">
                    <Badge color={grp.color}>{grp.basis}</Badge>
                    <span className="text-xs font-mono text-emerald-700 font-semibold">{grp.article}</span>
                  </div>
                  <div className="p-4">
                    <Bullets items={grp.items} />
                    {grp.note && (
                      <div className="mt-3">
                        <InfoBox color="amber">
                          <p className="text-xs">{grp.note}</p>
                        </InfoBox>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* ── 4. Pazaryeri Vurgusu ─────────────────────── */}
          <Card>
            <SectionTitle n={4}>Pazaryeri Modeli ve Veri Kullanımı</SectionTitle>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 mb-4">
              <p className="font-semibold text-emerald-800 text-sm mb-2">Temel İlkemiz</p>
              <p className="text-emerald-700 text-sm leading-relaxed">
                <strong>Verileriniz yalnızca teklif hazırlanması amacıyla, sizin seçtiğiniz
                firmalara iletilir. Kişisel verileriniz hiçbir koşulda ticari amaçla üçüncü
                taraflara satılmaz, kiralanmaz veya kullandırılmaz.</strong>
              </p>
            </div>
            <Bullets items={[
              <span><strong>Veri minimizasyonu:</strong> Teklif Al formunda yalnızca firmanın teklif hazırlamak için ihtiyaç duyduğu veriler (ad, telefon, e-posta, talep mesajı) toplanır.</span>,
              <span><strong>Amaçla sınırlılık:</strong> Teklif amacıyla toplanan veriler başka amaçlarla (örn. pazarlama) kullanılmaz; ayrı açık rıza gerektirir.</span>,
              <span><strong>Firma aktarımı şeffaflığı:</strong> Teklif formunun altındaki onay kutusunda hangi tür firma/lara iletileceği açıkça belirtilir.</span>,
              <span><strong>Geri alma hakkı:</strong> Form onayınızı vermemeniz hâlinde teklif süreci başlamaz; vermiş olduğunuz rızayı istediğiniz zaman geri alabilirsiniz.</span>,
            ]} />
          </Card>

          {/* ── 5. Veri Minimizasyonu ve Ölçülülük ──────── */}
          <Card>
            <SectionTitle n={5}>Veri Minimizasyonu ve Ölçülülük İlkesi (KVKK m. 4/2-ç)</SectionTitle>
            <p className="text-sm text-gray-600 mb-3">
              Platformumuzda toplanan her veri türü için işleme gerekliliği aşağıda açıklanmıştır.
              Amacı aşan veya gereksiz veri toplanmamaktadır.
            </p>
            <Tbl
              head={['Veri Türü', 'Neden Toplandığı', 'Kaynak Form']}
              rows={MINIMIZATION.map((r) => [
                <span className="font-medium text-gray-700">{r.data}</span>,
                r.reason,
                <span className="text-xs text-gray-500 whitespace-nowrap">{r.form}</span>,
              ])}
            />
          </Card>

          {/* ── 6. Konum Verisi ──────────────────────────── */}
          <Card>
            <SectionTitle n={6}>Konum Verisi</SectionTitle>
            <InfoBox color="amber">
              <strong>Hassas Veri Uyarısı:</strong> Konum verisi, kişinin bulunduğu yere dair
              fikir verebileceğinden özenle işlenmektedir.
            </InfoBox>
            <div className="mt-4 space-y-4 text-sm text-gray-600">
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <p className="font-semibold text-gray-700">Ne Toplanır?</p>
                <Bullets items={[
                  'Firma kayıt formunda: Şehir ve ilçe bilgisi (açık adres isteğe bağlı)',
                  'GPS koordinatı veya hassas lokasyon bilgisi toplanmamaktadır',
                  'Tarayıcı konum izni istenmemektedir',
                ]} />
              </div>
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <p className="font-semibold text-gray-700">Ne İçin Kullanılır?</p>
                <Bullets items={[
                  'Alıcıları şehir/bölge bazında yerel firmalarla eşleştirme',
                  'Ürün/hizmet kapsamının coğrafi gösterimi',
                  'Hiçbir koşulda reklam hedefleme veya profilleme amacıyla kullanılmaz',
                ]} />
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="font-semibold text-gray-700 mb-2">Hukuki Dayanak</p>
                <p>Sözleşmenin ifası (KVKK m. 5/2-c) — ilan eşleşmesi hizmetinin sunulabilmesi için zorunludur.</p>
              </div>
            </div>
          </Card>

          {/* ── 7. Çerez Politikası ──────────────────────── */}
          <Card>
            <SectionTitle n={7}>Çerez (Cookie) Politikası</SectionTitle>
            <p className="text-sm text-gray-600 mb-4">
              Platformumuz dört kategoride çerez kullanmaktadır. Zorunlu çerezler
              hizmetin işleyişi için gerekli olup onay gerektirmez; diğerleri yalnızca
              tercihinize bağlı olarak etkinleştirilir.
            </p>
            <Tbl
              head={['Kategori', 'Onay', 'Süre', 'Örnekler', 'Amaç', 'ETK / İYS']}
              rows={COOKIES_TABLE.map((c) => [
                <Badge color={c.color}>{c.cat}</Badge>,
                c.consent,
                c.duration,
                <span className="font-mono text-xs text-gray-500">{c.examples}</span>,
                c.purpose,
                <span className="text-xs text-gray-500">{c.etk}</span>,
              ])}
            />
            <div className="mt-4 space-y-3">
              <InfoBox color="blue">
                <strong>İYS Uyumu:</strong> Ticari elektronik ileti göndermek için İleti Yönetim
                Sistemi'ne (iys.org.tr) kayıt yapılmakta ve onay/ret tercihleri buraya bildirilerek
                Elektronik Ticaret Kanunu (ETK) m. 6 yükümlülükleri yerine getirilmektedir.
              </InfoBox>
              <p className="text-xs text-gray-500">
                Çerez tercihlerinizi tarayıcı ayarlarınızdan veya platform tercih panelinden
                istediğiniz zaman değiştirebilirsiniz. Detay için{' '}
                <Link to={LEGAL_LINKS.cerez} className="text-emerald-600 hover:underline">
                  Çerez Politikası
                </Link>'mızı inceleyiniz.
              </p>
            </div>
          </Card>

          {/* ── 8. Özel Nitelikli Kişisel Veriler ────────── */}
          <Card>
            <SectionTitle n={8}>Özel Nitelikli Kişisel Veriler (KVKK m. 6)</SectionTitle>
            <InfoBox color="green">
              <strong>Bu Platformda Özel Nitelikli Kişisel Veri İşlenmemektedir.</strong>
            </InfoBox>
            <div className="mt-4 text-sm text-gray-600 space-y-3">
              <p>
                KVKK'nın 6. maddesi kapsamındaki <em>özel nitelikli kişisel veriler</em> (ırk, etnik köken,
                siyasi düşünce, felsefi inanç, din, mezhep, kılık-kıyafet, dernek/vakıf/sendika üyeliği,
                sağlık, cinsel hayat, ceza mahkûmiyeti, biyometrik ve genetik veri) bu platform
                aracılığıyla hiçbir koşulda işlenmemektedir.
              </p>
              <p>
                Kullanıcı tarafından gönüllü olarak paylaşılan içeriklerde özel nitelikli veri
                tespit edilmesi hâlinde ilgili içerik derhal kaldırılır ve veri sahibi bilgilendirilir.
              </p>
            </div>
          </Card>

          {/* ── 9. Veri Aktarımı ─────────────────────────── */}
          <Card>
            <SectionTitle n={9}>Veri Aktarımı (KVKK m. 8–9)</SectionTitle>

            <Sub>9.1 Yurt İçi Aktarım (KVKK m. 8)</Sub>
            <p className="text-sm text-gray-600 mb-3">
              Kişisel verileriniz KVKK'nın 8. maddesi uyarınca aşağıdaki taraflarla paylaşılabilir:
            </p>
            <Tbl
              head={['Alıcı', 'Aktarılan Veri', 'Hukuki Dayanak', 'Kapsam']}
              rows={DOMESTIC_TRANSFERS.map((r) => [
                <span className="font-medium text-gray-700">{r.recipient}</span>,
                r.data,
                <span className="text-xs text-emerald-700 font-medium">{r.basis}</span>,
                <span className="text-xs text-gray-500">{r.note}</span>,
              ])}
            />

            <Sub>9.2 Yurt Dışı Aktarım (KVKK m. 9)</Sub>
            <p className="text-sm text-gray-600 mb-3">
              Aşağıdaki teknik altyapı sağlayıcılarına veri aktarımı, KVKK m. 9 kapsamında
              Standart Sözleşme Maddeleri (SCCs) ve ilgili veri işleme anlaşmaları (DPA)
              güvencesiyle gerçekleştirilmektedir:
            </p>
            <Tbl
              head={['Sağlayıcı', 'Konum', 'Aktarılan Veri', 'Güvence']}
              rows={INTERNATIONAL_TRANSFERS.map((r) => [
                <span className="font-medium text-gray-700">{r[0]}</span>,
                r[1],
                r[2],
                <span className="text-xs text-gray-500">{r[3]}</span>,
              ])}
            />
            <p className="mt-3 text-xs text-gray-400">
              SCCs: AB Komisyonu onaylı Standart Sözleşme Maddeleri. Tüm aktarımlar Kurul kararlarıyla
              uyumludur. Aktarım yapılan sağlayıcı listesi değiştiğinde bu metin güncellenir.
            </p>
          </Card>

          {/* ── 10. Saklama Süreleri ─────────────────────── */}
          <Card>
            <SectionTitle n={10}>Veri Saklama Süreleri (KVKK m. 7)</SectionTitle>
            <p className="text-sm text-gray-600 mb-3">
              Verileriniz yalnızca işlenme amacının gerektirdiği süre boyunca saklanır.
              Süre dolduğunda veya işleme amacı ortadan kalktığında veriler silinir,
              yok edilir veya anonim hâle getirilir (Kişisel Veri Saklama ve İmha Politikası).
            </p>
            <Tbl
              head={['Veri Türü', 'Saklama Süresi', 'Hukuki Dayanak']}
              rows={RETENTION.map(([type, dur, legal]) => [
                <span className="font-medium text-gray-700">{type}</span>,
                dur,
                <span className="text-xs text-gray-500">{legal}</span>,
              ])}
            />
          </Card>

          {/* ── 11. Veri Sahibinin Hakları ───────────────── */}
          <Card>
            <SectionTitle n={11}>Veri Sahibinin Hakları (KVKK m. 11)</SectionTitle>
            <p className="text-sm text-gray-600 mb-4">
              KVKK'nın 11. maddesi uyarınca kişisel verilerinize ilişkin aşağıdaki
              sekiz hakka sahipsiniz:
            </p>
            <div className="grid sm:grid-cols-2 gap-3 mb-5">
              {RIGHTS.map((right, i) => (
                <div key={right.title} className="flex gap-3 bg-gray-50 rounded-xl p-4">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{right.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{right.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <Sub>Başvuru Kanalları ve Yanıt Süresi</Sub>
            <div className="space-y-3">
              {[
                {
                  ch:    'E-posta',
                  val:   SITE_CONFIG.email,
                  href:  `mailto:${SITE_CONFIG.email}`,
                  note:  'Kayıtlı e-posta adresinizden gönderilmeli; güvenli e-imza veya mobil imzalı başvurular da kabul edilir.',
                  color: 'bg-emerald-50 border-emerald-200',
                },
                {
                  ch:    'KEP (Kayıtlı Elektronik Posta)',
                  val:   'modulerpazar@hs01.kep.tr',
                  href:  undefined,
                  note:  'Hukuki geçerliliği olan resmi kanalımızdır.',
                  color: 'bg-blue-50 border-blue-200',
                },
                {
                  ch:    'Yazılı / Posta',
                  val:   SITE_CONFIG.address,
                  href:  undefined,
                  note:  '"Kişisel Veri Sahibi Başvurusu" ibaresiyle ıslak imzalı dilekçe; T.C. kimlik fotokopisi eklenmelidir.',
                  color: 'bg-gray-50 border-gray-200',
                },
              ].map((item) => (
                <div key={item.ch} className={`border rounded-xl p-4 text-sm ${item.color}`}>
                  <p className="font-semibold text-gray-800 mb-1">{item.ch}</p>
                  {item.href
                    ? <a href={item.href} className="text-emerald-600 hover:underline">{item.val}</a>
                    : <p className="text-gray-700">{item.val}</p>
                  }
                  <p className="text-gray-500 text-xs mt-1">{item.note}</p>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <InfoBox color="gray">
                <p className="font-semibold mb-1">30 Günlük Yanıt Süresi</p>
                <p>
                  Başvurunuz en geç <strong>30 (otuz) gün</strong> içinde sonuçlandırılır.
                  Talebin niteliğine göre bu süre bir kez daha 30 gün uzatılabilir;
                  uzatma gerekçesiyle birlikte tarafınıza bildirilir. Yanıtlama kural
                  olarak ücretsizdir; 10 sayfayı aşan çıktı gerektiren talepler
                  için KVKK Kurulu tarifesiyle ücret alınabilir.
                </p>
              </InfoBox>
            </div>
            <div className="mt-3">
              <InfoBox color="amber">
                Kimliğinizi doğrulayan belge (T.C. kimlik fotokopisi veya pasaport)
                başvurunuza eklenmelidir. Kimliği doğrulanamayan başvurular işleme
                alınmayabilir. Kişisel Veri Sahibi Başvuru Formu'na{' '}
                <a href={`mailto:${SITE_CONFIG.email}`} className="underline font-medium">
                  e-posta ile talep ederek
                </a>{' '}
                ulaşabilirsiniz.
              </InfoBox>
            </div>
          </Card>

          {/* ── 12. 12 Mart 2024 KVKK Değişiklikleri ────── */}
          <Card>
            <SectionTitle n={12}>12 Mart 2024 KVKK Değişikliklerine Uyum</SectionTitle>
            <p className="text-sm text-gray-600 mb-4">
              7499 sayılı Kanun ile 6698 sayılı KVKK'da yapılan ve 12 Mart 2024 tarihinde
              yürürlüğe giren değişiklikler kapsamında platformumuzda gerçekleştirilen
              uyum çalışmaları aşağıda özetlenmiştir:
            </p>
            <div className="space-y-3">
              {[
                {
                  title: 'Yurt Dışı Veri Aktarımı (m. 9)',
                  desc:  'Yurt dışı aktarım hükümleri güncellenerek Firebase ve diğer sağlayıcılarla yeni SCCs/DPA anlaşmaları imzalanmıştır. Aktarımlar Kurul\'un güvenli ülke listesi ve yeterlilik kararları doğrultusunda yürütülmektedir.',
                  color: 'border-blue-400',
                },
                {
                  title: 'Veri İhlali Bildirimi (m. 12)',
                  desc:  'Kişisel veri ihlali tespit edilmesi hâlinde KVKK Kurulu\'na 72 saat, etkilenen veri sahiplerine ise makul sürede bildirim yapılmasını sağlayan ihlal müdahale prosedürümüz güncellenmiştir.',
                  color: 'border-red-400',
                },
                {
                  title: 'İdari Para Cezası Güncellemesi (m. 18)',
                  desc:  'Güncellenmiş ceza tarifesiyle uyumlu risk değerlendirmesi yapılmış; ihlal önleme öncelikleri bu doğrultuda gözden geçirilmiştir.',
                  color: 'border-amber-400',
                },
                {
                  title: 'Açık Rıza Mekanizması',
                  desc:  'Açık rıza talep edilen tüm formlarda (Teklif Al, pazarlama bildirimleri) ayrı ve bağımsız onay kutuları ile geri alma mekanizmaları hayata geçirilmiştir.',
                  color: 'border-emerald-400',
                },
                {
                  title: 'VERBİS Güncelleme',
                  desc:  'Değişiklikler kapsamında VERBİS kayıt bilgileri ve işleme envanteri revize edilmiş; yeni veri akışları kayıt altına alınmıştır.',
                  color: 'border-purple-400',
                },
              ].map((item) => (
                <div key={item.title} className={`border-l-4 ${item.color} bg-gray-50 rounded-r-xl p-4`}>
                  <p className="font-semibold text-gray-800 text-sm mb-1">{item.title}</p>
                  <p className="text-xs text-gray-600 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* ── 13. İletişim ve Başvuru ─────────────────── */}
          <Card>
            <SectionTitle n={13}>İletişim ve Başvuru</SectionTitle>
            <p className="text-sm text-gray-600 mb-4">
              Bu Aydınlatma Metni'ne ilişkin sorularınız, KVKK kapsamındaki hak başvurularınız
              ve veri koruma konularındaki talepleriniz için aşağıdaki kanalları kullanabilirsiniz:
            </p>
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm">
                <p className="font-semibold text-emerald-800 mb-1">Veri Koruma Sorumlusu</p>
                <a href="mailto:kvkk@modulerpazar.com" className="text-emerald-600 hover:underline">
                  kvkk@modulerpazar.com
                </a>
                <p className="text-xs text-gray-500 mt-1">KVKK başvuruları ve gizlilik soruları</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm">
                <p className="font-semibold text-blue-800 mb-1">KEP Adresi</p>
                <p className="text-blue-700 font-mono text-xs">modulerpazar@hs01.kep.tr</p>
                <p className="text-xs text-gray-500 mt-1">Hukuki geçerliliği olan resmi kanal</p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm">
                <p className="font-semibold text-gray-700 mb-1">Genel İletişim</p>
                <a href={`mailto:${SITE_CONFIG.email}`} className="text-emerald-600 hover:underline">
                  {SITE_CONFIG.email}
                </a>
                <p className="text-xs text-gray-500 mt-1">Teknik sorunlar 3-5 iş günü içinde çözülür.</p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm">
                <p className="font-semibold text-gray-700 mb-1">Yazılı Başvuru Adresi</p>
                <p className="text-gray-600 text-xs leading-relaxed">{SITE_CONFIG.address}</p>
              </div>
            </div>

            <InfoBox color="blue">
              <strong>KVKK Kurulu'na Şikâyet:</strong> Başvurunuzun tarafımızca reddedilmesi,
              verilen yanıtı yetersiz bulmanız veya süresinde yanıt verilmemesi hâlinde{' '}
              <a
                href="https://www.kvkk.gov.tr"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-medium"
              >
                Kişisel Verileri Koruma Kurulu
              </a>'na başvurma hakkınız saklıdır.
            </InfoBox>
          </Card>

          {/* Alt not */}
          <div className="text-xs text-gray-400 text-center pb-4 leading-relaxed">
            Bu metin; 6698 sayılı KVKK, 7499 sayılı Değişiklik Kanunu (12 Mart 2024),
            Aydınlatma Yükümlülüğü Tebliği, AB GDPR ilkeleri ve KVKK Kurul kararları
            gözetilerek hazırlanmıştır.{' '}
            <Link to={LEGAL_LINKS.gizlilik} className="text-emerald-600 hover:underline">
              Gizlilik Politikası
            </Link>
            {' '}·{' '}
            <Link to={LEGAL_LINKS.kullanim} className="text-emerald-600 hover:underline">
              Kullanım Koşulları
            </Link>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
