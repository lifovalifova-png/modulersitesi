export const config = { runtime: 'edge' };

/* ── Rate limiter (in-memory, Edge instance başına) ──────────────
   Her Edge instance bağımsız Map tutar. Yatay scale'de limitler
   yaklaşık olur; production'da KV store önerilir.
──────────────────────────────────────────────────────────────── */
const WINDOW_MS = 60_000; // 1 dakika
const MAX_REQ   = 5;      // dakikada max istek
const MAX_BODY  = 500;    // max mesaj karakteri

interface RateEntry { count: number; resetAt: number }
const ratemap = new Map<string, RateEntry>();

function getIp(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  );
}

function checkRateLimit(ip: string): boolean {
  const now   = Date.now();
  const entry = ratemap.get(ip);

  if (!entry || now > entry.resetAt) {
    ratemap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= MAX_REQ) return false;
  entry.count++;
  return true;
}

/* ── CORS headers ──────────────────────────────────────────────── */
const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST',
  'Access-Control-Allow-Headers': 'Content-Type',
};

/* ── System prompt ─────────────────────────────────────────────── */
const SYSTEM_PROMPT = `Sen ModülerPazar'ın yapı danışmanısın. Türkiye'deki tüm illerin iklim özelliklerini, kar yağışı, deprem riski, zemin yapısı ve sıcaklık ortalamalarını biliyorsun. Örneğin:
- Doğu illeri (Erzurum, Kars, Ağrı): Çok sert kış, kar yükü fazla → dik çatı zorunlu
- Ege/Akdeniz: Sıcak iklim, hafif yapılar yeterli
- Marmara: Deprem riski yüksek → çelik yapı avantajlı
- İç Anadolu: Geniş sıcaklık farkı → yalıtım kritik
- Karadeniz: Yağış fazla → su yalıtımı önemli

Kullanıcının belirttiği şehir ve ihtiyaca göre:
🌍 Bölge & İklim Analizi
🏗️ Önerilen Yapı Tipi ve Nedeni
💰 Tahmini m² Maliyeti (TL)
⚠️ Dikkat Edilmesi Gerekenler

Kısa, net, Türkçe yanıt ver. 3-4 paragraf yeterli.`;

/* ── Handler ───────────────────────────────────────────────────── */
export default async function handler(req: Request) {
  /* Preflight */
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Yalnızca POST desteklenmektedir.' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...CORS },
    });
  }

  /* Rate limit */
  const ip = getIp(req);
  if (!checkRateLimit(ip)) {
    return new Response(JSON.stringify({ error: 'Çok fazla istek, lütfen bekleyin.' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json', ...CORS },
    });
  }

  /* Body doğrulama */
  let message: unknown;
  try {
    ({ message } = await req.json() as { message: unknown });
  } catch {
    return new Response(JSON.stringify({ error: 'Geçersiz JSON.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...CORS },
    });
  }

  if (typeof message !== 'string' || !message.trim()) {
    return new Response(JSON.stringify({ error: 'Geçersiz istek.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...CORS },
    });
  }

  if (message.length > MAX_BODY) {
    return new Response(
      JSON.stringify({ error: `Mesaj en fazla ${MAX_BODY} karakter olabilir.` }),
      { status: 400, headers: { 'Content-Type': 'application/json', ...CORS } },
    );
  }

  /* Anthropic API */
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Sunucu yapılandırma hatası.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...CORS },
    });
  }

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system:     SYSTEM_PROMPT,
        messages:   [{ role: 'user', content: message.trim() }],
      }),
    });

    const data = await upstream.json();
    return new Response(JSON.stringify(data), {
      status: upstream.status,
      headers: { 'Content-Type': 'application/json', ...CORS },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Yapay zeka servisine ulaşılamadı.' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', ...CORS },
    });
  }
}
