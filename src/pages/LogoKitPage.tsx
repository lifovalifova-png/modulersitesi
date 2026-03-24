import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Download, ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEOMeta from '../components/SEOMeta';

/* ─── SVG sources embedded for canvas export ───────────────── */

const ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 31" fill="none">
  <rect x="0"  y="0"  width="13" height="13" rx="2.5" fill="#10b981"/>
  <rect x="15" y="0"  width="21" height="13" rx="2.5" fill="#059669"/>
  <rect x="0"  y="15" width="21" height="13" rx="2.5" fill="#059669"/>
  <rect x="23" y="15" width="13" height="13" rx="2.5" fill="#10b981"/>
</svg>`;

const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 218 34" fill="none">
  <g transform="translate(0,3)">
    <rect x="0"  y="0"  width="13" height="13" rx="2.5" fill="#10b981"/>
    <rect x="15" y="0"  width="21" height="13" rx="2.5" fill="#059669"/>
    <rect x="0"  y="15" width="21" height="13" rx="2.5" fill="#059669"/>
    <rect x="23" y="15" width="13" height="13" rx="2.5" fill="#10b981"/>
  </g>
  <text x="46" y="22"
    font-family="system-ui,-apple-system,'Segoe UI',Helvetica,Arial,sans-serif"
    font-size="21" font-weight="700" fill="#111827">Mod\u00fcler<tspan fill="#059669">Pazar</tspan></text>
</svg>`;

/* ─── Canvas-based SVG → PNG download ───────────────────────── */

type PngExportConfig = {
  label: string;
  width: number;
  height: number;
  bg: string;
  svgSrc: string;
  /** rendered width/height of the SVG inside the canvas */
  renderW: number;
  renderH: number;
  filename: string;
};

function downloadPng(cfg: PngExportConfig) {
  const canvas = document.createElement('canvas');
  canvas.width  = cfg.width;
  canvas.height = cfg.height;
  const ctx = canvas.getContext('2d')!;

  // fill background
  ctx.fillStyle = cfg.bg;
  ctx.fillRect(0, 0, cfg.width, cfg.height);

  const blob = new Blob([cfg.svgSrc], { type: 'image/svg+xml;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const img  = new Image();

  img.onload = () => {
    const x = (cfg.width  - cfg.renderW) / 2;
    const y = (cfg.height - cfg.renderH) / 2;
    ctx.drawImage(img, x, y, cfg.renderW, cfg.renderH);
    URL.revokeObjectURL(url);

    canvas.toBlob((pngBlob) => {
      if (!pngBlob) return;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(pngBlob);
      a.download = cfg.filename;
      a.click();
      URL.revokeObjectURL(a.href);
    }, 'image/png');
  };

  img.src = url;
}

function downloadSvg(href: string, filename: string) {
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  a.click();
}

/* ─── Sub-components ─────────────────────────────────────────── */

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">
      {children}
    </h2>
  );
}

function DownloadButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition"
    >
      <Download className="w-4 h-4" aria-hidden="true" />
      {label}
    </button>
  );
}

/* ─── Page ───────────────────────────────────────────────────── */

