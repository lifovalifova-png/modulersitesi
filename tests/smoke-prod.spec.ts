import { test, expect, type ConsoleMessage } from '@playwright/test';

/**
 * Prod smoke — SALT OKUNUR.
 * Hiçbir form submit / POST / Firestore yazma YOK. Sadece sayfa açar,
 * render ve konsol durumunu doğrular. baseURL: www.modulerpazar.com
 * (playwright.smoke.config.ts).
 *
 * NOT: Site SPA + catch-all rewrite olduğundan her path HTTP 200 döner;
 * bu yüzden 200 kontrolüne EK olarak içerik (başlık/heading) doğrulanır.
 */

/* Bilinen 3rd-party / tarayıcı gürültüsü — uygulama hatası değil */
const NOISE = /favicon|gtag|googletag|google-analytics|doubleclick|fonts?\.|analytics|ERR_BLOCKED_BY_CLIENT/i;

test('ana sayfa 200 döner ve başlık ModülerPazar içerir', async ({ page }) => {
  const resp = await page.goto('/');
  expect(resp?.status()).toBe(200);
  await expect(page).toHaveTitle(/ModülerPazar/i);
});

test('çerez banner görünür (Kabul Et / Reddet)', async ({ page }) => {
  await page.goto('/');
  // Taze context = boş localStorage → consent null → banner görünür
  await expect(page.getByRole('button', { name: 'Kabul Et' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Reddet' })).toBeVisible();
});

test('/firmalar render olur', async ({ page }) => {
  const resp = await page.goto('/firmalar');
  expect(resp?.status()).toBe(200);
  await expect(page.getByRole('heading', { name: /firma/i }).first()).toBeVisible();
});

test('/nasil-kullanilir 200 ve içerik render olur', async ({ page }) => {
  // NOT: kullanıcı /nasil-calisir demişti; gerçek rota /nasil-kullanilir.
  const resp = await page.goto('/nasil-kullanilir');
  expect(resp?.status()).toBe(200);
  await expect(page.getByRole('heading', { name: /Keşfedin/i })).toBeVisible();
});

test('ana sayfa yüklenirken konsol hatası yok', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (msg: ConsoleMessage) => {
    if (msg.type() === 'error' && !NOISE.test(msg.text())) errors.push(msg.text());
  });
  page.on('pageerror', (err) => {
    if (!NOISE.test(err.message)) errors.push(err.message);
  });

  await page.goto('/', { waitUntil: 'networkidle' });
  expect(errors, `Beklenmeyen konsol hataları:\n${errors.join('\n')}`).toEqual([]);
});
