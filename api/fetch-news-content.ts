import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * POST /api/fetch-news-content
 * Input:  { url: string }
 * Output: { titleTR, titleEN, summaryTR, summaryEN, sourceName, publishDate, category }
 *
 * URL'deki haber içeriğini Gemini ile analiz eder,
 * admin haber formunu otomatik doldurur.
 */

interface GeminiResult {
  titleTR:     string;
  titleEN:     string;
  summaryTR:   string;
  summaryEN:   string;
  sourceName:  string;
  publishDate: string | null;
  category:    string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.body as { url?: string };
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'URL gereklidir.' });
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY tanımlı değil.' });
  }

  /* ── 1. URL'den içerik çek ────────────────────────────── */
  let pageText = '';
  let fetchFailed = false;

  try {
    const r = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ModulerPazarBot/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(10_000),
    });

    if (!r.ok) {
      fetchFailed = true;
    } else {
      const html = await r.text();
      // Strip HTML tags, keep text
      pageText = html
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 15_000); // Gemini token limiti için kırp
    }
  } catch {
    fetchFailed = true;
  }

  /* Fetch başarısız — sadece domain'den sourceName çıkar */
  if (fetchFailed || !pageText) {
    let sourceName = '';
    try {
      sourceName = new URL(url).hostname.replace('www.', '');
    } catch { /* ignore */ }

    return res.status(200).json({
      partial: true,
      message: 'Sayfa içeriği çekilemedi, lütfen manuel doldurun.',
      sourceName,
      titleTR: '', titleEN: '', summaryTR: '', summaryEN: '',
      publishDate: null, category: '',
    });
  }

  /* ── 2. Gemini'ye gönder ──────────────────────────────── */
  const prompt = `Bu haber metninden şunları çıkar ve SADECE JSON döndür, başka hiçbir şey yazma:
{
  "titleTR": "Türkçe başlık",
  "titleEN": "İngilizce başlık",
  "summaryTR": "2-3 cümlelik Türkçe özet",
  "summaryEN": "2-3 cümlelik İngilizce özet",
  "sourceName": "kaynak site adı (ör: Hürriyet, AA, Reuters)",
  "publishDate": "YYYY-MM-DD formatında yayın tarihi, bulamazsan null",
  "category": "şu seçeneklerden BİRİ: Sektör Haberleri / Teknoloji / Piyasa / Mevzuat / Etkinlik"
}

Haber metni:
${pageText}`;

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 1024,
          },
        }),
        signal: AbortSignal.timeout(30_000),
      },
    );

    if (!geminiRes.ok) {
      const err = await geminiRes.text();
      return res.status(502).json({ error: 'Gemini API hatası', detail: err });
    }

    const geminiJson = await geminiRes.json() as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };

    const raw = geminiJson.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    // JSON bloğunu bul (```json ... ``` veya direkt JSON)
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(502).json({ error: 'Gemini geçerli JSON döndürmedi.' });
    }

    const parsed: GeminiResult = JSON.parse(jsonMatch[0]);

    return res.status(200).json({
      partial: false,
      titleTR:     parsed.titleTR     ?? '',
      titleEN:     parsed.titleEN     ?? '',
      summaryTR:   parsed.summaryTR   ?? '',
      summaryEN:   parsed.summaryEN   ?? '',
      sourceName:  parsed.sourceName  ?? '',
      publishDate: parsed.publishDate ?? null,
      category:    parsed.category    ?? '',
    });
  } catch (e) {
    return res.status(502).json({ error: 'Gemini isteği başarısız.', detail: String(e) });
  }
}
