import type { Ilan } from '../hooks/useIlanlar';

/** 30 gün (milisaniye) */
export const ILAN_SURESI_MS = 30 * 24 * 60 * 60 * 1000;

/** İlanın süresinin dolup dolmadığını kontrol eder */
export function isIlanExpired(ilan: Pick<Ilan, 'ilanBitis' | 'aktif'>, now = Date.now()): boolean {
  if (!ilan.ilanBitis) return false;
  return ilan.ilanBitis.seconds * 1000 < now;
}

/** İlanın kalan gün sayısını hesaplar (negatif = süresi dolmuş) */
export function kalanGun(ilan: Pick<Ilan, 'ilanBitis'>, now = Date.now()): number | null {
  if (!ilan.ilanBitis) return null;
  return Math.ceil((ilan.ilanBitis.seconds * 1000 - now) / (24 * 60 * 60 * 1000));
}

/** İlanın aktif ve süresinin dolmamış olup olmadığını kontrol eder */
export function isIlanActive(ilan: Pick<Ilan, 'status' | 'aktif' | 'ilanBitis'>, now = Date.now()): boolean {
  if (ilan.status !== 'aktif') return false;
  if (ilan.aktif === false) return false;
  if (ilan.ilanBitis && ilan.ilanBitis.seconds * 1000 < now) return false;
  return true;
}

/** Süresi dolan ilanları filtreler (batch deaktivasyonu için) */
export function filterExpiredIlanlar<T extends Pick<Ilan, 'ilanBitis' | 'aktif'>>(
  ilanlar: T[],
  now = Date.now(),
): T[] {
  return ilanlar.filter(
    (ilan) => ilan.ilanBitis && ilan.aktif !== false && ilan.ilanBitis.seconds * 1000 < now,
  );
}
