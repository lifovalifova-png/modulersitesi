import { describe, it, expect } from 'vitest';
import {
  ILAN_SURESI_MS,
  isIlanExpired,
  kalanGun,
  isIlanActive,
  filterExpiredIlanlar,
} from '../ilanExpiry';

/* ── Yardımcı: Timestamp benzeri nesne üret ─────────────── */
function ts(dateMs: number) {
  return { seconds: dateMs / 1000, nanoseconds: 0 };
}

const NOW = Date.now();

describe('ILAN_SURESI_MS', () => {
  it('30 gün = 2_592_000_000 ms', () => {
    expect(ILAN_SURESI_MS).toBe(30 * 24 * 60 * 60 * 1000);
  });
});

describe('isIlanExpired', () => {
  it('ilanBitis geçmişte → süresi dolmuş', () => {
    const ilan = { ilanBitis: ts(NOW - 1000), aktif: true };
    expect(isIlanExpired(ilan, NOW)).toBe(true);
  });

  it('ilanBitis gelecekte → süresi dolmamış', () => {
    const ilan = { ilanBitis: ts(NOW + 86400000), aktif: true };
    expect(isIlanExpired(ilan, NOW)).toBe(false);
  });

  it('ilanBitis undefined → süresi dolmamış', () => {
    const ilan = { ilanBitis: undefined, aktif: true };
    expect(isIlanExpired(ilan, NOW)).toBe(false);
  });

  it('ilanBitis null → süresi dolmamış', () => {
    const ilan = { ilanBitis: null, aktif: true };
    expect(isIlanExpired(ilan, NOW)).toBe(false);
  });

  it('tam 30 gün sonra süresi dolmuş olur', () => {
    const olusturma = NOW - ILAN_SURESI_MS;
    const bitis = olusturma + ILAN_SURESI_MS; // = NOW
    const ilan = { ilanBitis: ts(bitis), aktif: true };
    // NOW anında bitis = NOW → seconds * 1000 < NOW false (eşit, henüz dolmamış)
    expect(isIlanExpired(ilan, NOW)).toBe(false);
    // 1ms sonra dolmuş
    expect(isIlanExpired(ilan, NOW + 1)).toBe(true);
  });
});

describe('kalanGun', () => {
  it('10 gün kalmış → 10 döner', () => {
    const ilan = { ilanBitis: ts(NOW + 10 * 86400000) };
    expect(kalanGun(ilan, NOW)).toBe(10);
  });

  it('süresi 2 gün önce dolmuş → -2 döner', () => {
    const ilan = { ilanBitis: ts(NOW - 2 * 86400000) };
    expect(kalanGun(ilan, NOW)).toBe(-2);
  });

  it('ilanBitis yok → null döner', () => {
    expect(kalanGun({ ilanBitis: undefined }, NOW)).toBeNull();
    expect(kalanGun({ ilanBitis: null }, NOW)).toBeNull();
  });

  it('yarım gün kalmış → 1 gün olarak yukarı yuvarlar', () => {
    const ilan = { ilanBitis: ts(NOW + 12 * 3600000) }; // 12 saat
    expect(kalanGun(ilan, NOW)).toBe(1);
  });
});

describe('isIlanActive', () => {
  it('aktif + süresi dolmamış → true', () => {
    const ilan = { status: 'aktif' as const, aktif: true, ilanBitis: ts(NOW + 86400000) };
    expect(isIlanActive(ilan, NOW)).toBe(true);
  });

  it('pasif status → false', () => {
    const ilan = { status: 'pasif' as const, aktif: true, ilanBitis: ts(NOW + 86400000) };
    expect(isIlanActive(ilan, NOW)).toBe(false);
  });

  it('aktif: false → false', () => {
    const ilan = { status: 'aktif' as const, aktif: false, ilanBitis: ts(NOW + 86400000) };
    expect(isIlanActive(ilan, NOW)).toBe(false);
  });

  it('süresi dolmuş → false', () => {
    const ilan = { status: 'aktif' as const, aktif: true, ilanBitis: ts(NOW - 1000) };
    expect(isIlanActive(ilan, NOW)).toBe(false);
  });

  it('ilanBitis yok + aktif → true', () => {
    const ilan = { status: 'aktif' as const, aktif: undefined, ilanBitis: undefined };
    expect(isIlanActive(ilan, NOW)).toBe(true);
  });
});

describe('filterExpiredIlanlar', () => {
  const aktifGecerli  = { ilanBitis: ts(NOW + 86400000), aktif: true };
  const aktifSureDolmus = { ilanBitis: ts(NOW - 1000), aktif: true };
  const zatenKapali    = { ilanBitis: ts(NOW - 1000), aktif: false };
  const bitisSizAktif  = { ilanBitis: undefined, aktif: true };

  it('sadece süresi dolmuş + aktif olanları döner', () => {
    const result = filterExpiredIlanlar(
      [aktifGecerli, aktifSureDolmus, zatenKapali, bitisSizAktif],
      NOW,
    );
    expect(result).toEqual([aktifSureDolmus]);
  });

  it('hepsi geçerli → boş dizi', () => {
    expect(filterExpiredIlanlar([aktifGecerli, bitisSizAktif], NOW)).toEqual([]);
  });

  it('boş dizi → boş dizi', () => {
    expect(filterExpiredIlanlar([], NOW)).toEqual([]);
  });
});

describe('yenileme senaryosu', () => {
  it('süresi dolmuş ilan yenilenince 30 gün daha aktif olur', () => {
    // 31 gün önce oluşturulmuş, süresi dolmuş ilan
    const eskiBitis = NOW - 1 * 86400000; // 1 gün önce dolmuş
    const ilan = { ilanBitis: ts(eskiBitis), aktif: false, status: 'aktif' as const };

    expect(isIlanExpired(ilan, NOW)).toBe(true);
    expect(isIlanActive(ilan, NOW)).toBe(false);

    // Yenileme: ilanBitis = NOW + 30 gün, aktif = true
    const yeniIlan = {
      ...ilan,
      ilanBitis: ts(NOW + ILAN_SURESI_MS),
      aktif: true,
    };

    expect(isIlanExpired(yeniIlan, NOW)).toBe(false);
    expect(isIlanActive(yeniIlan, NOW)).toBe(true);
    expect(kalanGun(yeniIlan, NOW)).toBe(30);
  });
});
