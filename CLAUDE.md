# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Dev server on http://localhost:9002 (0.0.0.0)
pnpm build        # TypeScript check + Vite build (development mode)
pnpm build:prod   # TypeScript check + Vite build (production — removes data-matrix attrs)
pnpm lint         # ESLint
pnpm test         # Vitest
pnpm preview      # Serve the dist/ folder locally
```

Always use **pnpm**, not npm or yarn.
`tsc --noEmit` is included in `pnpm build` via `tsc -b`. Run it standalone to check types without building.

## Architecture

### App Shell (`src/App.tsx`)
Every page is `React.lazy()`-loaded and wrapped in a single `<Suspense>` with a spinner fallback. Context providers wrap the router in this order: `LanguageProvider > AuthProvider > TeklifSepetProvider`. `<TeklifSepeti />` (the quote-basket drawer) is rendered globally, outside `<Routes>`.

### Context Providers
| Context | File | Purpose |
|---|---|---|
| `LanguageProvider` | `src/context/LanguageContext.tsx` | TR/EN i18n via `useLanguage()` → `{ lang, setLang, t }`. Falls back to TR. localStorage key: `'lang'` |
| `AuthProvider` | `src/context/AuthContext.tsx` | Firebase Auth |
| `TeklifSepetProvider` | `src/context/TeklifSepetContext.tsx` | Quote basket (max 2 `Ilan` items). Persisted to localStorage key: `'teklifSepeti'` |

### Firebase (`src/lib/firebase.ts`)
Exports `auth`, `db`, `storage`. Project: `modulerpazar`. Firestore rules live in `firestore.rules`. Admin access is determined by the existence of a document at `admins/{uid}`.

### Firestore Collections
| Collection | Who reads | Who writes |
|---|---|---|
| `ilanlar` | Public | Verified auth users (sellers) |
| `firms` | Public | Auth users (create), owner/admin (update) |
| `taleplar` | Admin only | Anyone (create) |
| `quotes` | Admin only | Anyone (create) |
| `settings/features` | Public (feature flags) | Admin |
| `hakkimizda/icerik` | Public | Admin (via dashboard) |
| `bildirimler` | FirmaPaneli | Admin |

### Key Hooks
- **`useIlanlar(kategoriSlug?, sehir?)`** — realtime `onSnapshot` on `ilanlar`. Server-side filter by `kategoriSlug` or `status='aktif'`, `limit(20)`. Exports the `Ilan` interface — `fiyat` is `number`, not string. Also exports `formatFiyat()` and `formatTarih()`.
- **`useFeatureFlags()`** — realtime listener on `settings/features`. Returns `{ flags, loading }`. Flags: `aiAsistan`, `teklifSepeti`, `talepHavuzu`, `onecikarIlan`, `sinirsizTalep`.

### Routing
All routes are in `App.tsx`. `/admin/dashboard` is wrapped in `<AdminRoute>`. The Vercel deployment uses a catch-all rewrite to `/index.html` for SPA navigation (`vercel.json`).

### SEO
`<SEOMeta title description url? image? type? />` dynamically updates `document.title` and all OG/Twitter meta tags. Restores defaults on unmount. Use on every page.

### EmailJS (`src/lib/emailjs.ts`)
Two functions: `sendTalepEmail()` (quote request) and `sendFirmaBasvuruEmail()` (seller sign-up). Both use the same SERVICE_ID/TEMPLATE_ID/PUBLIC_KEY. Fire-and-forget — do not await on critical paths.

### Analytics (`src/lib/analytics.ts`)
`trackEvent(name, params?)` — thin wrapper around GA4 `window.gtag`. GA4 ID: `G-KK8YBNMNL7` (in `index.html`).

### Static Data
- `src/data/categories.ts` — `CATEGORIES` array with slugs, used for category nav and filtering.
- `src/config/site.ts` — `SITE_CONFIG` (name, url, phone, email, address) and `LEGAL_LINKS`.
- `src/data/firms.ts` and `src/components/QuickQuoteModal.tsx` — exist but are unused.

### i18n
Keys live in `src/i18n/tr.ts` and `src/i18n/en.ts` (flat `Record<string, string>`). i18n is applied in Header, Footer, and HomePage. Other pages are hardcoded in Turkish.

### AdminDashboardPage Tab Pattern
Tabs are typed as a `TabKey` union. Each tab is a standalone function component defined in the file. New tabs need: a value added to the `TabKey` union, an entry in the `TABS` array (with icon from lucide-react), and a case in the render switch. Use dynamic `import('firebase/firestore')` inside tab components to avoid circular imports.

### Build Modes
`vite-plugin-source-identifier` adds `data-matrix` attributes to JSX elements in dev mode for component tracing. `pnpm build:prod` sets `BUILD_MODE=prod` to disable this. Use `build:prod` before deploying.

### Path Alias
`@` maps to `src/` (configured in `vite.config.ts` and `tsconfig.app.json`).
