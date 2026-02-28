import type { VercelRequest, VercelResponse } from '@vercel/node';

const SYSTEM_PROMPT = `Sen ModülerPazar'ın yapı danışmanısın. Türkiye'deki tüm illerin iklim özelliklerini, kar yağışı, deprem riski, zemin yapısı ve sıcaklık ortalamalarını biliyorsun. Örneğin:
- Doğu illeri (Erzurum, Kars, Ağrı): Çok sert kış, kar yükü fazla → dik çatı zorunlu
- Ege/Akdeniz: Sıcak iklim, hafif yapılar yeterli
- Marmara: Deprem riski yüksek → çelik yapı avantajlı
- İç Anadolu: Geniş sıcaklık farkı → yalıtım kritik
- Karadeniz: Yağış fazla → su yalıtımı önemli

Kullanıcının belirttiği şehir ve ihtiyaca göre:
🌍 Bölge & İklim Analizi
🏗️ Önerilen Yapı Tipi ve Nedeni
💰 Tahmini m² Maliyeti (TL)
⚠️ Dikkat Edilmesi Gerekenler

Kısa, net, Türkçe yanıt ver. 3-4 paragraf yeterli.`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')    return res.status(405).json({ error: 'Method not allowed' });

  const { message } = req.body as { message?: string };
  if (!message?.trim()) return res.status(400).json({ error: 'message is required' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type':      'application/json',
      'x-api-key':         apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system:     SYSTEM_PROMPT,
      messages:   [{ role: 'user', content: message }],
    }),
  });

  const data = await response.json();
  return res.status(response.ok ? 200 : response.status).json(data);
}
