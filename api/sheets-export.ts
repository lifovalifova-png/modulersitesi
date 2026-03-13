/**
 * api/sheets-export.ts — Vercel Edge Function
 * Tarayıcı CORS kısıtlamalarını aşmak için Google Apps Script
 * webhook URL'sine server-side proxy görevi görür.
 *
 * Ortam değişkeni: SHEETS_WEBHOOK_URL
 * Vercel Dashboard → Settings → Environment Variables
 */
export const config = { runtime: 'edge' };

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

export default async function handler(req: Request) {
  /* CORS preflight */
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Yalnızca POST desteklenmektedir.' }, 405);
  }

  /* Body parse */
  let body: Record<string, unknown>;
  try {
    body = await req.json() as Record<string, unknown>;
  } catch {
    return json({ error: 'Geçersiz JSON gövdesi.' }, 400);
  }

  /* Webhook URL: önce client'tan gelen body.webhookUrl, sonra server env */
  const webhookUrl =
    (typeof body.webhookUrl === 'string' && body.webhookUrl) ||
    process.env.VITE_SHEETS_WEBHOOK_URL ||
    process.env.SHEETS_WEBHOOK_URL;

  if (!webhookUrl) {
    return json({
      error: 'VITE_SHEETS_WEBHOOK_URL ortam değişkeni tanımlı değil.',
      hint: 'Vercel Dashboard → Settings → Environment Variables → VITE_SHEETS_WEBHOOK_URL ekleyin.',
    }, 503);
  }

  /* Google Apps Script'e yönlendir (webhookUrl alanını çıkar) */
  const { webhookUrl: _url, ...payload } = body;
  void _url;
  try {
    const resp = await fetch(webhookUrl, {
      method:  'POST',
      // GAS'ın CORS preflight gerektirmemesi için text/plain kullanılır
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body:    JSON.stringify(payload),
    });

    const text = await resp.text();

    /* GAS bazen HTML döner — JSON ise parse et */
    let gasData: unknown = text;
    try { gasData = JSON.parse(text); } catch { /* ham text döner */ }

    return json({ ok: true, gasResponse: gasData });
  } catch (err) {
    return json({
      error:  'Google Apps Script webhook hatası.',
      detail: String(err),
    }, 502);
  }
}
