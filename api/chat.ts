export const config = { runtime: 'edge' };

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

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  const { message } = await req.json();

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: message }],
    }),
  });

  const data = await response.json();

  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
