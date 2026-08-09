/**
 * prerender-blog.ts — /blog/{slug} rotaları için build-time statik HTML üretimi.
 *
 * postbuild aşamasında (vite build sonrası) çalışır. Her blog slug'ı için:
 *   · gövdeyi renderIcerik + renderToStaticMarkup ile üretip #root'a gömer
 *   · head tag'lerini (title/description/canonical/OG/Twitter) elle üretip <head>'e gömer
 *     (canonical = https://www.modulerpazar.com/blog/{slug})
 *   · dist/blog/{slug}/index.html yazar
 *
 * Kapsam: SADECE blog rotaları. İçerik kaynağı: STATİK blogIcerik.ts (Firestore YOK).
 * Not: .ts dosyası olduğu için JSX değil createElement kullanılır; JSX'li renderIcerik.tsx
 * --tsconfig tsconfig.app.json bayrağıyla otomatik runtime altında derlenir (package.json).
 */
import { createElement, Fragment } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { BLOG_POSTS } from '../src/data/blogPosts';
import { BLOG_ICERIK } from '../src/data/blogIcerik';
import { renderIcerik } from '../src/lib/renderIcerik';

const BASE_URL = 'https://www.modulerpazar.com';

/** HTML attribute/​text değeri için minimal escape (tırnak & vb. güvenliği) */
function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const distDir  = resolve(process.cwd(), 'dist');
const template = readFileSync(resolve(distDir, 'index.html'), 'utf-8');

let yazilan = 0;
for (const post of BLOG_POSTS) {
  const icerik = BLOG_ICERIK[post.slug] ?? '';

  // 1) Gövde → #root
  const bodyHtml = renderToStaticMarkup(
    createElement(Fragment, null, renderIcerik(icerik)),
  );

  // 2) Head tag'leri — ELLE üretilir.
  // UYARI: Bu tag'ler src/components/SEOMeta.tsx'in çıktısını taklit eder.
  // SEOMeta değişirse burası da elle güncellenmeli.
  const fullTitle = post.baslik.includes('ModülerPazar') ? post.baslik : `${post.baslik} | ModülerPazar`;
  const canonical = `${BASE_URL}/blog/${post.slug}`;
  const ogImage   = post.kapakGorseli || `${BASE_URL}/og-image.png`;
  const desc      = post.ozet;
  const headTags = [
    `<title>${esc(fullTitle)}</title>`,
    `<meta name="description" content="${esc(desc)}" />`,
    `<link rel="canonical" href="${esc(canonical)}" />`,
    // Open Graph (5)
    `<meta property="og:type" content="article" />`,
    `<meta property="og:title" content="${esc(fullTitle)}" />`,
    `<meta property="og:description" content="${esc(desc)}" />`,
    `<meta property="og:image" content="${esc(ogImage)}" />`,
    `<meta property="og:url" content="${esc(canonical)}" />`,
    // Twitter (4)
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(fullTitle)}" />`,
    `<meta name="twitter:description" content="${esc(desc)}" />`,
    `<meta name="twitter:image" content="${esc(ogImage)}" />`,
  ].join('\n  ');

  // 3) Şablonu per-yazı hale getir:
  //    - varsayılan <title> ve helmet-yönetimli (data-rh) genel site tag'lerini ÇIKAR
  //      → blog tag'leri öncekilerin yerini alır, yanına EKLENMEZ (duplicate yok)
  //    - per-yazı head tag'lerini </head>'den önce göm
  //    - gövdeyi #root içine göm
  const html = template
    .replace(/<title>[\s\S]*?<\/title>/, '')
    .replace(/\s*<(?:meta|link)\b[^>]*\bdata-rh="true"[^>]*>/g, '')
    .replace('</head>', `  ${headTags}\n</head>`)
    .replace('<div id="root"></div>', `<div id="root">${bodyHtml}</div>`);

  // 4) dist/blog/{slug}/index.html yaz
  const outDir = resolve(distDir, 'blog', post.slug);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(resolve(outDir, 'index.html'), html, 'utf-8');
  yazilan++;
}

console.log(`[prerender-blog] ${yazilan} dosya yazıldı → dist/blog/{slug}/index.html`);
