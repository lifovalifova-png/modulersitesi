/**
 * XSS koruma ve girdi doğrulama yardımcıları.
 * Tüm Firestore'a yazılan metin verileri submit öncesi buradan geçmeli.
 */

/** HTML taglerini kaldırır, boşlukları düzeltir, max uzunluğu kesmek. */
export function sanitizeText(str: string, maxLen = 2000): string {
  return str
    .replace(/<[^>]*>/g, '')          // HTML taglerini sil
    .replace(/&[a-z]+;/gi, ' ')       // HTML entity'leri boşluğa çevir
    .replace(/[<>'"]/g, '')           // Kalan tehlikeli karakterleri sil
    .trim()
    .slice(0, maxLen);
}

/** Sadece https:// ile başlayan URL'leri kabul eder. Geçersizse boş string döner. */
export function sanitizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return '';
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:') return '';
    return parsed.href;
  } catch {
    return '';
  }
}

/** Türk telefon formatı: 05xx xxx xx xx veya +90 5xx xxx xx xx */
export function validatePhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-().]/g, '');
  return /^(\+90|0090|0)?5\d{9}$/.test(cleaned);
}

/** Email format doğrulama */
export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

/** Vergi numarası: tam olarak 10 rakam */
export function validateVergiNo(no: string): boolean {
  return /^\d{10}$/.test(no.trim());
}
