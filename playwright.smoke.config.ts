import { defineConfig, devices } from '@playwright/test';

/**
 * Prod smoke — SALT OKUNUR.
 * Ana playwright.config.ts'ten bağımsızdır; yalnız smoke-prod.spec.ts'i
 * çalıştırır (mutation içeren ajan testleriyle karışmaz).
 * Çalıştırma: pnpm exec playwright test --config=playwright.smoke.config.ts
 */
export default defineConfig({
  testDir: './tests',
  testMatch: /smoke-prod\.spec\.ts/,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 1,
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
  ],
  use: {
    baseURL: 'https://www.modulerpazar.com',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    locale: 'tr-TR',
    timezoneId: 'Europe/Istanbul',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
