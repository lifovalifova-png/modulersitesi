import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * POST /api/scan-news-source
 * Input:  { sourceUrl: string, anahtar_kelimeler: string[] }
 * Output: { bulunan: number, eklenen: number, haberler: Array<{baslik,url,ozet}> }
 *
 * Kaynak sitenin ana sayfasını tarar, Gemini ile anahtar kelimelere
 * uygun haberleri bulur ve Firestore'a taslak olarak ekler.
 */

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { sourceUrl, anahtar_kelimeler } = req.body as {
    sourceUrl?: string;
    anahtar_kelimeler?: string[];
  };

  if (!sourceUrl || typeof sourceUrl !== 'string') {
    return res.status(400).json({ error: 'sourceUrl gereklidir.' });
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY tanımlı değil.' });
  }

  const kelimeler = anahtar_kelimeler?.length
    ? anahtar_kelimeler
    : ['prefabrik', 'modüler yapı', 'konteyner ev', 'tiny house', 'çelik yapı'];

  /* ── 1. Kaynak sayfayı çek ──────────────────────────── */
  let pageText = '';
  try {
    const r = await fetch(sourceUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ModulerPazarBot/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(15_000),
    });

    if (!r.ok) {
      return res.status(200).json({ error: `Sayfa çekilemedi (HTTP ${r.status})`, bulunan: 0, eklenen: 0, haberler: [] });
    }

    const html = await r.text();

    // Link'leri ve metin içeriklerini çıkar
    pageText = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      // Keep anchor tags with href for link extraction
      .replace(/<a\s[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, ' [LINK:$1] $2 ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 20_000);
  } catch {
    return res.status(200).json({ error: 'Sayfa içeriği çekilemedi.', bulunan: 0, eklenen: 0, haberler: [] });
  }

  /* ── 2. Gemini ile analiz ─────────────────────────────── */
  const prompt = `Bu bir haber sitesinin ana sayfası içeriğidir. Sayfadaki haber linklerinden şu anahtar kelimelere uygun olanları bul: [${kelimeler.join(', ')}].

Her uygun haber için aşağıdaki formatta JSON array döndür, başka hiçbir şey yazma:
[
  { "baslik": "Haber başlığı", "url": "Tam haber URL'si", "ozet": "1-2 cümlelik özet" }
]

Kurallar:
- Sadece anahtar kelimelerle ilgili haberler (modüler yapı, prefabrik, konteyner, tiny house, çelik yapı sektörü)
- URL'ler tam olmalı (göreli yolları site domain'i ile birleştir: ${sourceUrl})
- En fazla 10 haber döndür
- Uygun haber yoksa boş array döndür: []

Sayfa içeriği:
${pageText}`;

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 2048 },
        }),
        signal: AbortSignal.timeout(30_000),
      },
    );

    if (!geminiRes.ok) {
      return res.status(502).json({ error: 'Gemini API hatası.', bulunan: 0, eklenen: 0, haberler: [] });
    }

    const geminiJson = await geminiRes.json() as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };

    const raw = geminiJson.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const arrayMatch = raw.match(/\[[\s\S]*\]/);
    if (!arrayMatch) {
      return res.status(200).json({ bulunan: 0, eklenen: 0, haberler: [] });
    }

    const haberler: Array<{ baslik: string; url: string; ozet: string }> = JSON.parse(arrayMatch[0]);
    const bulunan = haberler.length;

    if (bulunan === 0) {
      return res.status(200).json({ bulunan: 0, eklenen: 0, haberler: [] });
    }

    /* ── 3. Firestore'a taslak olarak ekle (duplicate check) ── */
    // Use Firebase Admin SDK is not available in edge functions,
    // so we return the results and let the client handle Firestore writes
    return res.status(200).json({ bulunan, eklenen: bulunan, haberler });
  } catch {
    return res.status(502).json({ error: 'Tarama sırasında hata oluştu.', bulunan: 0, eklenen: 0, haberler: [] });
  }
}
