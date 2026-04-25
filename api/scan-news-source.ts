export const config = { runtime: 'edge' };

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

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
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ModulerPazar/1.0)' },
        signal: AbortSignal.timeout(10_000),
      });
      if (!r.ok) {
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
    } catch {
      return json({ error: 'Sayfa içeriği çekilemedi.', bulunan: 0, eklenen: 0, haberler: [] });
    }

    // Gemini ile analiz
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Bu bir haber sitesinin ana sayfası içeriğidir. Sayfadaki haber linklerinden şu anahtar kelimelere uygun olanları bul: [${kelimeler.join(', ')}].

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
${pageText}`,
            }],
          }],
          generationConfig: { temperature: 0.1 },
        }),
      },
    );

    const geminiData = await geminiRes.json();
    const raw = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const clean = raw.replace(/```json|```/g, '').trim();
    const arrayMatch = clean.match(/\[[\s\S]*\]/);
    if (!arrayMatch) {
      return json({ bulunan: 0, eklenen: 0, haberler: [] });
    }

    const haberler: Array<{ baslik: string; url: string; ozet: string }> = JSON.parse(arrayMatch[0]);

    return json({ bulunan: haberler.length, eklenen: haberler.length, haberler });

  } catch (err) {
    return json({ error: 'Tarama sırasında hata oluştu: ' + String(err), bulunan: 0, eklenen: 0, haberler: [] }, 500);
  }
}
