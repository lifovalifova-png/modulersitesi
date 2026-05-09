export interface Haber {
  id: string;

  baslikTr: string;
  baslikEn: string;
  ozetTr: string;
  ozetEn: string;
  icerikTr: string;
  icerikEn: string;

  /** @deprecated eski alan — fallback için */
  baslik?: string;
  /** @deprecated eski alan — fallback için */
  ozet?: string;
  /** @deprecated eski alan — fallback için */
  icerik?: string;

  kaynak: string;
  kaynakUrl: string;
  gorselUrl?: string;
  tarih: { seconds: number; nanoseconds: number } | null;
  kategori: string;
  bolge?: string;

  yayinda: boolean;
  arsivlendi?: boolean;
  oncelikSkoru?: number;
}

export function haberBaslik(h: Haber, lang: 'tr' | 'en'): string {
  if (lang === 'en') return h.baslikEn || h.baslikTr || h.baslik || '';
  return h.baslikTr || h.baslik || '';
}

export function haberOzet(h: Haber, lang: 'tr' | 'en'): string {
  if (lang === 'en') return h.ozetEn || h.ozetTr || h.ozet || '';
  return h.ozetTr || h.ozet || '';
}

export function haberIcerik(h: Haber, lang: 'tr' | 'en'): string {
  if (lang === 'en') return h.icerikEn || h.icerikTr || h.icerik || '';
  return h.icerikTr || h.icerik || '';
}

export function firestoreToHaber(id: string, data: Record<string, unknown>): Haber {
  return {
    id,
    baslikTr: (data.baslikTr ?? data.baslik ?? '') as string,
    baslikEn: (data.baslikEn ?? '') as string,
    ozetTr: (data.ozetTr ?? data.ozet ?? '') as string,
    ozetEn: (data.ozetEn ?? '') as string,
    icerikTr: (data.icerikTr ?? data.icerik ?? '') as string,
    icerikEn: (data.icerikEn ?? '') as string,
    baslik: data.baslik as string | undefined,
    ozet: data.ozet as string | undefined,
    icerik: data.icerik as string | undefined,
    kaynak: (data.kaynak ?? '') as string,
    kaynakUrl: (data.kaynakUrl ?? '') as string,
    gorselUrl: data.gorselUrl as string | undefined,
    tarih: data.tarih as Haber['tarih'],
    kategori: (data.kategori ?? 'genel') as string,
    bolge: data.bolge as string | undefined,
    yayinda: (data.yayinda ?? false) as boolean,
    arsivlendi: data.arsivlendi as boolean | undefined,
    oncelikSkoru: data.oncelikSkoru as number | undefined,
  };
}
