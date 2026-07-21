## SEO Kritik Bulgu (20 Temmuz 2026, GSC canlı test kanıtlı)

Blog gövdeleri Firestore'da (13/13, backfill tamamlandı) ve kullanıcı
tarayıcısında görünüyor. Ancak GSC "Canlı URL'yi Test Et" ile alınan
render edilmiş HTML'de blog gövdesi yerine sadece yükleme iskeleti
(.animate-pulse div'leri, "width: 100%/90%/95%..." placeholder'ları)
yakalanıyor. Kanıt: BlogDetayPage.tsx içindeki getDoc(doc(db,'blog',slug))
çağrısı asenkron; Googlebot'un render bütçesi bu süreyi karşılamıyor.
Sonuç: blog içeriği kullanıcı için var, arama motoru için PRATİKTE YOK
— yalnız <title>/<meta description> indeksleniyor, gövde metni değil.

Test URL: https://www.modulerpazar.com/blog/sehre-gore-yapi-tipi-iklim-rehberi
Doğrulama yöntemi: GSC → URL Denetimi → Canlı URL'yi Test Et → HTML sekmesi

## Yapılacak (öncelikli, ayrı görev)

Blog rotaları (/blog/{slug}) için build-time prerender/statik üretim.
Tam SSR'a geçmeden dar kapsamlı çözüm tercih edilir — örn. build
script'i her blog slug'ı için Firestore'dan icerik çekip
dist/blog/{slug}/index.html'e gömer. Kapsam SADECE blog rotaları,
sitenin geri kalanı SPA kalabilir.
