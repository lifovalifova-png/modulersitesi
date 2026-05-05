export const config = { runtime: 'edge' };

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
        console.error(`[fetch-news] ${model} failed:`, res.status, lastError);
        if (res.status === 429 || res.status === 404) continue;
        return { ok: false, error: lastError, status: res.status };
      }

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      if (!text) {
        lastError = 'Boş yanıt';
        console.error(`[fetch-news] ${model} returned empty text`, JSON.stringify(data).slice(0, 500));
        continue;
      }

      console.log(`[fetch-news] ${model} success`);
      return { ok: true, text };
    } catch (e) {
      lastError = String(e);
      console.error(`[fetch-news] ${model} exception:`, e);
    }
  }

  return { ok: false, error: lastError || 'Tüm modeller başarısız', status: lastStatus };
}

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
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8',
        },
        signal: AbortSignal.timeout(8000),
      });

      if (!pageRes.ok) {
        console.error(`[fetch-news] Page fetch HTTP ${pageRes.status}: ${url}`);
      } else {
        const html = await pageRes.text();
        // Daha akıllı içerik çıkarma: <article>, <main>, <h1>, <p> önceliği
        const articleMatch = html.match(/<article[\s\S]*?<\/article>/i);
        const mainMatch = html.match(/<main[\s\S]*?<\/main>/i);
        const sourceHtml = articleMatch?.[0] || mainMatch?.[0] || html;

        pageText = sourceHtml
          .replace(/<script[\s\S]*?<\/script>/gi, '')
          .replace(/<style[\s\S]*?<\/style>/gi, '')
          .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
          .replace(/<[^>]*>/g, ' ')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 5000); // 3000'den 5000'e çıkardım, daha iyi özet için

        console.log(`[fetch-news] Fetched ${url}, content length: ${pageText.length}`);
      }
    } catch (e) {
      console.error('[fetch-news] Page fetch exception:', e);
      pageText = '';
    }

    // Scraping engellenmiş veya içerik çok kısa — partial döndür
    if (!pageText || pageText.length < 200) {
      console.warn(`[fetch-news] Content too short (${pageText.length} chars), returning partial for ${url}`);
      return jsonResponse({
        partial: true,
        message: 'Kaynak içeriği otomatik alınamadı. Lütfen manuel doldurun.',
        titleTR: titleFromURL(url),
        titleEN: '',
        summaryTR: '',
        summaryEN: '',
        sourceName,
        publishDate: null,
        category: '',
      });
    }

    const prompt = `Aşağıdaki haber içeriğinden bilgileri çıkar ve SADECE JSON döndür, başka hiçbir şey yazma. Markdown kod bloğu kullanma:

${pageText}

JSON formatı:
{
  "titleTR": "Türkçe başlık (haberden çıkar, en az 15 karakter)",
  "titleEN": "English title (translate the Turkish title, at least 15 chars)",
  "summaryTR": "2-3 cümle Türkçe özet (en az 50 karakter, içerikten anahtar bilgiyi al)",
  "summaryEN": "2-3 sentence English summary (translate the Turkish summary, at least 50 chars)",
  "sourceName": "Kaynak site adı",
  "publishDate": "YYYY-MM-DD veya null",
  "category": "Sektör Haberleri" 
}

Category SADECE şu beşten biri olabilir: "Sektör Haberleri", "Teknoloji", "Piyasa", "Mevzuat", "Etkinlik". Emin değilsen "Sektör Haberleri" döndür.`;

    const aiResult = await callGemini(GEMINI_KEY, prompt);

    if (!aiResult.ok) {
      const userMsg = aiResult.status === 429
        ? 'AI günlük kullanım limitine ulaşıldı. Yarın tekrar deneyin.'
        : aiResult.status === 403
        ? 'AI API key hatalı. Vercel env değişkenlerini kontrol edin.'
        : `AI hatası: ${aiResult.error}`;

      console.error('[fetch-news] AI call failed:', userMsg);
      return jsonResponse({
        error: userMsg,
        partial: {
          titleTR: titleFromURL(url),
          titleEN: '',
          summaryTR: '',
          summaryEN: '',
          sourceName,
          publishDate: null,
          category: '',
        },
      });
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = extractJSON(aiResult.text);
    } catch (e) {
      console.error('[fetch-news] JSON parse failed:', e, 'Raw:', aiResult.text.slice(0, 300));
      return jsonResponse({
        error: 'AI yanıtı parse edilemedi',
        partial: {
          titleTR: titleFromURL(url),
          titleEN: '',
          summaryTR: '',
          summaryEN: '',
          sourceName,
          publishDate: null,
          category: '',
        },
      });
    }

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
    console.error('[fetch-news] Top-level error:', err);
    const sourceName = getDomainAsSourceName(url);
    return jsonResponse({
      error: String(err),
      partial: {
        titleTR: titleFromURL(url),
        titleEN: '',
        summaryTR: '',
        summaryEN: '',
        sourceName,
        publishDate: null,
        category: '',
      },
    });
  }
}
