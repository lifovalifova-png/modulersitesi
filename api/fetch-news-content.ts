export const config = { runtime: 'edge' };

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { url } = await req.json();
    if (!url) return new Response(JSON.stringify({ error: 'URL gerekli' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

    const GEMINI_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_KEY) return new Response(JSON.stringify({ error: 'API key eksik' }), { status: 500, headers: { 'Content-Type': 'application/json' } });

    // Sayfayı çek
    let pageText = '';
    try {
      const pageRes = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ModulerPazar/1.0)' },
        signal: AbortSignal.timeout(8000),
      });
      const html = await pageRes.text();
      pageText = html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').slice(0, 3000);
    } catch {
      pageText = `URL: ${url}`;
    }

    if (!pageText || pageText.length < 100) {
      const domain = new URL(url).hostname.replace('www.', '');
      pageText = `Bu haber ${domain} sitesinden alınmıştır. URL: ${url}`;
    }

    // Fetch başarısız — partial döndür
    if (!pageText || pageText === `URL: ${url}`) {
      let sourceName = '';
      try { sourceName = new URL(url).hostname.replace('www.', ''); } catch { /* ignore */ }
      return new Response(JSON.stringify({
        partial: true,
        message: 'Sayfa içeriği çekilemedi, lütfen manuel doldurun.',
        sourceName,
        titleTR: '', titleEN: '', summaryTR: '', summaryEN: '',
        publishDate: null, category: '',
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    // Gemini'ye gönder
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Aşağıdaki haber içeriğinden bilgileri çıkar ve SADECE JSON döndür, başka hiçbir şey yazma:

${pageText}

JSON formatı:
{
  "titleTR": "Türkçe başlık",
  "titleEN": "English title",
  "summaryTR": "2-3 cümle Türkçe özet",
  "summaryEN": "2-3 sentence English summary",
  "sourceName": "Kaynak site adı",
  "publishDate": "YYYY-MM-DD veya null",
  "category": "Sektör Haberleri veya Teknoloji veya Piyasa veya Mevzuat veya Etkinlik"
}`,
            }],
          }],
          generationConfig: { temperature: 0.1 },
        }),
      },
    );

    const geminiData = await geminiRes.json();
    const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    if (!text) {
      return new Response(JSON.stringify({ error: 'Gemini boş yanıt döndürdü' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // JSON bloğunu bul — başındaki/sonundaki her şeyi temizle
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return new Response(JSON.stringify({ error: 'JSON parse edilemedi', raw: text.slice(0, 200) }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      return new Response(JSON.stringify({ error: 'JSON geçersiz', raw: jsonMatch[0].slice(0, 200) }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      partial: false,
      titleTR:     parsed.titleTR     ?? '',
      titleEN:     parsed.titleEN     ?? '',
      summaryTR:   parsed.summaryTR   ?? '',
      summaryEN:   parsed.summaryEN   ?? '',
      sourceName:  parsed.sourceName  ?? '',
      publishDate: parsed.publishDate ?? null,
      category:    parsed.category    ?? '',
    }), { headers: { 'Content-Type': 'application/json' } });

  } catch (err) {
    return new Response(JSON.stringify({ error: 'İşlem başarısız: ' + String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
