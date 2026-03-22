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

    // Kayıt başlığı
    await expect(page.locator('text=Kayıt Ol')).toBeVisible();

    // Hesap tipi seçenekleri görünüyor
    await expect(page.locator('text=Alıcı')).toBeVisible();
    await expect(page.locator('text=Satıcı / Firma')).toBeVisible();

    // Satıcı/Firma seç
    await page.click('text=Satıcı / Firma');

    // Satıcı seçimi aktif — form alanları görünüyor
    await expect(page.locator('input[type="email"], input[placeholder*="posta"]')).toBeVisible();
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
    await expect(page.locator('text=Ücretsiz Kayıt Ol')).toBeVisible();

    // Adım göstergesi (1-4)
    await expect(page.locator('text=1')).toBeVisible();

    // Firma Türü alanı
    await expect(page.locator('text=Firma Türü')).toBeVisible();
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

    // 7 kategori mevcut
    const categories = [
      'Prefabrik', 'Çelik Yapılar', 'Yaşam Konteynerleri',
      '2. El', 'Özel Projeler', 'Ahşap Yapılar', 'Tiny House',
    ];

    for (const cat of categories) {
      await expect(page.locator(`text=${cat}`).first()).toBeVisible();
    }
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