export default function LogoKitPage() {

  /* PNG download handlers */
  const dl512 = useCallback(() => {
    downloadPng({
      label: '512×512',
      width: 512, height: 512,
      bg: '#ffffff',
      svgSrc: ICON_SVG,
      renderW: 320, renderH: 278,
      filename: 'logo-512x512.png',
    });
  }, []);

  const dl192 = useCallback(() => {
    downloadPng({
      label: '192×192',
      width: 192, height: 192,
      bg: '#ffffff',
      svgSrc: ICON_SVG,
      renderW: 120, renderH: 104,
      filename: 'logo-192x192.png',
    });
  }, []);

  const dl1200 = useCallback(() => {
    downloadPng({
      label: '1200×630',
      width: 1200, height: 630,
      bg: '#ffffff',
      svgSrc: LOGO_SVG,
      renderW: 872, renderH: 136,
      filename: 'logo-1200x630.png',
    });
  }, []);

  return (
    <>
      <SEOMeta
        title="Logo Kit"
        description="ModülerPazar logo ve marka dosyalarını indirin. SVG ve PNG formatlarında logo kiti."
        url="/logo-kit"
      />
      <Header />
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-10">

          {/* Back */}
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-emerald-600 mb-6 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Ana sayfaya dön
          </Link>

          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Logo Kit</h1>
          <p className="text-gray-500 mb-10">
            ModülerPazar logosunu ve ikon versiyonlarını doğru formatlarda indirin.
          </p>

          {/* ── 1. Tam Logo (renkli) ─────────────────────────── */}
          <section className="mb-10">
            <SectionTitle>Tam Logo — Renkli</SectionTitle>
            <div className="rounded-xl border border-gray-200 bg-white p-10 flex items-center justify-center mb-4">
              <img src="/logo-white.svg" className="hidden" alt="" aria-hidden />
              <img
                src="/favicon.svg"
                alt="ModülerPazar ikon önizleme"
                className="hidden"
                aria-hidden
              />
              {/* Inline preview using public SVG */}
              <img
                src={new URL('../assets/logo.svg', import.meta.url).href}
                alt="ModülerPazar tam logo"
                className="h-14 w-auto"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <DownloadButton
                label="SVG İndir"
                onClick={() => downloadSvg(
                  new URL('../assets/logo.svg', import.meta.url).href,
                  'modulerpazar-logo.svg'
                )}
              />
              <DownloadButton label="PNG 1200×630 İndir" onClick={dl1200} />
            </div>
          </section>

          {/* ── 2. Sadece İkon ──────────────────────────────── */}
          <section className="mb-10">
            <SectionTitle>İkon — Kare / Profil Fotoğrafı</SectionTitle>
            <div className="rounded-xl border border-gray-200 bg-white p-10 flex items-center justify-center mb-4">
              <img
                src={new URL('../assets/logo-icon.svg', import.meta.url).href}
                alt="ModülerPazar ikon"
                className="h-20 w-auto"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <DownloadButton
                label="SVG İndir"
                onClick={() => downloadSvg(
                  new URL('../assets/logo-icon.svg', import.meta.url).href,
                  'modulerpazar-icon.svg'
                )}
              />
              <DownloadButton label="PNG 512×512 İndir" onClick={dl512} />
              <DownloadButton label="PNG 192×192 İndir" onClick={dl192} />
            </div>
          </section>

          {/* ── 3. Beyaz Versiyon ────────────────────────────── */}
          <section className="mb-10">
            <SectionTitle>Beyaz Versiyon — Koyu Arka Plan İçin</SectionTitle>
            <div className="rounded-xl border border-gray-200 bg-emerald-700 p-10 flex items-center justify-center mb-4">
              <img
                src="/logo-white.svg"
                alt="ModülerPazar beyaz logo"
                className="h-14 w-auto"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <DownloadButton
                label="SVG İndir"
                onClick={() => downloadSvg('/logo-white.svg', 'modulerpazar-logo-white.svg')}
              />
            </div>
          </section>

          {/* ── 4. Favicon ───────────────────────────────────── */}
          <section className="mb-10">
            <SectionTitle>Favicon</SectionTitle>
            <div className="rounded-xl border border-gray-200 bg-white p-10 flex items-center justify-center gap-8 mb-4">
              <div className="text-center">
                <div className="w-8 h-8 mx-auto mb-2">
                  <img src="/favicon.svg" alt="32px favicon" className="w-full h-full" />
                </div>
                <span className="text-xs text-gray-400">32px</span>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-2">
                  <img src="/favicon.svg" alt="64px favicon" className="w-full h-full" />
                </div>
                <span className="text-xs text-gray-400">64px</span>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-2">
                  <img src="/favicon.svg" alt="80px favicon" className="w-full h-full" />
                </div>
                <span className="text-xs text-gray-400">80px</span>
              </div>
            </div>
            <DownloadButton
              label="SVG İndir"
              onClick={() => downloadSvg('/favicon.svg', 'modulerpazar-favicon.svg')}
            />
          </section>

          {/* ── 5. Kullanım Kuralları ─────────────────────────── */}
          <section className="mb-10">
            <SectionTitle>Kullanım Kuralları</SectionTitle>

            <div className="grid md:grid-cols-2 gap-6">
              {/* DO */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  Doğru Kullanım
                </h3>
                <ul className="space-y-3 text-sm text-gray-600">
                  {[
                    'Logoya yeterli boşluk bırakın: her yönden logo yüksekliğinin en az yarısı kadar.',
                    'Beyaz arka planlarda renkli versiyonu kullanın.',
                    'Koyu / fotoğraflı arka planlarda beyaz versiyonu kullanın.',
                    'Minimum boyut: 80px genişlik (dijital), 25mm (baskı).',
                    'Orantılı olarak büyütün / küçültün (en boy oranını koruyun).',
                    'Sağlanan SVG dosyalarını kullanarak keskin render elde edin.',
                  ].map((text) => (
                    <li key={text} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      {text}
                    </li>
                  ))}
                </ul>
              </div>

              {/* DON'T */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-500" />
                  Yasak Kullanımlar
                </h3>
                <ul className="space-y-3 text-sm text-gray-600">
                  {[
                    'Logoyu yeniden renklendirmeyin; yalnızca sağlanan renk sürümlerini kullanın.',
                    'Logoyu çarpıtmayın, döndürmeyin veya eğmeyin.',
                    'Logoyu düşük kontrastlı arka planlara uygulamayın.',
                    'Logo üzerine efekt, gölge veya kontur eklemeyin.',
                    'Harflerin boyutunu, aralığını veya ağırlığını değiştirmeyin.',
                    'Logoya başka element veya metin iliştirmeyin.',
                  ].map((text) => (
                    <li key={text} className="flex items-start gap-2">
                      <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                      {text}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* ── 6. Renk Paleti ───────────────────────────────── */}
          <section className="mb-10">
            <SectionTitle>Marka Renk Paleti</SectionTitle>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { name: 'Birincil',    hex: '#059669', label: 'emerald-600' },
                { name: 'Vurgu',       hex: '#10b981', label: 'emerald-400' },
                { name: 'Koyu Metin', hex: '#111827', label: 'gray-900'    },
                { name: 'Beyaz',      hex: '#ffffff', label: 'white', border: true },
              ].map((color) => (
                <div key={color.hex} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div
                    className={`h-20 ${color.border ? 'border-b border-gray-200' : ''}`}
                    style={{ backgroundColor: color.hex }}
                  />
                  <div className="p-3">
                    <p className="font-medium text-gray-900 text-sm">{color.name}</p>
                    <p className="text-xs text-gray-500 font-mono">{color.hex}</p>
                    <p className="text-xs text-gray-400">{color.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── 7. Tipografi ─────────────────────────────────── */}
          <section className="mb-10">
            <SectionTitle>Tipografi</SectionTitle>
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
              <div>
                <p className="text-xs text-gray-400 mb-1">Birincil yazı tipi — UI</p>
                <p className="text-2xl font-bold text-gray-900" style={{ fontFamily: "system-ui,-apple-system,'Segoe UI',Helvetica,Arial,sans-serif" }}>
                  System UI / -apple-system
                </p>
              </div>
              <div className="pt-4 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                {[
                  { w: '700', label: 'Bold — Başlıklar' },
                  { w: '600', label: 'Semibold — Vurgu' },
                  { w: '500', label: 'Medium — Butonlar' },
                  { w: '400', label: 'Regular — Gövde' },
                ].map((item) => (
                  <div key={item.w}>
                    <p
                      className="text-lg text-gray-800 mb-1"
                      style={{ fontWeight: item.w }}
                    >
                      ModülerPazar
                    </p>
                    <p className="text-xs text-gray-400">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

        </div>
      </main>
      <Footer />
    </>
  );
}
