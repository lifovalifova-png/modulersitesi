export const config = { runtime: 'edge' };

const ANTHROPIC_MODEL = 'claude-sonnet-4-6';

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

async function callClaude(
  apiKey: string,
  system: string,
  userMessage: string,
): Promise<{ ok: true; text: string } | { ok: false; error: string; status: number }> {
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 4096,
        system,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    const data = await res.json() as {
      content?: Array<{ type: string; text?: string }>;
      error?: { message: string };
    };

    if (!res.ok) {
      const msg = data?.error?.message || `HTTP ${res.status}`;
      console.error(`[scan-news] Claude failed:`, res.status, msg);
      return { ok: false, error: msg, status: res.status };
    }

    const text = data.content?.find(b => b.type === 'text')?.text ?? '';
    if (!text) {
      console.error('[scan-news] Claude returned empty text');
      return { ok: false, error: 'Boş yanıt', status: 200 };
    }

    return { ok: true, text };
  } catch (e) {
    console.error('[scan-news] Claude exception:', e);
    return { ok: false, error: String(e), status: 0 };
  }
}

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { sourceUrl, anahtar_kelimeler } = await req.json();

    if (!sourceUrl || typeof sourceUrl !== 'string') {
      return json({ error: 'sourceUrl gereklidir.' }, 400);
    }

    const API_KEY = process.env.ANTHROPIC_API_KEY;
    if (!API_KEY) return json({ error: 'ANTHROPIC_API_KEY tanımlı değil.' }, 500);

    const kelimeler = anahtar_kelimeler?.length
      ? anahtar_kelimeler
      : ['prefabrik', 'modüler yapı', 'konteyner ev', 'tiny house', 'çelik yapı'];

    let pageText = '';
    try {
      const r = await fetch(sourceUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8',
        },
        signal: AbortSignal.timeout(10_000),
      });
      if (!r.ok) {
        console.error(`[scan-news] Source fetch failed: ${sourceUrl} HTTP ${r.status}`);
        return json({ error: `Sayfa çekilemedi (HTTP ${r.status})`, bulunan: 0, eklenen: 0, haberler: [] });
      }
      const html = await r.text();
      pageText = html
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<a\s[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, ' [LINK:$1] $2 ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .slice(0, 15_000);

      console.log(`[scan-news] Fetched ${sourceUrl}, content length: ${pageText.length}`);
    } catch (e) {
      console.error('[scan-news] Source fetch exception:', e);
      return json({ error: 'Sayfa içeriği çekilemedi: ' + String(e), bulunan: 0, eklenen: 0, haberler: [] });
    }

    if (pageText.length < 200) {
      return json({ error: 'Sayfa içeriği çok kısa veya boş', bulunan: 0, eklenen: 0, haberler: [] });
    }

    const system = 'Sen bir haber sitesi analiz uzmanısın. Verilen web sayfası içeriğinden belirtilen anahtar kelimelerle ilgili haber linklerini bul ve yapılandırılmış JSON olarak döndür.';

    const userMessage = `Bu bir haber sitesinin ana sayfası içeriğidir. Sayfadaki haber linklerinden şu anahtar kelimelere uygun olanları bul: [${kelimeler.join(', ')}].

Her uygun haber için aşağıdaki formatta JSON array döndür, başka hiçbir şey yazma:
[
  { "baslik": "Haber başlığı", "url": "Tam haber URL'si", "ozet": "1-2 cümlelik özet" }
]

Kurallar:
- Sadece anahtar kelimelerle ilgili haberler
- URL'ler tam olmalı (göreli yolları site domain'i ile birleştir: ${sourceUrl})
- En fazla 10 haber döndür
- Uygun haber yoksa boş array döndür: []

Sayfa içeriği:
${pageText}`;

    const aiResult = await callClaude(API_KEY, system, userMessage);

    if (!aiResult.ok) {
      const userMsg = aiResult.status === 429
        ? 'AI kullanım limitine ulaşıldı. Daha sonra tekrar deneyin.'
        : aiResult.status === 401
        ? 'API key hatalı. Vercel env değişkenlerini kontrol edin.'
        : `AI hatası: ${aiResult.error}`;
      return json({ error: userMsg, bulunan: 0, eklenen: 0, haberler: [] }, 500);
    }

    const clean = aiResult.text.replace(/```json|```/g, '').trim();
    const arrayMatch = clean.match(/\[[\s\S]*\]/);
    if (!arrayMatch) {
      console.warn('[scan-news] No JSON array found in AI response:', clean.slice(0, 300));
      return json({ bulunan: 0, eklenen: 0, haberler: [] });
    }

    let haberler: Array<{ baslik: string; url: string; ozet: string }> = [];
    try {
      haberler = JSON.parse(arrayMatch[0]);
    } catch (e) {
      console.error('[scan-news] JSON parse failed:', e, 'Raw:', arrayMatch[0].slice(0, 300));
      return json({ error: 'AI yanıtı parse edilemedi', bulunan: 0, eklenen: 0, haberler: [] }, 500);
    }

    return json({ bulunan: haberler.length, eklenen: haberler.length, haberler });

  } catch (err) {
    console.error('[scan-news] Top-level error:', err);
    return json({ error: 'Tarama sırasında hata oluştu: ' + String(err), bulunan: 0, eklenen: 0, haberler: [] }, 500);
  }
}
