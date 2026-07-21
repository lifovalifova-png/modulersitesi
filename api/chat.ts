export const config = { runtime: 'edge' };

/* ── Rate limiter: IP başına günde 10 sorgu (24 saat reset) ─
   Edge instance başına bağımsız Map; production'da KV önerilir.
─────────────────────────────────────────────────────────── */
const WINDOW_MS = 24 * 60 * 60 * 1_000; // 24 saat
const MAX_REQ   = 10;
const MAX_BODY  = 500;

interface RateEntry { count: number; resetAt: number }
const ratemap = new Map<string, RateEntry>();

function getIp(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  );
}

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now   = Date.now();
  const entry = ratemap.get(ip);

  if (!entry || now > entry.resetAt) {
    ratemap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: MAX_REQ - 1 };
  }
  if (entry.count >= MAX_REQ) {
    return { allowed: false, remaining: 0 };
  }
  entry.count++;
  return { allowed: true, remaining: MAX_REQ - entry.count };
}

/* ── CORS ───────────────────────────────────────────────── */
const ALLOWED_ORIGINS = [
  'https://modulerpazar.com',
  'https://www.modulerpazar.com',
];

function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') || '';
  if (ALLOWED_ORIGINS.includes(origin) || origin.endsWith('.vercel.app')) {
    return {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
  }
  return {};
}

function json(data: unknown, status: number, req: Request) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(req) },
  });
}

/* ── System prompt ──────────────────────────────────────── */
const SYSTEM_PROMPT = `Sen ModülerPazar'ın yapı danışmanısın. SADECE modüler yapı, prefabrik ev, çelik yapı, konteyner ev, tiny house, ahşap yapı konularında yardım et. Konu dışı sorulara "Üzgünüm, sadece modüler yapı konularında yardımcı olabilirim" de. Türkiye'deki tüm illerin iklim, deprem riski, zemin yapısı bilgilerini biliyorsun. Yanıtları şu formatta ver:

🌍 Bölge & İklim Analizi
🏗️ Önerilen Yapı Tipi
📊 Maliyet Karşılaştırması
⚠️ Dikkat Edilecekler

Maliyet Karşılaştırması bölümünde KESİNLİKLE TL/m² rakamı, toplam maliyet veya herhangi bir sayısal fiyat verme — ne kendi tahminini uydur ne sabit bir referans rakam kullan. Bunun yerine SADECE karşılaştırmalı, niteliksel yönlendirme yap. Örnekler: "Prefabrik ev, çelik yapıya göre genellikle daha uygun maliyetlidir." "Tiny house'ta onay süreci daha kolay olsa da maliyet açısından prefabrik ev ile yakın seviyelere gelebilir." "Konteyner evin başlangıç maliyeti düşük olsa da izolasyon ihtiyacı ek maliyet getirebilir." Kesin rakam istenirse "Kesin fiyat firma tekliflerine göre değişir, ModülerPazar'dan ücretsiz teklif alarak öğrenebilirsiniz" de.

Yanıt sonunda her zaman: "ModülerPazar üzerinden ücretsiz teklif alarak size özel fiyat bilgisi alabilirsiniz 👉 modulerpazar.com" ekle. Türkçe yazım kurallarına dikkat et. 'Prefabric' değil 'prefabrik' yaz.`;

/* ── Handler ────────────────────────────────────────────── */
export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(req) });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Yalnızca POST desteklenmektedir.' }, 405, req);
  }

  /* Rate limit */
  const ip = getIp(req);
  const { allowed, remaining } = checkRateLimit(ip);
  if (!allowed) {
    return json({ error: 'Günlük soru limitiniz doldu. Yarın tekrar deneyin.', remaining: 0 }, 429, req);
  }

  /* Body */
  let message: unknown;
  try {
    ({ message } = await req.json() as { message: unknown });
  } catch {
    return json({ error: 'Geçersiz JSON.' }, 400, req);
  }

  if (typeof message !== 'string' || !message.trim()) {
    return json({ error: 'Geçersiz istek.' }, 400, req);
  }
  if (message.length > MAX_BODY) {
    return json({ error: `Mesaj en fazla ${MAX_BODY} karakter olabilir.` }, 400, req);
  }

  /* Groq API */
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return json({ error: 'Sunucu yapılandırma hatası.' }, 500, req);
  }

  try {
    const upstream = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user',   content: message.trim() },
        ],
        max_tokens: 1024,
      }),
    });

    const data = await upstream.json() as {
      choices?: Array<{ message?: { content?: string } }>;
      error?:   { message?: string };
    };

    if (!upstream.ok) {
      const detail = data.error?.message ?? `Groq ${upstream.status}`;
      return json({ error: detail, remaining }, upstream.status, req);
    }

    const reply = data.choices?.[0]?.message?.content || 'Yanıt alınamadı';
    return json({ reply, remaining }, 200, req);
  } catch {
    return json({ error: 'Yapay zeka servisine ulaşılamadı.' }, 502, req);
  }
}
