const BLOCKED_HOST = /^(localhost|127\.|10\.|192\.168\.|169\.254\.|0\.0\.0\.0|\[?::1\]?|172\.(1[6-9]|2\d|3[01])\.)/i;

export function safeUrl(input: unknown): { ok: true; url: string } | { ok: false; error: string } {
  if (typeof input !== 'string' || input.length > 2048) {
    return { ok: false, error: 'Geçersiz URL.' };
  }
  let u: URL;
  try {
    u = new URL(input);
  } catch {
    return { ok: false, error: 'Geçersiz URL.' };
  }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') {
    return { ok: false, error: 'Sadece http/https.' };
  }
  if (u.username || u.password) {
    return { ok: false, error: 'URL kimlik bilgisi içeremez.' };
  }
  if (BLOCKED_HOST.test(u.hostname) || !u.hostname.includes('.')) {
    return { ok: false, error: 'Bu adres taranamaz.' };
  }
  return { ok: true, url: u.href };
}
