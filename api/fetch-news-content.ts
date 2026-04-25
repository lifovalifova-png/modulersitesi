export const config = { runtime: 'edge' };

function extractJSON(text: string): Record<string, unknown> {
  if (!text || typeof text !== 'string') {
    throw new Error('Empty response from AI');
  }

  const cleaned = text
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();

  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error('No JSON object found in AI response');
  }

  try {
    return JSON.parse(match[0]);
  } catch (e) {
    throw new Error(`JSON parse failed: ${(e as Error).message}`);
  }
}

function getDomainAsSourceName(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, '').split('.')[0];
  } catch {
    return 'Bilinmeyen Kaynak';
  }
}

function titleFromURL(url: string): string {
  try {
    const path = new URL(url).pathname;
    const last = path.split('/').filter(Boolean).pop() ?? '';
    return decodeURIComponent(last)
      .replace(/[-_]/g, ' ')
      .replace(/\.\w+$/, '')
      .trim() || 'Başlıksız Haber';
  } catch {
    return 'Başlıksız Haber';
  }
}

const JSON_HEADERS = { 'Content-Type': 'application/json' };

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  let url = '';

  try {
    const body = await req.json();
    url = body.url ?? '';
    if (!url) return jsonResponse({ error: 'URL gerekli' }, 400);

    const GEMINI_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_KEY) return jsonResponse({ error: 'API key eksik' }, 500);

    const sourceName = getDomainAsSourceName(url);

    // Sayfayı çek
    let pageText = '';
    try {
      const pageRes = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ModulerPazar/1.0)' },
        signal: AbortSignal.timeout(8000),
      });
      const html = await pageRes.text();
      pageText = html
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .slice(0, 3000);
    } catch {
      pageText = '';
    }

    // Scraping engellenmiş veya içerik çok kısa — partial döndür
    if (!pageText || pageText.length < 100) {
      return jsonResponse({
        partial: true,
        message: 'Kaynak içeriği otomatik alınamadı. Lütfen manuel doldurun.',
        titleTR: titleFromURL(url),
        titleEN: '',
        summaryTR: 'Kaynak içeriği otomatik alınamadı. Lütfen manuel doldurun.',
        summaryEN: '',
        sourceName,
        publishDate: null,
        category: '',
      });
    }

    // Gemini'ye gönder
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: JSON_HEADERS,
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
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    const parsed = extractJSON(rawText);

    return jsonResponse({
      partial: false,
      titleTR:     (parsed.titleTR as string)     ?? '',
      titleEN:     (parsed.titleEN as string)     ?? '',
      summaryTR:   (parsed.summaryTR as string)   ?? '',
      summaryEN:   (parsed.summaryEN as string)   ?? '',
      sourceName:  (parsed.sourceName as string)  ?? sourceName,
      publishDate: (parsed.publishDate as string) ?? null,
      category:    (parsed.category as string)    ?? '',
    });

  } catch (err) {
    console.error('[fetch-news-content] Hata:', err);
    const sourceName = getDomainAsSourceName(url);
    return jsonResponse({
      error: String(err),
      partial: {
        titleTR: titleFromURL(url),
        titleEN: '',
        summaryTR: 'İşlem sırasında hata oluştu. Lütfen manuel doldurun.',
        summaryEN: '',
        sourceName,
        publishDate: null,
        category: '',
      },
    });
  }
}
