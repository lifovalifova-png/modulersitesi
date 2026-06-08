export const config = { runtime: 'edge' };

const ALLOWED_ORIGINS = [
  'https://modulerpazar.com',
  'https://www.modulerpazar.com',
];

function getAllowedOrigin(req: Request): string | null {
  const origin = req.headers.get('origin') || '';
  if (ALLOWED_ORIGINS.includes(origin) || origin.endsWith('.vercel.app')) {
    return origin;
  }
  return null;
}

function corsHeaders(req: Request): Record<string, string> {
  const origin = getAllowedOrigin(req);
  if (!origin) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function json(data: unknown, status: number, req: Request) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(req) },
  });
}

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(req) });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Yalnızca POST desteklenmektedir.' }, 405, req);
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json() as Record<string, unknown>;
  } catch {
    return json({ error: 'Geçersiz JSON gövdesi.' }, 400, req);
  }

  const webhookUrl = process.env.SHEETS_WEBHOOK_URL;
  if (!webhookUrl) {
    console.error('SHEETS_WEBHOOK_URL ortam değişkeni tanımlı değil.');
    return json({ error: 'Sunucu yapılandırma hatası.' }, 500, req);
  }

  const { webhookUrl: _discard, ...payload } = body;
  void _discard;

  try {
    const resp = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    });

    const text = await resp.text();
    let gasData: unknown = text;
    try { gasData = JSON.parse(text); } catch { /* ham text döner */ }

    return json({ ok: true, gasResponse: gasData }, 200, req);
  } catch (err) {
    return json({
      error: 'Google Apps Script webhook hatası.',
      detail: String(err),
    }, 502, req);
  }
}
