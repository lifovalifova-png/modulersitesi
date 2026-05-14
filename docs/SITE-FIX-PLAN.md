# Site Fix Plan — Faz 1

Oluşturulma: 2026-05-09

---

## Durum Özeti

| Sorun | Önem | Dosya | Durum |
|-------|------|-------|-------|
| İlan detay null crash | KRİTİK | `src/pages/IlanDetayPage.tsx:57` | ✅ Düzeltildi |
| admins koleksiyonu herkese açık | YÜKSEK | `firestore.rules` → `.proposed` | ⏳ Deploy bekliyor |
| blog/haberler yayında kontrolü yok | ORTA | `firestore.rules` → `.proposed` | ⏳ Deploy bekliyor |
| blog composite index eksik | ORTA | `firestore.indexes.json` → `.proposed` | ⏳ Deploy bekliyor |
| whatsapp tıklama doğrulaması yok | DÜŞÜK | `firestore.rules` → `.proposed` | ⏳ Deploy bekliyor |
| Seed/test verisi temizliği | DÜŞÜK | `src/scripts/clean-seed.ts` | ⏳ Manuel çalıştırma bekliyor |
| Backup sistemi yok | ORTA | `src/scripts/backup-firestore.ts` | ⏳ Secret eklenmesi bekliyor |

---

## Tamamlanan İşler (Bu Commit)

### 1. İlan Detay Null Crash Fix
- **Dosya:** `src/pages/IlanDetayPage.tsx`, satır 57-61
- **Sorun:** `ozelliklerToArray()` fonksiyonu `Object.entries(oz)` çağırıyor, `oz` undefined olabilir
- **Fix:** `if (!oz) return [];` guard eklendi
- **Risk:** Sıfır — salt savunmacı kontrol

### 2. Backup Sistemi
- **Script:** `src/scripts/backup-firestore.ts` — Firebase Admin SDK ile tüm koleksiyonları JSON'a aktarır
- **Workflow:** `.github/workflows/firestore-backup.yml` — haftalık otomatik + manuel tetikleme
- **Çıktı:** `backups/firestore-YYYY-MM-DD.json` → GitHub Artifacts (90 gün)

### 3. Firestore Rules Önerisi
- **Dosya:** `firestore.rules.proposed`
- **Değişiklikler:**
  - `admins` → `allow read: if request.auth != null && isAdmin()` (eskisi: `if true`)
  - `blog` → `allow read: if resource.data.aktif == true || isAdmin()` (eskisi: `if true`)
  - `haberler` → `allow read: if resource.data.yayinda == true || isAdmin()` (eskisi: `if true`)
  - `whatsappTiklamalari` → `allow create` alanına `firmaId` + `timestamp` zorunluluğu eklendi

### 4. Firestore Indexes Önerisi
- **Dosya:** `firestore.indexes.json.proposed`
- **Eklenen indexler:**
  - `blog`: `aktif ASC + tarih DESC` (yeni)
  - `ilanlar`: `sehir ASC + kategoriSlug ASC + status ASC` (SEO sayfaları için, yeni)
  - `firms`: `status ASC + city ASC` (harita sayfası için, yeni)

### 5. Yardımcı Scriptler
- `src/scripts/countCollections.ts` — koleksiyon belge sayımı
- `src/scripts/clean-seed.ts` — seed veri temizleme (DRY-RUN varsayılan)

### 6. Dokümantasyon
- `docs/FELAKET-KURTARMA.md` — felaket kurtarma planı
- `docs/SITE-FIX-PLAN.md` — bu dosya

---

## Senin Yapman Gerekenler (Manuel Adımlar)

### Adım 1: Firestore Rules Deploy (ÖNCELİKLİ)
```bash
# Önce proposed dosyayı incele, sonra kopyala
diff firestore.rules firestore.rules.proposed
cp firestore.rules.proposed firestore.rules
firebase deploy --only firestore:rules
```

⚠️ **DİKKAT:** `admins` kuralı değişiyor. Admin panelini deploy sonrası test et — `/admin/dashboard` açılmalı.

### Adım 2: Firestore Indexes Deploy
```bash
cp firestore.indexes.json.proposed firestore.indexes.json
firebase deploy --only firestore:indexes
```
Index build süresi: 5-15 dakika. Firebase Console → Firestore → Indexes sekmesinden durumu izle.

### Adım 3: GitHub Secret Ekle (Backup için)
1. Firebase Console → Project Settings → Service Accounts → "Generate new private key"
2. JSON'u kopyala
3. GitHub repo → Settings → Secrets → Actions → New secret:
   - İsim: `FIREBASE_SERVICE_ACCOUNT_JSON`
   - Değer: JSON içeriği
4. Test: GitHub Actions → "Firestore Weekly Backup" → "Run workflow"

### Adım 4: Seed Veri Temizliği (Opsiyonel)
```bash
# Önce DRY-RUN ile ne silinecek gör
GOOGLE_APPLICATION_CREDENTIALS=./sa.json npx tsx src/scripts/clean-seed.ts

# Onayladıktan sonra gerçek silme
GOOGLE_APPLICATION_CREDENTIALS=./sa.json npx tsx src/scripts/clean-seed.ts --confirm
```

### Adım 5: Vercel'e Deploy
```bash
git push origin main
# Vercel otomatik deploy edecek
```

---

## Faz 2 Önerileri (Gelecek)

- [ ] Firestore cascading delete (firma silinince ilanları da sil)
- [ ] Rate limiting (whatsapp tıklama, talep oluşturma)
- [ ] Cloud Functions ile otomatik bildirim
- [ ] Firestore backup'tan programatik restore scripti
- [ ] Monitoring/alerting (uptime check, error tracking)
