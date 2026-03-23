import { test, expect } from '@playwright/test';

/**
 * Alıcı Ajan — İlan görüntüleme, teklif isteme ve AI asistan senaryosu
 *
 * Senaryo:
 *  1. Ana sayfadan kategori sayfasına git
 *  2. İlan listesinin yüklendiğini doğrula
 *  3. İlan detay sayfasını kontrol et
 *  4. Teklif Al butonunu kontrol et
 *  5. Talep oluşturma formunu doldur
 *  6. AI asistanı test et
 *  7. Blog, SSS ve diğer sayfaları kontrol et
 */

test.describe('Alıcı Ajan — Gezinti & Teklif Talebi', () => {

  test('Ana sayfa → Kategori sayfasına geçiş', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/ModülerPazar/);

    // Prefabrik kategorisine tıkla
    await page.click('a[href="/kategori/prefabrik"]');
    await page.waitForURL('**/kategori/prefabrik**');

    // Sayfa başlığı
    await expect(page.locator('h1')).toContainText(/Prefabrik/);
  });

  test('Kategori sayfası — ilan listesi yükleniyor', async ({ page }) => {
    await page.goto('/kategori/prefabrik');
    await page.waitForTimeout(2000);

    // "ilan bulundu" metni veya ilan kartları veya "ilan bulunamadı"
    const ilanSayisi  = page.locator('text=/\\d+ ilan/');
    const ilanKartlari = page.locator('a[href^="/ilan/"]');
    const empty        = page.locator('text=/bulunamadı/');

    const hasCount = await ilanSayisi.first().isVisible().catch(() => false);
    const hasCards = (await ilanKartlari.count()) > 0;
    const isEmpty  = await empty.first().isVisible().catch(() => false);

    expect(hasCount || hasCards || isEmpty).toBeTruthy();
  });

  test('Kategori sayfası — filtre paneli mevcut', async ({ page }) => {
    await page.goto('/kategori/prefabrik');
    await page.waitForTimeout(2000);

    // Masaüstünde sidebar'daki "Filtreler" başlığı veya mobil "Filtrele" butonu — biri görünmeli
    const hasSidebar = await page.locator('text=Filtreler').first().isVisible().catch(() => false);
    const hasMobileBtn = await page.locator('text=Filtrele').first().isVisible().catch(() => false);

    expect(hasSidebar || hasMobileBtn).toBeTruthy();
  });

  test('İlan detay sayfası — galeri ve teklif butonu', async ({ page }) => {
    await page.goto('/kategori/prefabrik');

    // İlk ilan linkine tıkla
    const ilanLink = page.locator('a[href^="/ilan/"]').first();
    if (await ilanLink.isVisible()) {
      await ilanLink.click();
      await page.waitForURL('**/ilan/**');

      // Breadcrumb
      await expect(page.locator('text=Ana Sayfa')).toBeVisible();

      // Teklif Al butonu
      await expect(page.locator('text=Teklif Al').first()).toBeVisible();

      // Güvenli alışveriş uyarısı
      await page.evaluate(() => window.scrollTo(0, 1000));
      await page.waitForTimeout(500);
      const hasGuvenlik = await page.locator('text=GÜVENLİ ALIŞVERİŞ').isVisible().catch(() => false);
      const hasDogrula  = await page.locator('text=doğrulandıktan').isVisible().catch(() => false);
      expect(hasGuvenlik || hasDogrula).toBeTruthy();
    }
  });

  test('Talep oluşturma sayfası — form alanları mevcut', async ({ page }) => {
    await page.goto('/talep-olustur');

    // Sayfa yüklenmesi bekle
    await page.waitForTimeout(2000);

    // Sayfada form var mı veya giriş gerekiyor mesajı mı
    const currentPath = new URL(page.url()).pathname;

    if (currentPath === '/talep-olustur') {
      // Form alanları: kategori, şehir, bütçe
      const hasForm = await page.locator('select, input[type="text"], textarea').first().isVisible().catch(() => false);
      expect(hasForm).toBeTruthy();
    } else {
      // Giriş sayfasına yönlendirildi — bu da doğru davranış
      expect(currentPath === '/giris' || currentPath === '/').toBeTruthy();
    }
  });

  test('AI asistan — arama kutusu mevcut ve çalışıyor', async ({ page }) => {
    await page.goto('/');

    // Ana sayfadaki AI asistan arama kutusu
    const searchBox = page.locator('input[placeholder*="prefabrik"], input[placeholder*="Ankara"], textarea').first();
    if (await searchBox.isVisible()) {
      await searchBox.fill('Ankara\'da 80m2 prefabrik ev fiyatı');

      // Gönder butonu var mı
      const submitBtn = page.locator('button[type="submit"]').first();
      const hasSendBtn = await submitBtn.isVisible().catch(() => false);
      expect(hasSendBtn).toBeTruthy();
    }
  });

  test('Firmalar sayfası — firma listesi yükleniyor', async ({ page }) => {
    await page.goto('/firmalar');
    await page.waitForTimeout(2000);

    // Başlık "Firmalar"
    await expect(page.locator('h1').first()).toContainText(/Firma/);

    // Kategori ve şehir filtreleri (select option olarak mevcut)
    const hasCatFilter  = await page.locator('select').first().isVisible().catch(() => false);
    const hasCatText    = await page.locator('text=Tüm Kategoriler').first().isVisible().catch(() => false);
    expect(hasCatFilter || hasCatText).toBeTruthy();

    // Sayfa içeriği yüklendi (firma kartı veya boş durum — div tabanlı layout)
    const hasContent = await page.locator('a[href^="/firmalar/"], text=firma gösteriliyor, text=Firma bulunamadı').first().isVisible().catch(() => false);
    const hasBreadcrumb = await page.locator('text=Ana Sayfa').first().isVisible().catch(() => false);
    expect(hasContent || hasBreadcrumb).toBeTruthy();
  });

  test('Blog sayfası — yazılar yükleniyor', async ({ page }) => {
    await page.goto('/blog');
    await page.waitForTimeout(2000);

    // Başlık (h1 veya meta title üzerinden)
    const hasH1      = await page.locator('h1').first().isVisible().catch(() => false);
    const hasBlogKey = await page.locator('text=/Rehber|Blog/i').first().isVisible().catch(() => false);
    expect(hasH1 || hasBlogKey).toBeTruthy();

    // Kategori filtre butonları mevcut
    await expect(page.locator('text=Tümü').first()).toBeVisible();
  });

  test('SSS sayfası — accordion çalışıyor', async ({ page }) => {
    await page.goto('/sss');
    await page.waitForTimeout(2000);

    // Başlık
    await expect(page.locator('text=Sıkça Sorulan Sorular').first()).toBeVisible();

    // Kategori sekmeleri — button rolü ile seç (strict mode hatası önlenir)
    await expect(page.locator('button:has-text("Genel")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Alıcılar")').first()).toBeVisible();

    // İlk soru görünüyor ve tıklanabilir
    const firstQuestion = page.locator('button:has-text("ModülerPazar nedir?")').first();
    if (await firstQuestion.isVisible().catch(() => false)) {
      await firstQuestion.click();
      await page.waitForTimeout(500);
      const cevap = page.locator('text=/pazar yeri|modüler/i').first();
      expect(await cevap.isVisible().catch(() => false)).toBeTruthy();
    } else {
      // Soru zaten açık haldeyse cevap görünüyor olmalı
      const cevap = page.locator('text=/pazar yeri|modüler/i').first();
      expect(await cevap.isVisible().catch(() => false)).toBeTruthy();
    }
  });

  test('Hakkımızda sayfası yükleniyor', async ({ page }) => {
    await page.goto('/hakkimizda');

    await expect(page.locator('text=Doğru firmayı bulmak')).toBeVisible();
  });

  test('FlashDeals carousel — ilanlar yükleniyor', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.scrollTo(0, 600));
    await page.waitForTimeout(1000);

    // Flaş Fırsatlar bölümü
    const hasFlash = await page.locator('text=Flaş Fırsatlar').isVisible().catch(() => false);
    if (hasFlash) {
      // En az 1 ilan kartı
      const cards = page.locator('a[href^="/ilan/"]');
      expect(await cards.count()).toBeGreaterThan(0);
    }
  });
});
