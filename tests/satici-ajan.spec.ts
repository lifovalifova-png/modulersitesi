import { test, expect } from '@playwright/test';

/**
 * Satıcı Ajan — Firma kayıt ve ilan oluşturma senaryosu
 *
 * Senaryo:
 *  1. Ana sayfa yükleniyor mu?
 *  2. Kayıt sayfasına git, "Satıcı/Firma" seç
 *  3. Kayıt formu alanlarını kontrol et
 *  4. Firma paneli route guard çalışıyor mu?
 *  5. İlan oluşturma sayfası alanlarını kontrol et
 *  6. Form validasyonları (zorunlu alan, fiyat limiti) çalışıyor mu?
 */

test.describe('Satıcı Ajan — Firma Kayıt & İlan Oluşturma', () => {

  test('Ana sayfa yükleniyor', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/ModülerPazar/);
    // Hero section başlık
    await expect(page.locator('h1')).toContainText(/Modüler Yapı/);
    // Header var
    await expect(page.locator('header')).toBeVisible();
  });

  test('Kayıt sayfası — Satıcı/Firma seçimi çalışıyor', async ({ page }) => {
    await page.goto('/kayit');

    // Kayıt başlığı — h1 ile spesifik seç (strict mode: sayfada birden fazla "Kayıt Ol" var)
    await expect(page.locator('h1').filter({ hasText: 'Kayıt Ol' })).toBeVisible();

    // Hesap tipi seçenekleri görünüyor
    await expect(page.locator('text=Alıcı').first()).toBeVisible();
    await expect(page.locator('text=Satıcı / Firma').first()).toBeVisible();

    // Satıcı/Firma seç
    await page.locator('text=Satıcı / Firma').first().click();

    // E-posta alanı görünüyor
    await expect(page.locator('input[type="email"]').first()).toBeVisible();
  });

  test('Kayıt formu — email ve şifre alanları mevcut', async ({ page }) => {
    await page.goto('/kayit');

    // E-posta alanı
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();

    // Şifre alanı
    const passwordInput = page.locator('input[type="password"]').first();
    await expect(passwordInput).toBeVisible();

    // Google ile kayıt butonu
    await expect(page.locator('text=Google')).toBeVisible();
  });

  test('Firma paneli — giriş yapmadan erişilemez (route guard)', async ({ page }) => {
    await page.goto('/firma-paneli');

    // Route guard yönlendirmesi — ana sayfaya veya giriş sayfasına gitmeli
    await page.waitForURL(url => {
      const path = new URL(url).pathname;
      return path === '/' || path === '/giris';
    }, { timeout: 10000 });

    // Firma paneli açılmamalı
    const currentPath = new URL(page.url()).pathname;
    expect(currentPath !== '/firma-paneli').toBeTruthy();
  });

  test('Satıcı formu sayfası — çok adımlı form yükleniyor', async ({ page }) => {
    await page.goto('/satici-formu');

    // Başlık
    await expect(page.locator('text=Ücretsiz Kayıt Ol').first()).toBeVisible();

    // Adım göstergesi — rounded-full içindeki "1" (strict mode: .first() ile)
    await expect(page.locator('.rounded-full:has-text("1"), [class*="rounded-full"]:has-text("1")').first()).toBeVisible();

    // Firma Türü alanı
    await expect(page.locator('text=Firma Türü').first()).toBeVisible();
  });

  test('İlan oluşturma sayfası — giriş kontrolü', async ({ page }) => {
    await page.goto('/ilan-olustur');

    // Giriş yapmadan ilan oluşturma sayfasına erişilemez
    // Ya yönlendirir ya da giriş uyarısı gösterir
    await page.waitForTimeout(3000);

    const currentPath = new URL(page.url()).pathname;
    // Giriş sayfasına yönlendirilmeli VEYA sayfada giriş uyarısı olmalı
    const redirected = currentPath === '/giris' || currentPath === '/';
    const hasLoginPrompt = await page.locator('text=Giriş Yap').isVisible().catch(() => false);

    expect(redirected || hasLoginPrompt).toBeTruthy();
  });

  test('Kategori verileri doğru yükleniyor', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    // Kategori bağlantıları anasayfada mevcut (href ile kontrol — text eşleşmesinden daha güvenilir)
    const categoryLinks = page.locator('a[href^="/kategori/"]');
    const count = await categoryLinks.count();
    expect(count).toBeGreaterThanOrEqual(5);

    // En az 2 kategori linki tıklanabilir durumda (href ile daha güvenilir)
    const prefabrik = await page.locator('a[href="/kategori/prefabrik"]').first().isVisible().catch(() => false);
    const tinyHouse = await page.locator('a[href="/kategori/tiny-house"]').first().isVisible().catch(() => false);
    expect(prefabrik || tinyHouse).toBeTruthy();
  });

  test('Footer iletişim bilgileri doğru', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    // E-posta
    await expect(page.locator('text=modulerpazar@yandex.com').last()).toBeVisible();

    // Adres
    await expect(page.locator('text=Maslak').last()).toBeVisible();
  });
});
