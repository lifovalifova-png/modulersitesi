import type { Haber } from '../types/haber';

const ACIL_KELIMELER = [
  'deprem', 'earthquake', 'sel', 'flood', 'yangın', 'fire',
  'afet', 'disaster', 'tsunami', 'heyelan', 'landslide',
  'fırtına', 'storm', 'acil', 'urgent', 'yıkım', 'collapse',
];

const REGULASYON_KELIMELER = [
  'yönetmelik', 'regulation', 'kanun', 'law', 'mevzuat', 'legislation',
  'standart', 'standard', 'tse', 'imar', 'zoning', 'ruhsat', 'permit',
  'tbdy', 'yasa', 'genelge', 'tebliğ', 'resmi gazete',
];

function kelimeEslestir(metin: string, kelimeler: string[]): number {
  const lower = metin.toLowerCase();
  return kelimeler.filter(k => lower.includes(k)).length;
}

export function oncelikSkoru(h: Haber): number {
  let skor = 0;

  const tumMetin = [h.baslikTr, h.baslikEn, h.ozetTr, h.ozetEn].join(' ');

  const acilSayi = kelimeEslestir(tumMetin, ACIL_KELIMELER);
  skor += acilSayi * 20;

  const regulasyonSayi = kelimeEslestir(tumMetin, REGULASYON_KELIMELER);
  skor += regulasyonSayi * 10;

  if (h.tarih) {
    const simdi = Date.now();
    const haberZaman = h.tarih.seconds * 1000;
    const gunFarki = (simdi - haberZaman) / (1000 * 60 * 60 * 24);
    if (gunFarki <= 1) skor += 15;
    else if (gunFarki <= 3) skor += 10;
    else if (gunFarki <= 7) skor += 5;
  }

  if (h.oncelikSkoru) {
    skor += h.oncelikSkoru;
  }

  return skor;
}

export function siralaHaberler(haberler: Haber[]): Haber[] {
  return [...haberler].sort((a, b) => {
    const skorFark = oncelikSkoru(b) - oncelikSkoru(a);
    if (skorFark !== 0) return skorFark;
    const tarihA = a.tarih?.seconds ?? 0;
    const tarihB = b.tarih?.seconds ?? 0;
    return tarihB - tarihA;
  });
}
