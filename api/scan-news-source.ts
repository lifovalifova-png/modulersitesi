export const config = { runtime: 'edge' };

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

// Model fallback sırası: önce 2.0-flash (en bol free quota), sonra 2.0-flash-lite
const GEMINI_MODELS = ['gemini-2.0-flash', 'gemini-2.0-flash-lite'];

async function callGemini(apiKey: string, prompt: string): Promise<{ ok: true; text: string } | { ok: false; error: string; status: number }> {
  let lastError = '';
  let lastStatus = 0;

  for (const model of GEMINI_MODELS) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.1 },
          }),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        lastStatus = res.status;
        lastError = data?.error?.message || `HTTP ${res.status}`;
        console.error(`[scan-news] ${model} failed:`, res.status, lastError);
        // 429 (quota) veya 404 (model gone) ise sonraki modeli dene
        if (res.status === 429 || res.status === 404) continue;
        // Diğer hatalar (400, 401, 403) modele özgü değil, doğrudan dön
        return { ok: false, error: lastError, status: res.status };
      }

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      if (!text) {
        lastError = 'Boş yanıt';
        console.error(`[scan-news] ${model} returned empty text`, JSON.stringify(data).slice(0, 500));
        continue;
      }

      console.log(`[scan-news] ${model} success`);
      return { ok: true, text };
    } catch (e) {
      lastError = String(e);
      console.error(`[scan-news] ${model} exception:`, e);
    }
  }

  return { ok: false, error: lastError || 'Tüm modeller başarısız', status: lastStatus };
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

    const GEMINI_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_KEY) return json({ error: 'GEMINI_API_KEY tanımlı değil.' }, 500);

    const kelimeler = anahtar_kelimeler?.length
      ? anahtar_kelimeler
      : ['prefabrik', 'modüler yapı', 'konteyner ev', 'tiny house', 'çelik yapı'];

    // Kaynak sayfayı çek
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

    const prompt = `Bu bir haber sitesinin ana sayfası içeriğidir. Sayfadaki haber linklerinden şu anahtar kelimelere uygun olanları bul: [${kelimeler.join(', ')}].

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

    const aiResult = await callGemini(GEMINI_KEY, prompt);

    if (!aiResult.ok) {
      // Gerçek hata mesajını kullanıcıya geri dön (debug için kritik)
      const userMsg = aiResult.status === 429
        ? 'AI günlük kullanım limitine ulaşıldı. Yarın tekrar deneyin veya manuel ekleyin.'
        : aiResult.status === 403
        ? 'AI API key hatalı veya izinler eksik. Vercel env değişkenlerini kontrol edin.'
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
