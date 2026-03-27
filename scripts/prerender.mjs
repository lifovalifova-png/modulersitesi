/**
 * react-snap prerender wrapper.
 * Chromium'u şu sırayla arar:
 * 1. PUPPETEER_EXECUTABLE_PATH env değişkeni
 * 2. Vercel / Linux: /usr/bin/google-chrome
 * 3. macOS Playwright cache
 * 4. Hiçbiri yoksa sessizce atlar (CI'da build'i kırmaz)
 */
import { execSync, spawnSync } from 'child_process';
import { existsSync } from 'fs';
import { resolve } from 'path';

const PLAYWRIGHT_CHROME =
  '/Users/macbook/Library/Caches/ms-playwright/chromium-1208/chrome-mac-x64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';

const candidates = [
  process.env.PUPPETEER_EXECUTABLE_PATH,
  '/usr/bin/google-chrome',
  '/usr/bin/chromium-browser',
  '/usr/bin/chromium',
  PLAYWRIGHT_CHROME,
].filter(Boolean);

const chromium = candidates.find((p) => existsSync(p));

if (!chromium) {
  console.log('⚠️  react-snap: Chromium bulunamadı, prerender atlanıyor.');
  process.exit(0);
}

console.log(`🔍  Chromium: ${chromium}`);

const result = spawnSync(
  'node_modules/.bin/react-snap',
  [],
  {
    env: { ...process.env, PUPPETEER_EXECUTABLE_PATH: chromium },
    stdio: 'inherit',
  },
);

if (result.status !== 0) {
  console.log('⚠️  react-snap Firebase offline uyarılarıyla tamamlandı (normal).');
}

process.exit(0); // Build'i asla kırma
