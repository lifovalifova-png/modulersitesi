import { requireAdmin } from './_lib/requireAdmin';

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

const ROW_FIELDS = ['ad', 'telefon', 'email', 'kategori', 'sehir', 'butce', 'tarih', 'status'] as const;
const MAX_ROWS = 500;
const MAX_LEN = 200;

/* Sheets formül enjeksiyonu: = + - @ ile başlayan değerin başına ' ekle */
function cell(v: unknown): string {
  const str = (v == null ? '' : String(v)).slice(0, MAX_LEN);
  return /^[=+\-@]/.test(str) ? `'${str}` : str;
}

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(req) });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Yalnızca POST desteklenmektedir.' }, 405, req);
  }

  const gate = await requireAdmin(req);
  if (!gate.ok) return json({ error: gate.error }, gate.status, req);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Geçersiz istek.' }, 400, req);
  }

  const rawRows = (body as { rows?: unknown } | null)?.rows;
  if (!Array.isArray(rawRows) || rawRows.length < 1 || rawRows.length > MAX_ROWS) {
    return json({ error: 'Geçersiz istek.' }, 400, req);
  }
  const rows = rawRows.map((r) => {
    const src = (r && typeof r === 'object' ? r : {}) as Record<string, unknown>;
    const out: Record<string, string> = {};
    for (const k of ROW_FIELDS) out[k] = cell(src[k]);
    return out;
  });

  const webhookUrl = process.env.SHEETS_WEBHOOK_URL;
  if (!webhookUrl) {
    console.error('SHEETS_WEBHOOK_URL ortam değişkeni tanımlı değil.');
    return json({ error: 'Sunucu yapılandırma hatası.' }, 500, req);
  }

  try {
    const resp = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ rows }),
    });
    if (!resp.ok) {
      console.error('Sheets webhook HTTP', resp.status);
      return json({ error: 'Aktarım başarısız.' }, 502, req);
    }
    return json({ ok: true, count: rows.length }, 200, req);
  } catch (err) {
    console.error('Sheets webhook hatası:', err);
    return json({ error: 'Aktarım başarısız.' }, 502, req);
  }
}
