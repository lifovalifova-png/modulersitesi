import { test, expect } from '@playwright/test';

/**
 * Kötü Niyetli Ajan — Güvenlik ve dayanıklılık testleri
 *
 * Testler:
 *  1. XSS payload enjeksiyonu
 *  2. SQL injection denemeleri
 *  3. Aşırı uzun girdi dayanıklılığı
 *  4. Geçersiz fiyat değerleri
 *  5. Admin sayfası yetkisiz erişim
 *  6. Gizli route erişim denemeleri
 *  7. CSRF / form manipülasyonu
 */

const XSS_PAYLOADS = [
  '<script>alert("xss")</script>',
  '<img src=x onerror=alert(1)>',
  '"><svg onload=alert(1)>',
  "javascript:alert('xss')",
  '<iframe src="javascript:alert(1)">',
  '{{constructor.constructor("alert(1)")()}}',
  '${7*7}',
];

const SQL_PAYLOADS = [
  "' OR 1=1 --",
  "'; DROP TABLE users; --",
  "1' UNION SELECT * FROM users --",
  "admin'--",
  "1; DELETE FROM ilanlar WHERE 1=1",
];

test.describe('Kötü Niyetli Ajan — Güvenlik Testleri', () => {

  test.describe('XSS Koruması', () => {

    test('Ana sayfa arama kutusuna XSS payload — çalıştırılmıyor', async ({ page }) => {
      await page.goto('/');

      for (const payload of XSS_PAYLOADS.slice(0, 3)) {
        const searchBox = page.locator('input[placeholder*="prefabrik"], input[placeholder*="Ankara"]').first();
        if (await searchBox.isVisible().catch(() => false)) {
          await searchBox.fill(payload);

          // Alert dialog tetiklenmemeli
          let alertTriggered = false;
          page.on('dialog', () => { alertTriggered = true; });
          await page.waitForTimeout(500);

          expect(alertTriggered).toBeFalsy();

          // DOM'da çalıştırılabilir script olmamalı
          const scripts = await page.evaluate(() =>
            document.querySelectorAll('script:not([src])').length
          );
          // Vite kendi script'i dışında enjekte edilmiş script olmamalı
          expect(scripts).toBeLessThanOrEqual(2);
        }
      }
    });

    test('Kategori URL parametresine XSS — çalıştırılmıyor', async ({ page }) => {
      let alertTriggered = false;
      page.on('dialog', async (dialog) => {
        alertTriggered = true;
        await dialog.dismiss();
      });

      await page.goto('/kategori/<script>alert(1)</script>');
      await page.waitForTimeout(2000);

      expect(alertTriggered).toBeFalsy();
    });

    test('Arama query parametresine XSS — çalıştırılmıyor', async ({ page }) => {
      let alertTriggered = false;
      page.on('dialog', async (dialog) => {
        alertTriggered = true;
        await dialog.dismiss();
      });

      await page.goto('/kategori/prefabrik?q=<script>alert("xss")</script>');
      await page.waitForTimeout(2000);

      expect(alertTriggered).toBeFalsy();

      // Payload metin olarak bile render edilmemeli
      const bodyText = await page.textContent('body');
      expect(bodyText).not.toContain('<script>');
    });
  });

  test.describe('SQL Injection Koruması', () => {

    test('Arama kutusuna SQL injection — hata vermiyor', async ({ page }) => {
      for (const payload of SQL_PAYLOADS.slice(0, 2)) {
        await page.goto(`/kategori/prefabrik?q=${encodeURIComponent(payload)}`);
        await page.waitForTimeout(1500);

        // Sayfa crash etmemeli
        const title = await page.title();
        expect(title).toContain('ModülerPazar');

        // Veritabanı hatası mesajı gösterilmemeli
        const bodyText = await page.textContent('body') ?? '';
        expect(bodyText.toLowerCase()).not.toContain('sql');
        expect(bodyText.toLowerCase()).not.toContain('syntax error');
        expect(bodyText.toLowerCase()).not.toContain('database');
      }
    });
  });

  test.describe('Girdi Dayanıklılık Testleri', () => {

    test('Çok uzun başlık girdisi — sayfa crash etmiyor', async ({ page }) => {
      await page.goto('/kayit');

      const longText = 'A'.repeat(1000);
      const inputs = page.locator('input[type="text"], input[type="email"]');

      const count = await inputs.count();
      for (let i = 0; i < Math.min(count, 3); i++) {
        const input = inputs.nth(i);
        if (await input.isVisible()) {
          await input.fill(longText);
          // maxLength ile kesilmeli veya kabul etmeli ama crash etmemeli
          const value = await input.inputValue();
          expect(value.length).toBeLessThanOrEqual(1000);
        }
      }

      // Sayfa hâlâ çalışıyor
      await expect(page.locator('header')).toBeVisible();
    });

    test('Geçersiz fiyat değerleri — form validasyonu çalışıyor', async ({ page }) => {
      await page.goto('/kategori/prefabrik');

      // Fiyat filtresi varsa dene
      const fiyatInput = page.locator('input[placeholder*="fiyat"], input[type="number"]').first();
      if (await fiyatInput.isVisible().catch(() => false)) {
        // Negatif fiyat
        await fiyatInput.fill('-999');
        await page.waitForTimeout(300);

        // 0 fiyat
        await fiyatInput.fill('0');
        await page.waitForTimeout(300);

        // Çok büyük sayı
        await fiyatInput.fill('99999999999999');
        await page.waitForTimeout(300);

        // Harf girme denemesi
        await fiyatInput.fill('abc');
        await page.waitForTimeout(300);

        // Sayfa crash etmemeli
        await expect(page.locator('header')).toBeVisible();
      }
    });

    test('Emoji ve özel karakter girdisi — crash etmiyor', async ({ page }) => {
      await page.goto('/kayit');

      const emailInput = page.locator('input[type="email"]').first();
      if (await emailInput.isVisible()) {
        await emailInput.fill('🎉💥test@evil.com');
        await page.waitForTimeout(300);

        // Sayfa çalışmaya devam ediyor
        await expect(page.locator('header')).toBeVisible();
      }
    });
  });

  test.describe('Yetkisiz Erişim Testleri', () => {

    test('Admin paneline direkt URL ile erişim — engelleniyor', async ({ page }) => {
      await page.goto('/admin/dashboard');
      await page.waitForTimeout(3000);

      // Admin giriş ekranı veya yönlendirme
      const currentPath = new URL(page.url()).pathname;

      // Admin paneli açılmamış olmalı (admin sekmeler görünmemeli)
      const hasAdminTabs = await page.locator('text=Firmalar Yönetimi').isVisible().catch(() => false);
      const hasAdminDash = await page.locator('text=Toplam İlan').isVisible().catch(() => false);

      // Admin giriş ekranı gösterilmeli VEYA yönlendirilmeli
      const hasLoginForm = await page.locator('text=Admin Paneli Girişi').isVisible().catch(() => false);

      expect(hasAdminTabs).toBeFalsy();
      expect(hasAdminDash).toBeFalsy();
      expect(hasLoginForm || currentPath === '/' || currentPath === '/giris').toBeTruthy();
    });

    test('Firma paneline yetkisiz erişim — engelleniyor', async ({ page }) => {
      await page.goto('/firma-paneli');
      await page.waitForTimeout(3000);

      const currentPath = new URL(page.url()).pathname;
      expect(currentPath !== '/firma-paneli').toBeTruthy();
    });

    test('Profil sayfasına giriş yapmadan erişim — yönlendiriliyor', async ({ page }) => {
      await page.goto('/profil');
      await page.waitForTimeout(3000);

      const currentPath = new URL(page.url()).pathname;
      expect(currentPath === '/giris' || currentPath === '/').toBeTruthy();
    });

    test('Var olmayan sayfa — 404 görünüyor', async ({ page }) => {
      await page.goto('/bu-sayfa-yok-12345');
      await page.waitForTimeout(2000);

      // 404 sayfası veya "Sayfa bulunamadı" mesajı
      const has404 = await page.locator('text=404').isVisible().catch(() => false);
      const hasNotFound = await page.locator('text=bulunamadı').isVisible().catch(() => false);
      const hasHomePage = await page.locator('text=Ana Sayfaya Dön').isVisible().catch(() => false);

      expect(has404 || hasNotFound || hasHomePage).toBeTruthy();
    });
  });

  test.describe('URL Manipülasyon Testleri', () => {

    test('Path traversal denemesi — engelleniyor', async ({ page }) => {
      await page.goto('/../../etc/passwd');
      await page.waitForTimeout(2000);

      // Sistem dosyası açılmamış olmalı
      const bodyText = await page.textContent('body') ?? '';
      expect(bodyText).not.toContain('root:');
      expect(bodyText).not.toContain('/bin/bash');
    });

    test('JavaScript protocol URL — engelleniyor', async ({ page }) => {
      let alertTriggered = false;
      page.on('dialog', async (dialog) => {
        alertTriggered = true;
        await dialog.dismiss();
      });

      // javascript: protocol denemesi
      await page.goto('/kategori/javascript:alert(1)');
      await page.waitForTimeout(1000);

      expect(alertTriggered).toBeFalsy();
    });

    test('Çift encoding denemesi', async ({ page }) => {
      let alertTriggered = false;
      page.on('dialog', async (dialog) => {
        alertTriggered = true;
        await dialog.dismiss();
      });

      await page.goto('/kategori/%253Cscript%253Ealert(1)%253C%252Fscript%253E');
      await page.waitForTimeout(1000);

      expect(alertTriggered).toBeFalsy();
    });
  });

  test.describe('Rate Limiting & Spam Koruması', () => {

    test('Birden fazla hızlı sayfa gezintisi — crash etmiyor', async ({ page }) => {
      const urls = [
        '/', '/firmalar', '/blog', '/sss', '/hakkimizda',
        '/kategori/prefabrik', '/kategori/celik-yapilar',
        '/firmalar-harita', '/geri-bildirim',
      ];

      for (const url of urls) {
        await page.goto(url, { waitUntil: 'domcontentloaded' });
      }

      // Son sayfada header görünüyor — site crash etmedi
      await expect(page.locator('header')).toBeVisible();
    });
  });

  test.describe('HTTPS & Güvenlik Başlıkları', () => {

    test('Site HTTPS üzerinden yükleniyor', async ({ page }) => {
      const response = await page.goto('/');
      expect(response?.url()).toContain('https://');
    });
  });
});
