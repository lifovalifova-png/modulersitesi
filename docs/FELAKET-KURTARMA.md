# Felaket Kurtarma Planı — ModülerPazar

Son güncelleme: 2026-05-09

---

## 1. Firestore Veritabanı Kaybı

### Senaryo: Yanlışlıkla koleksiyon silme veya veri bozulması

**Önleme:**
- Haftalık otomatik backup: `.github/workflows/firestore-backup.yml`
- Manuel backup: `GOOGLE_APPLICATION_CREDENTIALS=./sa.json npx tsx src/scripts/backup-firestore.ts`
- Backup dosyaları: `backups/firestore-YYYY-MM-DD.json` (GitHub Artifacts, 90 gün saklanır)

**Kurtarma:**
1. Son backup JSON dosyasını indirin (GitHub Actions → Artifacts)
2. Backup dosyasını açın ve etkilenen koleksiyonu bulun
3. Firebase Console → Firestore → koleksiyon seçin
4. Belgeleri tek tek veya toplu olarak geri yükleyin
5. Alternatif: Admin SDK ile programatik restore scripti yazın

### Senaryo: Firestore tamamen erişilemez

1. Firebase Status Dashboard'u kontrol edin: https://status.firebase.google.com/
2. Vercel Environment Variables'da Firebase config'i doğrulayın
3. Son çalışan backup'tan yeni bir Firestore instance'a restore edin

---

## 2. Vercel Deployment Hatası

### Senaryo: Site 404 veriyor

1. `vercel.json` dosyasını kontrol edin — `buildCommand` ve `outputDirectory` kaybolmuş olabilir
2. Vercel Dashboard → Deployments → son başarılı deployment'a rollback yapın
3. Lokal olarak `pnpm build:prod` çalıştırıp hata olmadığını doğrulayın
4. `vercel --prod` ile tekrar deploy edin

### Senaryo: Domain DNS sorunu

1. Vercel Dashboard → Domains → DNS ayarlarını kontrol edin
2. `dig modulerpazar.com` ile DNS çözümlemesini doğrulayın
3. Propagation 48 saate kadar sürebilir

---

## 3. Firebase Auth Sorunu

### Senaryo: Kullanıcılar giriş yapamıyor

1. Firebase Console → Authentication → ayarları kontrol edin
2. Authorized domains listesinde `modulerpazar.com` ve `modulerpazar.vercel.app` olduğundan emin olun
3. Google Sign-In OAuth consent screen'i kontrol edin
4. `src/lib/firebase.ts` config değerlerini Firebase Console ile karşılaştırın

---

## 4. Admin Erişimi Kaybı

### Senaryo: Admin paneline erişilemiyor

1. Firebase Console → Firestore → `admins` koleksiyonu
2. Admin kullanıcının UID'sinin bir document ID olarak mevcut olduğunu doğrulayın
3. Yoksa Firebase Console üzerinden manuel olarak ekleyin:
   - Koleksiyon: `admins`
   - Belge ID: kullanıcının Firebase Auth UID'si
   - Veri: `{ email: "admin@example.com" }` (zorunlu değil ama referans için)

---

## 5. API Fonksiyonları Çalışmıyor

### Senaryo: `/api/*` endpointleri 500 veriyor

1. Vercel Dashboard → Functions → log'ları kontrol edin
2. Environment variables'ı kontrol edin:
   - `ANTHROPIC_API_KEY` (haber AI pipeline için)
3. `vercel.json` rewrites'ta `/api/(.*)` kuralının mevcut olduğunu doğrulayın

---

## 6. İletişim Bilgileri

| Servis | Dashboard |
|--------|-----------|
| Firebase | https://console.firebase.google.com/project/modulerpazar |
| Vercel | https://vercel.com/dashboard |
| Google Analytics | GA4 Property: G-KK8YBNMNL7 |
| EmailJS | https://dashboard.emailjs.com |

---

## 7. Acil Durum Kontrol Listesi

- [ ] Site erişilebilir mi? → `curl -I https://modulerpazar.com`
- [ ] Firestore bağlantısı var mı? → Tarayıcı konsolunda hata kontrolü
- [ ] Auth çalışıyor mu? → Giriş sayfasını test et
- [ ] Son backup ne zaman alındı? → GitHub Actions → workflow runs
- [ ] Son başarılı deploy ne zaman? → Vercel Dashboard
