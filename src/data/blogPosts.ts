export type BlogKategori = 'prefabrik' | 'celik-yapi' | 'konteyner' | 'tiny-house' | 'genel';

export interface BlogPost {
  id:           number;
  slug:         string;
  baslik:       string;
  ozet:         string;
  icerik:       string; /* \n\n ile ayrılmış paragraflar; ## ile başlayanlar h2 */
  kategori:     BlogKategori;
  tarih:        string;
  okumaSuresi:  number;
  yazar:        string;
  kapakGorseli: string;
}

export const BLOG_POSTS: BlogPost[] = [
  {
    id: 1,
    slug: 'prefabrik-ev-nedir-2025-fiyatlari',
    baslik: 'Prefabrik Ev Nedir? 2025 Fiyatları ve Avantajları',
    ozet: 'Prefabrik evlerin ne olduğunu, 2025 yılı güncel fiyatlarını ve geleneksel yapılara göre avantajlarını bu kapsamlı rehberde keşfedin.',
    kategori: 'prefabrik',
    tarih: '2025-01-10',
    okumaSuresi: 7,
    yazar: 'ModülerPazar Editörü',
    kapakGorseli: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=500&fit=crop',
    icerik: `## Prefabrik Ev Nedir?

Prefabrik ev; duvar panelleri, çatı elemanları ve zemin bileşenlerinin fabrika ortamında üretilip daha sonra inşaat alanında bir araya getirildiği yapı sistemidir. "Prefabrication" (önceden üretim) kelimesinden türeyen bu kavram, Türkiye'de son on yılda büyük bir ivme kazanmıştır.

Geleneksel tuğla-çimento yapılardan farklı olarak prefabrik sistemlerde tüm elemanlar ISO standartlarında kontrollü bir üretim hattında hazırlanır. Bu durum; kaliteyi standartlaştırır, israfı en aza indirir ve kurulum süresini dramatik biçimde kısaltır.

## Prefabrik Ev Türleri

Türkiye pazarında üç temel prefabrik sistem öne çıkmaktadır. İlk olarak sandviç panel sistemler; EPS veya taş yünü dolgulu çelik sandviç panellerden oluşur, enerji verimliliği yüksek ve kurulum hızıdır. İkinci olarak ahşap iskelet (timber frame) sistemler; Kuzey Amerika ve İskandinav kökenli bu sistem, özellikle Karadeniz ikliminde tercih edilmektedir. Üçüncü olarak çelik karkas üzeri panel sistemler; deprem kuşaklarında önerilen, yüksek dayanımlı yapı sistemidir.

## 2025 Yılı Fiyat Aralıkları

2025 yılı başı itibarıyla Türkiye'de prefabrik ev m² maliyetleri aşağıdaki gibi seyretmektedir. Ekonomik segment olan sandviç panel sistemiyle 50-80 m² aralığında projeler için m² başına 8.000 - 12.000 TL arasında fiyatlar söz konusudur. Orta segment olarak 80-150 m² çelik karkas projeler için m² başına 12.000 - 18.000 TL'ye kadar çıkılabilmektedir. Üst segment olarak 150 m² ve üzeri anahtar teslim projeler için m² başına 18.000 - 30.000 TL arasında fiyatlar oluşmaktadır.

Bu fiyatlara zemin hazırlığı, altyapı bağlantıları ve iç dekorasyon dahil değildir. Anahtar teslim projelerde bu maliyetler paket fiyata yansıtılır.

## Avantajları

Hız açısından değerlendirildiğinde; geleneksel bir yapı için ortalama 12-24 ay süre gerekirken, prefabrik bir ev 45-90 günde teslim edilebilir. Zemin hazırlığı tamamlandıktan sonra montaj süreci yalnızca birkaç hafta sürmektedir.

Maliyet kontrolü açısından; fabrika ortamında üretim, malzeme savurganlığını önler. Geleneksel yapılara kıyasla toplamda %20-35 oranında tasarruf sağlanabilir. Özellikle işçilik maliyetlerindeki düşüş belirleyicidir.

Enerji verimliliği konusunda ise modern sandviç panel sistemler, A+ enerji sınıfına ulaşabilmektedir. Isı köprüsü oluşturmayan yapı kabuğu sayesinde ısıtma ve soğutma giderleri yıllık %40'a kadar azalabilir.

Taşınabilirlik de önemli bir avantajdır. Prefabrik yapının büyük bölümü söküp yeni bir araziye kurulabilir. Bu durum, kalıcı yapı izni alınamayan arazilerde geçici konut çözümü olarak da kullanılmasına imkân tanır.

## Dikkat Edilmesi Gereken Noktalar

Her çözümde olduğu gibi prefabrik yapılarda da göz önünde bulundurulması gereken bazı sınırlılıklar mevcuttur. Belediye ruhsatı zorunluluğu; prefabrik yapılar Türkiye'de yasal olarak bina niteliği taşır ve imarlı arazide inşaat ruhsatı alınması zorunludur. Ayrıca zemin etüdü gereksinimi vardır; özellikle deprem bölgelerinde temel projesinin jeolojik rapora dayalı hazırlanması gerekir. Son olarak, üretici güvencesi önemlidir; piyasada hem kaliteli hem de standart dışı üreticiler bulunmaktadır; TSE belgesi ve referans projelere mutlaka bakılmalıdır.

## Sonuç

Prefabrik ev, hızlı, ekonomik ve sürdürülebilir bir konut çözümü arayanlar için güçlü bir alternatiftir. Doğru firma seçimi ve titiz bir zemin-proje hazırlığıyla, geleneksel yapıdan daha uzun ömürlü ve konforlu bir yaşam alanı elde etmek mümkündür. ModülerPazar üzerinden Türkiye genelindeki yüzlerce onaylı prefabrik ev firmasına ulaşabilir, aynı anda birden fazla firmadan teklif alabilirsiniz.`,
  },

  {
    id: 2,
    slug: 'celik-yapi-mi-prefabrik-mi-karsilastirma',
    baslik: 'Çelik Yapı mı, Prefabrik mi? Kapsamlı Karşılaştırma',
    ozet: 'İki popüler yapı sistemini maliyet, dayanım, kurulum süresi ve kullanım alanı açısından karşılaştırıyoruz. Hangisi sizin için daha uygun?',
    kategori: 'celik-yapi',
    tarih: '2025-01-15',
    okumaSuresi: 8,
    yazar: 'ModülerPazar Editörü',
    kapakGorseli: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&h=500&fit=crop',
    icerik: `## Temel Fark Nedir?

"Prefabrik" ve "çelik yapı" terimleri zaman zaman birbirinin yerine kullanılsa da teknik açıdan farklı kavramlardır. Prefabrik; üretimin fabrikada yapılıp sahada monte edilmesini tanımlayan genel bir yöntemdir. Çelik yapı ise belirli bir malzeme sistemini —galvanizli çelik profiller ve saç kaplamalar— ifade eder.

Kısacası, bir çelik yapı aynı zamanda prefabrik olabilir; ancak tüm prefabrik yapılar çelikten yapılmaz. Ahşap karkas ya da beton panel prefabrik sistemler de yaygındır.

## Yapı Dayanımı

Sismik performans açısından değerlendirildiğinde; çelik yapılar deprem kuvvetlerini süneklikle karşıladığı için DBYBHY (Deprem Bölgelerinde Yapılacak Binalar Hakkında Yönetmelik) kapsamında birinci derece deprem bölgelerine uygundur. Marmara, Ege ve Doğu Anadolu gibi yüksek riskli bölgelerde çelik tercih açıkça öne çıkmaktadır.

Sandviç panel prefabrik sistemler ise daha çok hafif yük taşıyıcı olarak tasarlanmıştır; deprem bölgelerinde çelik karkas olmaksızın tek başına kullanımları riskli olabilir. Bu nedenle kaliteli prefabrik üreticilerinin büyük çoğunluğu panel sistemlerini çelik çerçeve üzerine oturtmaktadır.

Kar yükü dayanımı konusunda Doğu Anadolu ve Karadeniz gibi yoğun kar alan bölgelerde çelik çatı sistemleri avantajlıdır; uygun eğimle projelendirilmiş çelik çatılar 200 kg/m² üzerinde kar yükü taşıyabilir.

## Maliyet Karşılaştırması

Başlangıç yatırımı açısından; salt çelik konstrüksiyon depo veya atölye yapımı m² başına 5.000 - 8.000 TL arasındayken, iç mekan düzenlemesi içermeyen çelik iskelet konut m² başına 10.000 - 15.000 TL civarındadır. Komple anahtar teslim çelik konut ise m² başına 15.000 - 25.000 TL'dir.

Isıtma-soğutma maliyetleri açısından; iyi yalıtılmış sandviç panel prefabrik, enerji verimliliğinde avantajlıdır. Ham çelik cephe binalarda yalıtım detaylarına ekstra özen gösterilmezse ısı kaybı önemli olabilir.

Bakım giderleri açısından; galvaniz kaplı çelik yapılar düzgün koşullarda 30-50 yıl boyunca büyük bakım gerektirmez. Boya yenilemesi iklim koşullarına bağlı olarak 10-15 yılda bir gerekebilir.

## Kullanım Alanı Uygunluğu

Çelik yapı ne için idealdir sorusuna bakıldığında; ticari ve endüstriyel yapılar (depo, fabrika, atölye), geniş açıklıklı serbest alanlar gerektiren projeler, sahil veya rüzgârlı bölgeler ve çok katlı projeler için çelik yapı uygundur.

Sandviç panel prefabrik sistemi ne için idealdir sorusuna ise şu cevaplar verilebilir: Konut amaçlı tek katlı ve az katlı yapılar, sınırlı bütçeyle hızlı teslim gerektiren projeler, sezonluk kullanım yapıları ve enerji verimliliğinin öncelikli olduğu durumlar için sandviç panel tercih edilmelidir.

## Hangi Bölgede Hangisi?

İstanbul ve Marmara Bölgesi için deprem riski nedeniyle çelik karkas + mantolama sistemi önerilir. İç Anadolu için büyük sıcaklık farkları göz önünde bulundurulduğunda yüksek yalıtımlı sandviç panel uygundur. Karadeniz için yağış ve kar yüküne karşı sağlam çelik çatı sistemi şarttır. Ege ve Akdeniz için hafif çelik yapılar ya da standart panel sistemler yeterlidir.

## Sonuç

Tek bir "kazanan" yoktur; doğru seçim projenize, bütçenize ve arazinizin bulunduğu bölgenin iklim ile deprem koşullarına bağlıdır. ModülerPazar danışma asistanı, konumunuzu ve ihtiyacınızı girdikten sonra yapı tipini size önerebilir. Ayrıca her iki sistem için de onaylı firmalardan eş zamanlı teklif alabilirsiniz.`,
  },

  {
    id: 3,
    slug: 'turkiyede-tiny-house-yasami',
    baslik: "Türkiye'de Tiny House Yaşamı: Başlamadan Önce Bilinmesi Gerekenler",
    ozet: "Türkiye'de tiny house trendi hız kazanıyor. Yasal durum, maliyetler, iklim uyumluluğu ve dikkat edilmesi gereken pratik bilgileri bir araya getirdik.",
    kategori: 'tiny-house',
    tarih: '2025-01-22',
    okumaSuresi: 6,
    yazar: 'ModülerPazar Editörü',
    kapakGorseli: 'https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?w=800&h=500&fit=crop',
    icerik: `## Tiny House Hareketi Türkiye'ye Nasıl Geldi?

Amerika ve Avrupa'da 2000'li yıllardan itibaren yaygınlaşan tiny house hareketi, son beş yılda Türkiye'de de güçlü bir ivme kazandı. Yüksek konut maliyetleri, doğayla bütünleşme arzusu ve minimalist yaşam felsefesi bu trendin arkasındaki başlıca etkenlerdir.

Türkiye'deki tiny house üreticileri, bu küçük ama fonksiyonel yapıları ahşap, çelik hibrit ve modüler sistemlerle üretiyor. Boyutlar genellikle 15 m² ile 50 m² arasında değişiyor; bu da bir şehir dairesinin neredeyse onda biridir.

## Yasal Durum: Türkiye'de Tiny House'un Statüsü

Türkiye'de tiny house olgusunu doğrudan düzenleyen özel bir mevzuat henüz bulunmamaktadır. Ancak bu durum, yasal boşluk anlamına gelmez; mevcut yapı mevzuatı tiny house'ları da kapsar.

İmar Kanunu kapsamında; tiny house'lar bağımsız bir yapı niteliği taşıdığından, yerleşim alanlarındaki arazilerde inşaat ruhsatı alınması zorunludur. Tarım arazisine kurulan tiny house'lar için ise tarımsal amaçlı yapı izni süreci geçerlidir.

Tekerlekli tiny house'lar ayrı bir kategori oluşturmaktadır. Tekerlekli, yani seyyar olarak tasarlanan ve bütünüyle bir aracın üzerine inşa edilen modeller, karavan/çekici aracı statüsünde değerlendirilebilir ve böylece inşaat ruhsatı yerine araç tescili yapılabilir.

## Maliyetler

2025 yılı itibarıyla Türkiye'de tiny house fiyatları büyük ölçüde malzeme, boyut ve iç donanım düzeyine göre farklılık göstermektedir. Temel model olarak, 15-25 m², minimal iç donanım, yalnızca iskelet ve dış cephe için 180.000 - 280.000 TL arasında fiyatlar oluşmaktadır. Orta segment, 25-40 m², tam donanımlı mutfak, banyo ve yatak alanı için 280.000 - 450.000 TL arasındadır. Lüks model olarak 40-50 m², ahşap detay, akıllı ev entegrasyonu ve terası olan modeller için 450.000 - 700.000 TL ve üzeri fiyatlar söz konusudur.

Arazi maliyeti bu rakamlara dahil değildir. Kurulum yeri, ulaşım ve altyapı bağlantıları için ek bütçe ayrılması gerekmektedir.

## İklim Uyumluluğu

Türkiye'nin çeşitli iklim kuşakları, tiny house tasarımını doğrudan etkiler.

Karadeniz ve Doğu Anadolu için; yoğun yağış ve kar yüküne dayanıklı dik çatı zorunludur. Yüksek kaliteli su yalıtımı ve mantolama kritiktir. Ege ve Akdeniz için; doğal havalandırma sağlayan büyük pencereler ve gölgeleme sistemleri tavsiye edilir. İç Anadolu için; büyük sıcaklık farkları nedeniyle yüksek ısı kütleli veya iyi yalıtımlı yapı kabuğu şarttır.

## Başlamadan Önce Sormanız Gereken 5 Soru

Birinci soru olarak araziyi satın aldınız mı yoksa kiraladınız mı? Kiralık arazilerde uzun vadeli güvence için noter onaylı kira sözleşmesi şarttır. İkinci olarak, arazi imar durumu nedir? Konut, tarım veya orman vasfındaki arazilerde farklı kurallar geçerlidir. Üçüncü olarak, altyapı bağlantıları mevcut mu? Elektrik, su ve kanalizasyon bağlantıları kuruluma önemli maliyet ekler. Dördüncü olarak, yıl boyunca mı yoksa mevsimlik mi kullanacaksınız? Bu sorunun cevabı yalıtım ve ısıtma sistemini belirler. Beşinci olarak, hangi üretici ile çalışıyorsunuz? Referansları, TSE belgeleri ve garanti koşullarını mutlaka kontrol edin.

## Sonuç

Türkiye'de tiny house yaşamı, doğru planlama yapıldığında son derece tatmin edici ve ekonomik bir alternatif sunmaktadır. Yasal süreçleri baştan netleştirmek ve iklim koşullarına uygun bir tasarım seçmek, uzun vadede çıkacak sorunların önüne geçer. ModülerPazar üzerinde onaylı tiny house üreticilerine ulaşabilir ve aynı anda birden fazla firmadan teklif alabilirsiniz.`,
  },

  {
    id: 4,
    slug: 'konteyner-ev-nasil-yapilir',
    baslik: 'Konteyner Ev Nasıl Yapılır? Adım Adım Rehber',
    ozet: 'Nakliye konteynerlerinden konut yapımı Türkiye\'de giderek yaygınlaşıyor. Proje aşamasından teslimata kadar tüm süreci anlattık.',
    kategori: 'konteyner',
    tarih: '2025-01-28',
    okumaSuresi: 7,
    yazar: 'ModülerPazar Editörü',
    kapakGorseli: 'https://images.unsplash.com/photo-1565183997392-2f6f122e5912?w=800&h=500&fit=crop',
    icerik: `## Neden Konteyner Ev?

ISO standartlı yük konteynerleri, yüzlerce ton yükü taşıyacak şekilde tasarlanmış, son derece sağlam çelik kutulardır. Bu konteynerlerin konut amaçlı dönüştürülmesi —"container home" ya da "cargotecture"— hem çevresel sürdürülebilirlik hem de yaratıcı mimari açısından ilgi çekici bir seçenektir.

Türkiye'de nakliye konteyneri dönüşümünün yaygınlaşmasının ardında üç temel etken vardır: limanlarımızda bol miktarda ikinci el konteyner bulunması, çelik yapıya olan toplumsal güven ve kısa teslim süreleri.

## Adım 1: Konteyner Seçimi

Standart boyutlar açısından değerlendirildiğinde; 20 fit konteyner 5,90 × 2,35 × 2,39 metre iç ölçüleriyle yaklaşık 14 m² kullanım alanı sunar. 40 fit konteyner ise 12,03 × 2,35 × 2,39 metre ölçüleriyle yaklaşık 28 m² kullanım alanı sağlar. High cube (yüksek tavanlı) modeller standartlardan 30 cm daha yüksektir ve iç mekân konforunu artırır.

Sıfır konteyner veya ikinci el konteynerleri değerlendirirken; sıfır konteyner yüksek maliyet ama garantili kalite sunarken, ikinci el konteyner düşük başlangıç maliyeti ancak pas ve deformasyon riski taşıyabilir. Satın almadan önce mutlaka fiziksel muayene yapın.

## Adım 2: Arazi ve Ruhsat

Türkiye'de konteyner ev; prefabrik ya da çelik yapıdan farklı bir yasal statüye sahip değildir. İmarlı arazide inşaat ruhsatı şarttır. Temel proje mimarlar odası onaylı bir mühendis tarafından hazırlanmalıdır.

Konteynerler yapı ruhsatı alındıktan sonra beyan edilmiş boyutlarla kurulur; sonradan yapılan eklentiler için ek ruhsat gerekir.

## Adım 3: Temel Hazırlığı

Konteyner evler genellikle beton ayak (nokta temel) ya da sürekli beton temel üzerine oturtulur. Hangi temel tipinin seçileceği zemin etüdü raporuna göre belirlenir. Zemin kayma veya oturma riski olan arazilerde kazıklı temel uygulanabilir.

## Adım 4: Dönüşüm İşlemleri

Yalıtım aşamasında; çelik kutu doğası gereği ısıyı hızla iletir. Bu nedenle hem iç hem dış yalıtım kritiktir. Polyurethane (PU) püskürtme ya da taş yünü ile en az 100 mm yalıtım önerilir.

Kapı-pencere açılımlarında; çeliğin kesildiği kısımlar yapısal destekle güçlendirilmelidir. Özellikle büyük cam yüzeylerde taşıyıcı çerçeve hesabı yapılmalıdır.

Tesisat aşamasında; elektrik, su tesisatı ve ısıtma sistemleri standart binalarda olduğu gibi kurulur. Çelik yüzeyde kondansasyon riskine karşı nem bariyeri uygulaması ihmal edilmemelidir.

Cephe kaplama aşamasında ise; estetik ve ek yalıtım için ahşap kaplama, metal panel veya sıva uygulanabilir. Bazı projeler ham çelik görünümü ile farklı bir estetik yaratmayı tercih eder.

## Adım 5: Maliyetler

Tek konteyner dönüşümü için bütçe (20 fit, temel dahil, anahtar teslim); ikinci el konteyner + dönüşüm için 150.000 - 250.000 TL, yeni konteyner + dönüşüm için 250.000 - 400.000 TL arasındadır.

Çok konteynerli projeler için bütçe ise, iki 40 fit konteyner birleştirmesi 500.000 - 900.000 TL olup projenin karmaşıklığına göre büyük farklılık gösterir.

## Dikkat Edilmesi Gereken Noktalar

Nem ve korozyon yönetimi çok kritiktir; deniz kıyısı veya nemli bölgelerde galvanoiz boya ve düzenli bakım zorunludur. Ses yalıtımı konusunda ise çelik yapı, taş binaya kıyasla gürültüyü daha fazla iletir; dolayısıyla akustik yalıtım ekstra dikkat gerektirir. Yeniden satış değeri açısından konteyner evlerin geleneksel yapılara göre ikinci el piyasası henüz gelişmemiştir; bu husus uzun vadeli yatırım planlamasında dikkate alınmalıdır.

## Sonuç

Konteyner ev; doğru planlama, kaliteli yalıtım ve uzman firma seçimiyle hem estetik hem de ekonomik bir yaşam alanı sunabilir. ModülerPazar'da alanında uzman onaylı konteyner dönüşüm firmalarını inceleyebilir ve tek tıkla birden fazlasından teklif alabilirsiniz.`,
  },

  {
    id: 5,
    slug: 'sehre-gore-yapi-tipi-iklim-rehberi',
    baslik: "Şehre Göre En Uygun Yapı Tipi: İklim ve Zemin Rehberi",
    ozet: "Türkiye'nin farklı iklim ve zemin koşullarına göre hangi yapı tipinin tercih edilmesi gerektiğini bölge bölge açıklıyoruz.",
    kategori: 'genel',
    tarih: '2025-02-03',
    okumaSuresi: 8,
    yazar: 'ModülerPazar Editörü',
    kapakGorseli: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=500&fit=crop',
    icerik: `## Neden Şehir Bazlı Yapı Seçimi?

Türkiye; bir uçta Doğu Anadolu'nun sert karasal iklimi, öte uçta Akdeniz'in subtropikal sıcaklıkları ve Karadeniz'in yoğun yağışıyla son derece çeşitli bir iklim coğrafyasına sahiptir. Bu çeşitlilik, yapı seçimini ve tasarımını doğrudan etkiler.

Yalnızca estetiğe veya fiyata bakarak yapı tipi seçmek uzun vadede ciddi sorunlara yol açabilir. Yanlış yalıtım sistemi, uygun olmayan çatı eğimi ya da yetersiz deprem detayı; hem konforunu hem de yapının ömrünü kısaltır.

## Marmara Bölgesi (İstanbul, Bursa, Kocaeli, Tekirdağ)

Deprem riski, bu bölgedeki en belirleyici etkendir. Marmara Denizi kuzeyinde aktif fay hatları nedeniyle 1. derece deprem bölgesi olarak sınıflandırılmaktadır.

Önerilen yapı tipi: Çelik karkas veya çelik karkas üzeri sandviç panel. Çelik yapılar sünekliği sayesinde deprem enerjisini yayar. Nemli iklim için su yalıtımına özel önem verilmeli, çatı eğimi en az %30 olmalıdır. Mantolama zorunludur.

## Ege Bölgesi (İzmir, Muğla, Aydın, Denizli)

Akdeniz iklimiyle benzer özellikler taşıyan bu bölge; kışları ılık ve yağışlı, yazları kurak ve sıcaktır. İzmir başta olmak üzere deprem riski Marmara'ya benzer yüksekliktedir.

Önerilen yapı tipi: Hafif çelik veya ahşap hibrit sistem. Yazın aşırı ısınmayı önlemek için geniş saçaklar, dışa taşan çatılar ve doğal havalandırma sağlayan çift cephe tasarımı avantajlıdır. EPS yerine taş yünü ile yalıtım tercih edilmeli; nem ve ısı dayanımı dengesi gözetilmelidir.

## Akdeniz Bölgesi (Antalya, Mersin, Hatay)

En sıcak bölgelerimizden biri olan Akdeniz kıyılarında yazın 40°C'yi aşan sıcaklıklar ve yüksek nem hâkimdir.

Önerilen yapı tipi: Beyaz ya da açık renkli cepheli hafif çelik veya EPS sandviç panel. Güneş kontrol camları ve güneşlik sistemleri zorunludur. Çatı; hem yağmur suyu yönetimi hem de çatı boşluğu havalandırması için dikkatli tasarlanmalıdır. Deniz kıyısı projelerinde korozyona karşı galvaniz ve özel boya detayı şarttır.

## Karadeniz Bölgesi (Trabzon, Rize, Samsun, Giresun)

Türkiye'nin en yağışlı bölgesi olup bazı ilçelerde yıllık yağış 2000 mm'yi aşmaktadır. Nem, bitki örtüsü ve toprak kayması bu bölgenin temel yapı zorluklarıdır.

Önerilen yapı tipi: Eğimli çatılı çelik karkas veya ahşap karkas yapı. Çatı eğimi en az %45 olmalıdır; yatay veya az eğimli çatılar Karadeniz'de kullanılamaz. Su yalıtımı tüm yapı kabuğu boyunca sürekli olmalı; zemin yalıtımı ve temel drenajı ihmal edilmemelidir.

## İç Anadolu (Ankara, Konya, Kayseri, Sivas)

Büyük günlük ve mevsimsel sıcaklık farkları (-20°C ile +35°C arası) ve düşük nem bu bölgenin özelliğidir.

Önerilen yapı tipi: Yüksek yalıtım değerli sandviç panel veya çelik karkas + XPS mantolama. Isı köprüsü oluşturmayan detaylar kritik önem taşır. Yoğuşmayı önlemek için buhar kesici katman ihmal edilmemelidir. Donma-çözülme döngülerine dayanıklı temel ve cephe malzemeleri seçilmelidir.

## Doğu Anadolu (Erzurum, Kars, Ağrı, Van)

Türkiye'nin en sert iklim koşullarına sahip bölgesidir. Kar yükü, soğuk ve deprem riski birlikte değerlendirilmelidir.

Önerilen yapı tipi: Sağlam çelik karkas + yüksek performanslı taş yünü yalıtım. Çatı eğimi kar tahliyesi için 45-60° arasında olmalıdır. Tüm pencere ve kapılar üçlü cam ve ısı yalıtımlı doğrama ile seçilmelidir. Zemin donmasına (frost) karşı temel derinliği hesaplanmalıdır.

## Sonuç

Türkiye'de yapı tipi seçimi; yalnızca bütçe değil, yaşanacak bölgenin iklim ve zemin koşulları gözetilerek yapılmalıdır. ModülerPazar'ın Yapı Asistanı, şehrinizi ve ihtiyacınızı girdikten sonra size özel öneri sunabilir. Onaylı firmalardan eş zamanlı teklif alarak en uygun çözümü kolayca karşılaştırabilirsiniz.`,
  },

  {
    id: 6,
    slug: 'moduler-yapilarda-dask-ve-sigorta',
    baslik: 'Modüler Yapılarda DASK ve Sigorta: Bilmeniz Gerekenler',
    ozet: 'Prefabrik ev, konteyner veya tiny house için DASK yaptırabilir misiniz? Hangi sigortalar gerekli? Tüm merak edilenleri yanıtladık.',
    kategori: 'genel',
    tarih: '2025-02-10',
    okumaSuresi: 6,
    yazar: 'ModülerPazar Editörü',
    kapakGorseli: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=500&fit=crop',
    icerik: `## DASK Nedir ve Kimler Yaptırmak Zorunda?

Doğal Afet Sigortaları Kurumu (DASK), Türkiye'de yaşanan büyük depremlerin ardından 1999 yılında kurulmuştur. DASK zorunlu deprem sigortasını yönetmekte ve Türkiye'deki tüm konut binalarını kapsamaktadır.

Yasal yükümlülük açısından; belediye sınırları içindeki mesken niteliğindeki bağımsız birimlerde DASK zorunludur. Elektrik, su, doğalgaz aboneliği ve tapu işlemlerinde DASK poliçesi istenebilir.

## Modüler Yapılar DASK Kapsamında Mı?

Bu sorunun yanıtı, yapının tapu ve ruhsat durumuna bağlıdır.

Tapu ve inşaat ruhsatı olan modüler yapılar için; imarlı arazide inşaat ruhsatıyla yapılmış prefabrik evler, çelik yapılar ve konteyner evler DASK kapsamındadır. Sigorta bedeli tapu yüz ölçümü ve yapım tarzına göre hesaplanır.

Tapusuz veya ruhsatsız yapılar için; bu durumda DASK yaptırılamaz. Bu husus, ruhsatsız yapıya ev sahibi olmayı caydırıcı kılan başlıca etkenlerden biridir. Olası bir afet sonrasında devlet desteğinden ve sigorta tazminatından yararlanmak mümkün olmaz.

Seyyar tiny house'lar için; araç tescili yapılmış tekerlekli tiny house'lar taşınmaz değil, taşıt statüsündedir; bu nedenle DASK yerine araç sigortası ve ihtiyarî kasko uygulanır.

## Modüler Yapı için Hangi Sigortalar Gerekli?

DASK (Zorunlu Deprem Sigortası): Yukarıda açıklandığı gibi ruhsatlı mesken yapılar için zorunludur.

Konut Sigortası (İhtiyarî): DASK'ın karşılamadığı yangın, sel, fırtına, hırsızlık, cam kırılması ve üçüncü şahıslara verilen zararları kapsar. Modüler yapılar için özellikle yangın riski değerlendirmesi dikkatli yapılmalıdır; çelik yapı yanmaz ancak içindeki malzemeler yanabilir.

İnşaat All-Risk Sigortası: Yapım aşamasındaki riskleri (montaj kazası, malzeme hasarı, üçüncü şahıs zararı) karşılar. Büyük projelerde taşeron veya firma tarafından yapılması önerilir.

## DASK Primini Etkileyen Faktörler

DASK prim hesabında; binanın bulunduğu deprem tehlike bölgesi, yapım tarzı (çelik, ahşap, betonarme), binanın alanı (m²) ve binanın inşa yılı etkilidir. Çelik yapılar DASK tarifesinde genellikle "çelik karkas" kategorisine girer ve betonarmeden farklı bir prim oranı uygulanabilir.

## Sıkça Yapılan Hatalar

Hasar bedelini düşük beyan etmek önemli bir hatadır; bu durumda "eksik sigorta" koşulu devreye girer ve tazminat orantılı olarak azalır. Poliçe adresini güncel tutmamak da sorun yaratabilir; taşınma veya yapıda değişiklik olduğunda sigorta şirketine bildirim yapılmalıdır. Son olarak, sigorta primini son güne bırakmak da yaygın bir hatadır; poliçe, deprem anında geçerli olmalıdır; günlük başlangıç tarihli poliçe 24 saat sonra devreye girer.

## Sonuç

Modüler yapılarda sigorta; geleneksel binayla özünde aynı mantığa dayanır. Önemli olan, yapınızın yasal statüsünün net olması ve poliçenizin bu statüye uygun şekilde düzenlenmesidir. İnşaat sürecini ModülerPazar üzerinden belgeli ve onaylı bir firma ile yürütmek, hem sigorta hem de ruhsat süreçlerini kolaylaştırır.`,
  },

  {
    id: 7,
    slug: 'prefabrik-ev-izinleri-ruhsat-surecleri',
    baslik: "2025'te Prefabrik Ev İzinleri: Ruhsat Süreçleri",
    ozet: 'Prefabrik ev yaptırmadan önce hangi izinleri almanız gerekiyor? Ruhsat süreci nasıl işliyor? Adım adım rehber.',
    kategori: 'prefabrik',
    tarih: '2025-02-14',
    okumaSuresi: 7,
    yazar: 'ModülerPazar Editörü',
    kapakGorseli: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=500&fit=crop',
    icerik: `## Prefabrik Ev İçin Ruhsat Gerekiyor mu?

Sıkça sorulan bu sorunun cevabı kesinlikle evet'tir. Türkiye İmar Kanunu (3194 sayılı) çerçevesinde prefabrik yapılar, geleneksel betonarme ya da yığma yapılarla aynı hukuki statüdedir. Belediye sınırları içinde veya mücavir alanda yapı yapılabilmesi için inşaat ruhsatı alınması zorunludur.

Ruhsatsız yapı; cezai yaptırımlar, yıkım kararı ve tapu tescil sorunlarıyla karşılaşılmasına neden olabilir. Bu riskler, prefabrik konut sahiplerinin en çok göz ardı ettiği noktalardandır.

## Yasal Çerçeve

İmar Kanunu madde 21 gereğince; her türlü yapı için inşaat ruhsatı zorunludur. İstisnalar; 25 m²'yi geçmeyen tek katlı müstakil yapılar ve bazı köy ve orman alanlarında uygulanan muafiyetlerdir (ancak bunların da koşulları oldukça sınırlıdır).

Planlı Alanlar İmar Yönetmeliği, prefabrik yapılara özel bir kısıtlama getirmemektedir. Ancak arazinin imar planındaki fonksiyonu belirleyicidir: konut, ticaret, tarım ya da orman alanı gibi sınıflandırmaların her birinde farklı yapı koşulları geçerlidir.

## Ruhsat Başvurusu: Adım Adım

İlk adım olarak tapu ve imar durumu belgesi edinme gerekir. Tapu senedi veya tapu kayıt örneğiyle belediyeden imar durumu belgesi alınır; bu belge, arazide kaç kat ve ne kadar alan inşa edilebileceğini gösterir.

İkinci adımda mimari proje hazırlatma işlemi yapılır. Mimar veya mühendis tarafından hazırlanan proje; kat planları, cephe görünüşleri ve vaziyet planını kapsar. Prefabrik sistemlerde üretici firma genellikle bu projeyi hazırlar.

Üçüncü adımda zemin etüdü ve statik proje alınır. Zemin etüdü raporu jeoloji mühendisi tarafından hazırlanır. Statik proje (hesap dosyası), yapı taşıyıcı sistemini belgeler ve inşaat mühendisi onayına sunulur.

Dördüncü adımda belediyeye başvuru yapılır. Proje dosyası, zemin etüdü, statik proje ve tapu bilgileriyle belediye imar müdürlüğüne başvurulur. Belediyelere bağlı olarak ek belge talep edilebilir.

Beşinci adımda harç ödemesi ve ruhsat alımı gerçekleştirilir. Proje uygun bulunursa inşaat harcı hesaplanır ve ruhsat düzenlenir. Bu aşama ortalama 15-60 iş günü sürebilir; büyük belediyelerde dijital süreçlerle çok daha kısa sürebilmektedir.

Altıncı adımda yapı denetimi başlar. İnşaat başladıktan sonra yapı denetim kuruluşu süreci izler; temel, bodrum, taşıyıcı sistem ve çatı aşamaları belgelenir.

Yedinci adım olarak iskan (yapı kullanma izni) belgesi alınır. Yapı tamamlandığında belediye tarafından yerinde denetim yapılır ve uygunsa iskan belgesi düzenlenir. Bu belge olmadan yapı tapuya bağımsız bölüm olarak kaydedilemez ve DASK yaptırılamaz.

## Maliyetler

İnşaat ruhsatı harçları; belediyeye, arazinin bulunduğu bölgeye ve yapı inşaat alanına göre değişmekle birlikte genellikle toplam proje maliyetinin %1-3'ü arasında hesaplanmaktadır. Proje hazırlama ücretleri ise projenin büyüklüğüne bağlı olarak 20.000 - 80.000 TL arasında değişebilmektedir.

## Sık Yapılan Hatalar

Ön proje yapmadan arazi almak ciddi bir hatadır; bazı araziler imar planlarında konut yapımına uygun değildir. Tarım arazisine konut inşa etmek de yasal değildir; tarımsal amaçlı yapı olabilir ancak konut olarak kullanılamaz. Prefabrik üreticisinin ruhsat alacağını sanmak da yanılgı yaratabilir; ruhsat sorumluluğu arazi sahibine aittir, üretici proje hazırlamaya yardımcı olabilir ancak yasal yükümlülük sahibi değildir.

## Sonuç

Prefabrik ev sahibi olmak, ruhsat süreçleri doğru yönetildiğinde geleneksel yapıdan çok daha hızlı ve sorunsuz bir deneyim sunar. ModülerPazar üzerinden onaylı firmalarla çalışmak; hem proje hazırlama hem de ruhsat süreçlerinde deneyimli yönlendirme almanızı kolaylaştırır.`,
  },

  {
    id: 8,
    slug: 'ahsap-celik-yapi-karsilastirmasi',
    baslik: 'Ahşap ve Çelik Yapı Karşılaştırması: Hangisi Daha Dayanıklı?',
    ozet: 'İki köklü yapı malzemesini dayanım, maliyet, estetik ve çevresel etki açısından karşılaştırıyoruz.',
    kategori: 'celik-yapi',
    tarih: '2025-02-20',
    okumaSuresi: 7,
    yazar: 'ModülerPazar Editörü',
    kapakGorseli: 'https://images.unsplash.com/photo-1510627489930-0c1b0bfb6785?w=800&h=500&fit=crop',
    icerik: `## İki Köklü Malzeme: Ahşap ve Çelik

Ahşap ve çelik, modüler yapı sektörünün iki temel malzemesidir. Her ikisi de prefabrik sistemlere uyarlanabilir, her ikisinin de güçlü ve zayıf yönleri vardır. Hangisinin "daha dayanıklı" olduğu sorusu, aslında "hangi koşulda?" sorusuna bağlıdır.

Bu karşılaştırmada altı temel başlık ele alınmaktadır: deprem dayanımı, yangına dayanıklılık, nem ve korozyon direnci, ısı performansı, estetik-esneklik ve çevresel etki.

## Deprem Dayanımı

Çelik açısından değerlendirildiğinde; çelik sünektir, yani deprem enerjisini kırılmadan absorbe edebilir. Bu özellik, birinci derece deprem bölgelerinde çeliği tercih edilen malzeme yapar. Düzgün boyutlandırılmış bir çelik karkas, yüzde binlerce birim şekil değiştirme kapasitesine sahiptir.

Ahşap açısından ise; doğru tasarlanmış ahşap çerçeve yapılar da depreme karşı iyi performans gösterebilir. Kuzey Amerika ve Japonya gibi yüksek deprem riskli bölgelerde ahşap karkas (platform frame) yaygın olarak kullanılmaktadır. Ancak türkiye mevzuatı ve geleneksel yapı kültürü bu sistemlere henüz tam adapte olmamıştır.

Sonuç: Deprem performansı açısından çelik avantajlı; ancak doğru detaylandırılmış ahşap da rekabetçi bir alternatiftir.

## Yangına Dayanıklılık

Çelik 500°C üzerinde taşıyıcılık kapasitesini kaybetmeye başlar. Bu nedenle büyük çelik yapılarda yangına dayanıklı kaplama (yangın boya veya alçı levha) uygulanması zorunludur.

Ahşap paradoks gibi görünse de kontrollü biçimde yanar. Büyük kesitli (masif) ahşap elemanlar, yüzeylerinde oluşan kömür katmanı sayesinde iç çekirdeklerini uzun süre korur; bu özellik "charring" olarak bilinir ve hesaplanabilir bir davranıştır. Küçük kesitli ahşap ise hızla yanar ve taşıyıcılığını erken kaybeder.

Sonuç: Yangına dayanıklılık; tasarıma, kesit büyüklüğüne ve uygulanan koruyucu sistemlere bağlıdır. Her iki malzeme de uygun önlemlerle kabul edilebilir yangın performansı gösterebilir.

## Nem ve Korozyon

Çelik, korumasız bırakıldığında oksijenle reaksiyona girerek paslanır. Galvaniz kaplama, özel boya veya paslanmaz çelik kullanımıyla bu risk kontrol altına alınabilir. Denize yakın ve nemli bölgelerde titiz bir yüzey koruma programı şarttır.

Ahşap ise nem emme ve salma döngüsüne bağlı olarak çatlayabilir, boyut değiştirerek şişip çekebilir ve uzun vadede çürüyebilir. Emprenye işlemi ve yüzey koruma ürünleriyle bu riskler azaltılabilir.

Sonuç: Korozyon yönetimi gerektiren nemli ve tuzlu hava ortamlarında çelik, doğru bakımla daha öngörülebilir bir performans sunar.

## Isı Performansı

Çelik, yüksek ısı iletkenliğine sahiptir. Bu da yalıtım detaylarının çok titiz yapılmasını gerektirmek anlamına gelir; ısı köprüleri yapı performansını ciddi biçimde bozabilir.

Ahşap ise doğal bir yalıtkan olup ısı iletkenliği çeliğin çok altındadır. Bu özellik, ahşap karkas yapılarda enerji verimliliğini doğrudan destekler.

Sonuç: Isı performansı açısından ahşap üstündür; ancak çelik yapılarda yeterli yalıtım detayıyla bu dezavantaj giderilerbilir.

## Estetik ve Tasarım Esnekliği

Çelik; geniş açıklık, büyük cam yüzey ve endüstriyel estetik arayan projeler için idealdir. Taşıyıcı olmayan iç duvarlar kolayca değiştirilebilir.

Ahşap; sıcak, doğal ve organik bir atmosfer yaratır. Tarihi Japon mimarlığından İskandinav tarzına kadar pek çok estetik kodla uyumludur.

Sonuç: Estetik tercih tamamen öznel olup projenin hedef kullanımına bağlıdır. Endüstriyel ve ticari projeler için çelik; doğa içindeki konutlar için ahşap daha uygun bir dil sunar.

## Çevresel Etki

Çelik üretimi; enerji yoğun bir süreçtir ve önemli miktarda CO₂ salımına neden olur. Ancak geri dönüştürülebilirliği yüksektir; piyasadaki çeliğin büyük bölümü daha önce kullanılmış hurdadan üretilmektedir.

Ahşap ise büyüdükçe karbon depolayan yenilenebilir bir malzemedir. Sürdürülebilir orman yönetiminden gelen ahşap, yaşam döngüsü boyunca karbon ayak izini düşük tutar.

Sonuç: Karbon ayak izi açısından sürdürülebilir kaynaklı ahşap öne çıkar; ancak çeliğin geri dönüşüm potansiyeli bu farkı daraltmaktadır.

## Özet Tablo

Deprem performansında çelik avantajlıdır. Yangın direncinde her ikisi de tasarıma bağlı olarak kabul edilebilir düzeydedir. Nem ve korozyonda çelik (bakımlı) avantajlıdır. Isı performansında ahşap avantajlıdır. Estetik esneklikte her iki malzeme de güçlüdür. Çevresel etkide ahşap (sürdürülebilir kaynaklı) avantajlıdır.

## Sonuç

"Hangisi daha dayanıklı?" sorusunun tek bir yanıtı yoktur. Doğru malzeme; projenizin lokasyonuna, iklim koşullarına, bütçenize ve estetik beklentinize göre belirlenir. ModülerPazar'da hem ahşap hem de çelik yapı konusunda uzmanlaşmış onaylı firmalardan eş zamanlı teklif alarak en uygun seçimi kendi koşullarınıza göre yapabilirsiniz.`,
  },
];
