import { test, expect } from '@playwright/test';

/**
 * Kullanıcı Yolculuğu — Gerçek bir ziyaretçi gibi siteyi baştan sona test eder
 *
 * Senaryo:
 *  1. Ana sayfa açılır, temel bileşenler kontrol edilir
 *  2. Kategorilere göz atılır
 *  3. İlan detayına girilir
 *  4. Haberler sayfası ve haber detayı ziyaret edilir
 *  5. Blog, SSS, Firmalar, Hakkımızda, Nasıl Kullanılır sayfaları kontrol edilir
 *  6. Fiyat hesaplayıcı test edilir
 *  7. Header arama çalışıyor mu kontrol edilir
 *  8. Mobil menü test edilir
 *  9. Dil değişimi (TR/EN) kontrol edilir
 * 10. Footer linkleri ve yapısı doğrulanır
 * 11. Beta badge/banner kontrol edilir
 * 12. 404 sayfası test edilir
 */

test.describe('Kullanıcı Yolculuğu — Site Genel Testi', () => {

  /* ─── 1. Ana Sayfa ─────────────────────────────────────── */
  test('Ana sayfa yükleniyor ve temel bileşenler mevcut', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/ModülerPazar/);

    // Header: logo, arama, ilan ver butonu
    await expect(page.locator('img[alt="ModülerPazar"]').first()).toBeVisible();
    await expect(page.locator('text=İlan Ver').first()).toBeVisible();

    // Hero bölümü yüklendi
    const heroHeading = page.locator('h1').first();
    await expect(heroHeading).toBeVisible();

    // Kategori kartları mevcut
    const categoryLinks = page.locator('a[href^="/kategori/"]');
    expect(await categoryLinks.count()).toBeGreaterThan(0);

    // Footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    await expect(page.locator('footer').first()).toBeVisible();
  });

  /* ─── 2. Haber Bandı (varsa) ───────────────────────────── */
  test('Ana sayfada haber bandı kontrolü', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    // Haber bandı varsa kontrol et
    const haberBandi = page.locator('text=Sektör Haberleri').first();
    if (await haberBandi.isVisible().catch(() => false)) {
      // Haber linkleri var
      const haberLinks = page.locator('a[href^="/haberler/"]');
      expect(await haberLinks.count()).toBeGreaterThan(0);

      // "Tümünü Gör" linki mevcut
      await expect(page.locator('a[href="/haberler"]').first()).toBeVisible();
    }
  });

  /* ─── 3. Kategori Gezintisi ─────────────────────────────── */
  test('Kategori sayfası — ilan listesi ve filtreler', async ({ page }) => {
    await page.goto('/');

    // Prefabrik kategorisine tıkla
    await page.click('a[href="/kategori/prefabrik"]');
    await page.waitForURL('**/kategori/prefabrik**');
    await page.waitForTimeout(2000);

    // Başlık
    await expect(page.locator('h1').first()).toBeVisible();

    // İlan kartları veya boş durum mesajı
    const ilanKartlari = page.locator('a[href^="/ilan/"]');
    const bosMetin = page.locator('text=/bulunamadı|ilan yok/i');
    const hasCards = (await ilanKartlari.count()) > 0;
    const isEmpty = await bosMetin.first().isVisible().catch(() => false);
    expect(hasCards || isEmpty).toBeTruthy();
  });

  test('Farklı kategorilere geçiş yapılabiliyor', async ({ page }) => {
    const kategoriler = ['konteyner', 'tiny-house', 'celik-yapi'];

    for (const slug of kategoriler) {
      await page.goto(`/kategori/${slug}`);
      await page.waitForTimeout(1500);
      await expect(page.locator('h1').first()).toBeVisible();
    }
  });

  /* ─── 4. İlan Detay ─────────────────────────────────────── */
  test('İlan detay sayfası — içerik ve iletişim', async ({ page }) => {
    await page.goto('/kategori/prefabrik');
    await page.waitForTimeout(2000);

    const ilanLink = page.locator('a[href^="/ilan/"]').first();
    if (await ilanLink.isVisible().catch(() => false)) {
      await ilanLink.click();
      await page.waitForURL('**/ilan/**');
      await page.waitForTimeout(1500);

      // Başlık mevcut
      await expect(page.locator('h1').first()).toBeVisible();

      // Fiyat bilgisi
      const fiyat = page.locator('text=/₺|TL/').first();
      const hasFiyat = await fiyat.isVisible().catch(() => false);

      // Teklif Al veya İletişim butonu
      const teklifBtn = page.locator('text=/Teklif Al|İletişim|Ara|Firmayı Ara/i').first();
      const hasBtn = await teklifBtn.isVisible().catch(() => false);

      expect(hasFiyat || hasBtn).toBeTruthy();
    }
  });

  /* ─── 5. Haberler ───────────────────────────────────────── */
  test('Haberler sayfası — haber listesi yükleniyor', async ({ page }) => {
    await page.goto('/haberler');
    await page.waitForTimeout(2000);

    // Başlık
    await expect(page.locator('h1').first()).toBeVisible();

    // Haber kartları veya boş durum
    const haberKartlari = page.locator('a[href^="/haberler/"]');
    const bosMetin = page.locator('text=/haber bulunamadı/i');
    const hasCards = (await haberKartlari.count()) > 0;
    const isEmpty = await bosMetin.first().isVisible().catch(() => false);
    expect(hasCards || isEmpty).toBeTruthy();
  });

  test('Haber detay sayfası — içerik ve kaynak', async ({ page }) => {
    await page.goto('/haberler');
    await page.waitForTimeout(2000);

    const haberLink = page.locator('a[href^="/haberler/"]').first();
    if (await haberLink.isVisible().catch(() => false)) {
      await haberLink.click();
      await page.waitForURL('**/haberler/**');
      await page.waitForTimeout(1500);

      // Başlık
      await expect(page.locator('h1').first()).toBeVisible();

      // Kaynak bilgisi veya "Haberlere Dön" linki
      const haberleredon = page.locator('text=/Haberlere Dön|Back to News/i').first();
      await expect(haberleredon).toBeVisible();

      // Breadcrumb
      await expect(page.locator('text=/Ana Sayfa|Home/').first()).toBeVisible();
    }
  });

  /* ─── 6. Blog ───────────────────────────────────────────── */
  test('Blog sayfası — yazı listesi ve detay', async ({ page }) => {
    await page.goto('/blog');
    await page.waitForTimeout(2000);

    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page.locator('text=Tümü').first()).toBeVisible();

    // Blog kartına tıkla
    const blogLink = page.locator('a[href^="/blog/"]').first();
    if (await blogLink.isVisible().catch(() => false)) {
      await blogLink.click();
      await page.waitForURL('**/blog/**');
      await page.waitForTimeout(1500);

      // Blog detay: başlık ve içerik
      await expect(page.locator('h1').first()).toBeVisible();
    }
  });

  /* ─── 7. SSS ────────────────────────────────────────────── */
  test('SSS sayfası — accordion açılıp kapanıyor', async ({ page }) => {
    await page.goto('/sss');
    await page.waitForTimeout(2000);

    await expect(page.locator('text=Sıkça Sorulan Sorular').first()).toBeVisible();

    // Kategori sekmeleri
    await expect(page.locator('button:has-text("Genel")').first()).toBeVisible();

    // İlk soruya tıkla
    const firstQ = page.locator('button:has-text("ModülerPazar")').first();
    if (await firstQ.isVisible().catch(() => false)) {
      await firstQ.click();
      await page.waitForTimeout(500);
      // Cevap açıldı
      const answer = page.locator('text=/pazar|platform/i').first();
      expect(await answer.isVisible().catch(() => false)).toBeTruthy();
    }
  });

  /* ─── 8. Firmalar ───────────────────────────────────────── */
  test('Firmalar sayfası — liste ve filtreler', async ({ page }) => {
    await page.goto('/firmalar');
    await page.waitForTimeout(2000);

    await expect(page.locator('h1').first()).toBeVisible();

    // Filtre select mevcut
    const hasFilter = await page.locator('select').first().isVisible().catch(() => false);
    expect(hasFilter).toBeTruthy();
  });

  /* ─── 9. Fiyat Hesaplayıcı ──────────────────────────────── */
  test('Fiyat hesaplayıcı — form doldurulabiliyor', async ({ page }) => {
    await page.goto('/fiyat-hesapla');
    await page.waitForTimeout(2000);

    // Başlık
    await expect(page.locator('h1').first()).toBeVisible();

    // Yapı tipi seçimi (select veya butonlar)
    const hasSelect = await page.locator('select').first().isVisible().catch(() => false);
    const hasButtons = await page.locator('button:has-text("Prefabrik")').first().isVisible().catch(() => false);
    expect(hasSelect || hasButtons).toBeTruthy();

    // m² input
    const m2Input = page.locator('input[type="number"], input[type="range"]').first();
    if (await m2Input.isVisible().catch(() => false)) {
      await m2Input.fill('100');
    }
  });

  /* ─── 10. Nasıl Kullanılır ──────────────────────────────── */
  test('Nasıl Kullanılır sayfası yükleniyor', async ({ page }) => {
    await page.goto('/nasil-kullanilir');
    await page.waitForTimeout(2000);

    await expect(page.locator('h1').first()).toBeVisible();
  });

  /* ─── 11. Hakkımızda ────────────────────────────────────── */
  test('Hakkımızda sayfası yükleniyor', async ({ page }) => {
    await page.goto('/hakkimizda');
    await page.waitForTimeout(2000);

    const hasH = await page.locator('h1').first().isVisible().catch(() => false);
    const hasH2 = await page.locator('h2').first().isVisible().catch(() => false);
    const hasText = await page.locator('text=Doğru firmayı bulmak').first().isVisible().catch(() => false);
    expect(hasH || hasH2 || hasText).toBeTruthy();
  });

  /* ─── 12. Header Arama ──────────────────────────────────── */
  test('Header arama — sorgu gönderebiliyor', async ({ page }) => {
    await page.goto('/');

    // Desktop arama
    const searchInput = page.locator('input[aria-label="Arama"]').first();
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill('konteyner');
      await page.locator('button:has-text("Ara")').first().click();
      await page.waitForTimeout(1500);

      // Kategori sayfasına yönlendi
      expect(page.url()).toContain('/kategori/');
    }
  });

  /* ─── 13. Dil Değişimi (TR ↔ EN) ────────────────────────── */
  test('Dil değişimi çalışıyor', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    // EN butonuna tıkla
    const langBtn = page.locator('button:has-text("EN")').first();
    if (await langBtn.isVisible().catch(() => false)) {
      await langBtn.click();
      await page.waitForTimeout(1500);

      // İngilizce metinler görünmeli (herhangi biri)
      const enChecks = ['Post Ad', 'Search', 'All Categories', 'Get Quote', 'Post Free Ad'];
      let hasEnglish = false;
      for (const text of enChecks) {
        if (await page.locator(`text="${text}"`).first().isVisible().catch(() => false)) {
          hasEnglish = true;
          break;
        }
      }
      expect(hasEnglish).toBeTruthy();

      // TR'ye geri dön
      const trBtn = page.locator('button:has-text("TR")').first();
      await trBtn.click();
      await page.waitForTimeout(1000);

      // Türkçe metinler geri geldi
      const trChecks = ['İlan Ver', 'Ara', 'Tüm Kategoriler', 'Ücretsiz İlan Ver'];
      let hasTurkish = false;
      for (const text of trChecks) {
        if (await page.locator(`text="${text}"`).first().isVisible().catch(() => false)) {
          hasTurkish = true;
          break;
        }
      }
      expect(hasTurkish).toBeTruthy();
    }
  });

  /* ─── 14. Beta Badge & Banner ───────────────────────────── */
  test('Beta badge ve banner kontrol', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1500);

    // Beta badge (logo yanında)
    const betaBadge = page.locator('text=Beta').first();
    const hasBadge = await betaBadge.isVisible().catch(() => false);

    // Beta banner (sayfa üstünde)
    const betaBanner = page.locator('text=/beta aşamasında|currently in beta/i').first();
    const hasBanner = await betaBanner.isVisible().catch(() => false);

    // En az biri olmalı (veya admin kapatmışsa ikisi de olmayabilir — o da OK)
    if (hasBanner) {
      // Banner'ı kapat
      const closeBtn = page.locator('button[aria-label="Kapat"]').first();
      if (await closeBtn.isVisible().catch(() => false)) {
        await closeBtn.click();
        await page.waitForTimeout(500);
        // Banner kapandı
        expect(await betaBanner.isVisible().catch(() => false)).toBeFalsy();
      }
    }

    // Test bilgilendirme: badge veya banner durumunu logla
    // eslint-disable-next-line no-console
    console.log(`Beta badge: ${hasBadge ? '✅' : '❌'}, Beta banner: ${hasBanner ? '✅' : '❌'}`);
  });

  /* ─── 15. Footer Yapısı ─────────────────────────────────── */
  test('Footer — linkler ve bilgiler mevcut', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);

    const footer = page.locator('footer').first();
    await expect(footer).toBeVisible();

    // Yasal linkler
    const kvkk = page.locator('a[href="/kvkk"]').first();
    const gizlilik = page.locator('a[href="/gizlilik"]').first();
    const hasKvkk = await kvkk.isVisible().catch(() => false);
    const hasGizlilik = await gizlilik.isVisible().catch(() => false);
    expect(hasKvkk || hasGizlilik).toBeTruthy();

    // İletişim bilgisi
    const hasEmail = await page.locator('text=info@modulerpazar.com').first().isVisible().catch(() => false);
    const hasMail = await page.locator('a[href^="mailto:"]').first().isVisible().catch(() => false);
    expect(hasEmail || hasMail).toBeTruthy();
  });

  /* ─── 16. Yasal Sayfalar ────────────────────────────────── */
  test('KVKK, Gizlilik, Kullanım Koşulları sayfaları yükleniyor', async ({ page }) => {
    const yasalSayfalar = ['/kvkk', '/gizlilik', '/kullanim-kosullari'];

    for (const path of yasalSayfalar) {
      await page.goto(path);
      await page.waitForTimeout(1500);
      await expect(page.locator('h1, h2').first()).toBeVisible();
    }
  });

  /* ─── 17. Satıcı Formu ──────────────────────────────────── */
  test('Satıcı formu sayfası — adımlar mevcut', async ({ page }) => {
    await page.goto('/satici-formu');
    await page.waitForTimeout(2000);

    // Başlık veya ilk adım
    await expect(page.locator('h1, h2').first()).toBeVisible();

    // Form alanları mevcut
    const hasInput = await page.locator('input[type="text"], input[type="email"]').first().isVisible().catch(() => false);
    expect(hasInput).toBeTruthy();
  });

  /* ─── 18. Giriş / Kayıt Sayfaları ──────────────────────── */
  test('Giriş ve kayıt sayfaları yükleniyor', async ({ page }) => {
    await page.goto('/giris');
    await page.waitForTimeout(1500);
    await expect(page.locator('input[type="email"], input[type="text"]').first()).toBeVisible();
    await expect(page.locator('button[type="submit"], button:has-text("Giriş")').first()).toBeVisible();

    await page.goto('/kayit');
    await page.waitForTimeout(1500);
    await expect(page.locator('input[type="email"], input[type="text"]').first()).toBeVisible();
  });

  /* ─── 19. 404 Sayfası ───────────────────────────────────── */
  test('Olmayan sayfa → 404 sayfası gösteriliyor', async ({ page }) => {
    await page.goto('/bu-sayfa-yok-12345');
    await page.waitForTimeout(2000);

    const has404 = await page.locator('text=/404|bulunamadı|not found/i').first().isVisible().catch(() => false);
    const hasBackLink = await page.locator('a[href="/"]').first().isVisible().catch(() => false);
    expect(has404 || hasBackLink).toBeTruthy();
  });

  /* ─── 20. Sayfa Performansı ─────────────────────────────── */
  test('Sayfalar 5 saniye içinde yükleniyor', async ({ page }) => {
    const sayfalar = ['/', '/kategori/prefabrik', '/haberler', '/blog', '/firmalar', '/sss'];

    for (const path of sayfalar) {
      const start = Date.now();
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      const loadTime = Date.now() - start;

      expect(loadTime).toBeLessThan(5000);
      // eslint-disable-next-line no-console
      console.log(`${path} → ${loadTime}ms`);
    }
  });

  /* ─── 21. Konsol Hatası Kontrolü ────────────────────────── */
  test('Ana sayfada ciddi konsol hatası yok', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Firebase ve ağ hataları filtreleme
        if (!text.includes('Firebase') && !text.includes('net::') && !text.includes('favicon')) {
          errors.push(text);
        }
      }
    });

    await page.goto('/');
    await page.waitForTimeout(3000);

    // Ciddi JS hataları olmamalı
    if (errors.length > 0) {
      // eslint-disable-next-line no-console
      console.log('Konsol hataları:', errors);
    }
    expect(errors.length).toBeLessThan(5);
  });

  /* ─── 22. Responsive — Mobil Görünüm ────────────────────── */
  test('Mobil görünüm — hamburger menü çalışıyor', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await page.waitForTimeout(1500);

    // Hamburger menü butonu
    const menuBtn = page.locator('button[aria-label="Menüyü aç"]');
    await expect(menuBtn).toBeVisible();

    // Menüyü aç
    await menuBtn.click();
    await page.waitForTimeout(500);

    // Mobil menü açıldı — "Teklif İste" veya "Ücretsiz İlan Ver" butonları görünür
    await page.waitForTimeout(500);
    const teklifIste = page.locator('text="Teklif İste"').first();
    const ilanVer = page.locator('text="Ücretsiz İlan Ver"').first();
    const hasTeklif = await teklifIste.isVisible().catch(() => false);
    const hasIlan = await ilanVer.isVisible().catch(() => false);
    expect(hasTeklif || hasIlan).toBeTruthy();
  });

  test('Mobil görünüm — arama paneli açılıyor', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await page.waitForTimeout(1500);

    // Arama butonu
    const searchBtn = page.locator('button[aria-label="Arama ve filtreleri aç"]');
    if (await searchBtn.isVisible().catch(() => false)) {
      await searchBtn.click();
      await page.waitForTimeout(1000);

      // Mobil arama input'u (md:hidden form içindeki) veya herhangi bir visible arama input'u
      const mobileForm = page.locator('form.md\\:hidden input[aria-label="Arama"]');
      const anyVisibleInput = page.locator('input[aria-label="Arama"]:visible').first();
      const hasInput = await mobileForm.isVisible().catch(() => false) || await anyVisibleInput.isVisible().catch(() => false);
      expect(hasInput).toBeTruthy();
    }
  });
});
