export const config = { runtime: 'edge' };

const ANTHROPIC_MODEL = 'claude-sonnet-4-6';

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
      console.error(`[fetch-news-content] Claude failed:`, res.status, msg);
      return { ok: false, error: msg, status: res.status };
    }

    const text = data.content?.find(b => b.type === 'text')?.text ?? '';
    if (!text) {
      console.error('[fetch-news-content] Claude returned empty text');
      return { ok: false, error: 'Boş yanıt', status: 200 };
    }

    return { ok: true, text };
  } catch (e) {
    console.error('[fetch-news-content] Claude exception:', e);
    return { ok: false, error: String(e), status: 0 };
  }
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

  return JSON.parse(match[0]);
}

function extractContentFromHTML(html: string): string {
  const articleMatch = html.match(/<article[\s\S]*?<\/article>/i);
  const mainMatch = html.match(/<main[\s\S]*?<\/main>/i);
  const sourceHtml = articleMatch?.[0] || mainMatch?.[0] || html;

  return sourceHtml
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 6000);
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

const SYSTEM_PROMPT = `Sen deneyimli bir inşaat ve modüler yapı sektörü haber editörüsün.
Verilen haber içeriğinden bilgileri çıkar ve hem Türkçe hem İngilizce başlık, özet ve tam içerik üret.

İçerik kuralları:
- icerikTr ve icerikEn ZORUNLU — her biri 4 paragraf, 600-800 kelime
- Paragraflar \\n\\n ile ayrılmalı, her paragraf en az 3-4 cümle
- 1. paragraf: Giriş özet (kim, ne, nerede, ne zaman)
- 2. paragraf: Detay ve bağlam (rakamlar, teknik bilgi, arka plan)
- 3. paragraf: Sektöre etkisi (Türkiye modüler yapı pazarıyla ilişkilendir)
- 4. paragraf: Sonuç ve gelecek beklentisi
- Orijinal metni kopyalama, tamamen kendi cümlelerinle yaz
- Teknik terimleri doğru kullan
- Yabancı kaynaklardan gelen haberleri Türkçeye çevir, Türkçe kaynakları İngilizceye çevir

SADECE JSON döndür, başka hiçbir şey yazma. Markdown kod bloğu kullanma.`;

const JSON_HEADERS = { 'Content-Type': 'application/json' };

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

function emptyPartial(url: string, sourceName: string) {
  return {
    partial: true,
    message: 'Kaynak içeriği otomatik alınamadı. Lütfen manuel doldurun.',
    baslikTr: titleFromURL(url),
    baslikEn: '',
    ozetTr: '',
    ozetEn: '',
    icerikTr: '',
    icerikEn: '',
    sourceName,
    publishDate: null,
    category: '',
  };
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

    const API_KEY = process.env.ANTHROPIC_API_KEY;
    if (!API_KEY) return jsonResponse({ error: 'ANTHROPIC_API_KEY tanımlı değil' }, 500);

    const sourceName = getDomainAsSourceName(url);

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
        console.error(`[fetch-news-content] Page fetch HTTP ${pageRes.status}: ${url}`);
      } else {
        const html = await pageRes.text();
        pageText = extractContentFromHTML(html);
        console.log(`[fetch-news-content] Fetched ${url}, content length: ${pageText.length}`);
      }
    } catch (e) {
      console.error('[fetch-news-content] Page fetch exception:', e);
      pageText = '';
    }

    if (!pageText || pageText.length < 200) {
      console.warn(`[fetch-news-content] Content too short (${pageText.length} chars), returning partial for ${url}`);
      return jsonResponse(emptyPartial(url, sourceName));
    }

    const userMessage = `Aşağıdaki haber içeriğinden bilgileri çıkar:

${pageText}

JSON formatı:
{
  "baslikTr": "Türkçe başlık (en az 15 karakter)",
  "baslikEn": "English title (at least 15 chars)",
  "ozetTr": "2-3 cümle Türkçe özet (en az 50 karakter)",
  "ozetEn": "2-3 sentence English summary (at least 50 chars)",
  "icerikTr": "4 paragraf Türkçe içerik (600-800 kelime, paragraflar \\n\\n ile ayrılmalı)",
  "icerikEn": "4 paragraph English content (600-800 words, paragraphs separated by \\n\\n)",
  "sourceName": "Kaynak site adı",
  "publishDate": "YYYY-MM-DD veya null",
  "category": "Kategori"
}

Category SADECE şu beşten biri: "Sektör Haberleri", "Teknoloji", "Piyasa", "Mevzuat", "Etkinlik". Emin değilsen "Sektör Haberleri" döndür.`;

    const aiResult = await callClaude(API_KEY, SYSTEM_PROMPT, userMessage);

    if (!aiResult.ok) {
      const userMsg = aiResult.status === 429
        ? 'AI kullanım limitine ulaşıldı. Daha sonra tekrar deneyin.'
        : aiResult.status === 401
        ? 'API key hatalı. Vercel env değişkenlerini kontrol edin.'
        : `AI hatası: ${aiResult.error}`;

      console.error('[fetch-news-content] AI call failed:', userMsg);
      return jsonResponse({ error: userMsg, partial: emptyPartial(url, sourceName) });
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = extractJSON(aiResult.text);
    } catch (e) {
      console.error('[fetch-news-content] JSON parse failed:', e, 'Raw:', aiResult.text.slice(0, 300));
      return jsonResponse({ error: 'AI yanıtı parse edilemedi', partial: emptyPartial(url, sourceName) });
    }

    const baslikTr = (parsed.baslikTr as string) ?? '';
    const baslikEn = (parsed.baslikEn as string) ?? '';
    const ozetTr = (parsed.ozetTr as string) ?? '';
    const ozetEn = (parsed.ozetEn as string) ?? '';
    const icerikTr = (parsed.icerikTr as string) ?? '';
    const icerikEn = (parsed.icerikEn as string) ?? '';

    if (baslikTr.length < 10 || ozetTr.length < 30) {
      console.warn('[fetch-news-content] AI output too short, returning as partial');
      return jsonResponse({
        partial: true,
        message: 'AI çıktısı çok kısa. Manuel düzenleme önerilir.',
        baslikTr, baslikEn, ozetTr, ozetEn, icerikTr, icerikEn,
        sourceName: (parsed.sourceName as string) ?? sourceName,
        publishDate: (parsed.publishDate as string) ?? null,
        category: (parsed.category as string) ?? '',
      });
    }

    return jsonResponse({
      partial: false,
      baslikTr, baslikEn, ozetTr, ozetEn, icerikTr, icerikEn,
      sourceName: (parsed.sourceName as string) ?? sourceName,
      publishDate: (parsed.publishDate as string) ?? null,
      category: (parsed.category as string) ?? '',
    });

  } catch (err) {
    console.error('[fetch-news-content] Top-level error:', err);
    const sourceName = getDomainAsSourceName(url);
    return jsonResponse({ error: String(err), partial: emptyPartial(url, sourceName) });
  }
}
