# Haftalık Sağlık Raporu

Prod siteyi (`www.modulerpazar.com`) **salt okunur** smoke testiyle izler. Hiçbir form submit / POST / Firestore yazma yoktur; secret gerekmez.

## Ne izleniyor (`tests/smoke-prod.spec.ts`)
- Ana sayfa 200 döner ve `<title>` "ModülerPazar" içerir
- Çerez banner görünür (Kabul Et / Reddet)
- `/firmalar` render olur
- `/nasil-kullanilir` render olur
- Ana sayfada beklenmeyen konsol hatası yok (3rd-party gürültüsü hariç)

## Ne zaman
- Cron: her **Pazartesi 09:00 TR** (`0 6 * * 1` UTC) — `.github/workflows/weekly-health.yml`
- Manuel: GitHub → Actions → "Haftalık Sağlık Raporu" → **Run workflow** (workflow_dispatch)

## FAIL olursa
- `health-fail` etiketli bir issue açılır (aynı gün için açık issue varsa yorum eklenir)
- Playwright HTML raporu çalıştırma sayfasında **playwright-report** artifact'ı olarak yüklenir (30 gün)
- Başarılıysa issue açılmaz
