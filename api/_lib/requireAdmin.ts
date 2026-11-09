const PROJECT = 'modulerpazar';

function decodeSub(token: string): string | null {
  try {
    const payload = token.split('.')[1];
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const sub = (JSON.parse(json) as { sub?: string }).sub;
    return typeof sub === 'string' && /^[A-Za-z0-9]{10,64}$/.test(sub) ? sub : null;
  } catch {
    return null;
  }
}

export type AdminCheck =
  | { ok: true; uid: string }
  | { ok: false; status: 401 | 403; error: string };

export async function requireAdmin(req: Request): Promise<AdminCheck> {
  const auth = req.headers.get('authorization') ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  if (!token) return { ok: false, status: 401, error: 'Giriş gerekli.' };

  const uid = decodeSub(token);
  if (!uid) return { ok: false, status: 401, error: 'Geçersiz token.' };

  const url =
    `https://firestore.googleapis.com/v1/projects/${PROJECT}` +
    `/databases/(default)/documents/admins/${uid}`;

  let res: Response;
  try {
    res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(5_000),
    });
  } catch {
    return { ok: false, status: 403, error: 'Yetki doğrulanamadı.' };
  }

  if (res.status === 200) return { ok: true, uid };
  return { ok: false, status: 403, error: 'Admin yetkisi gerekli.' };
}
