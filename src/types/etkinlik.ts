export interface Etkinlik {
  id: string;
  baslik: string;
  slug: string;
  tur: 'fuar' | 'seminer' | 'konferans' | 'workshop' | 'webinar';

  baslangicTarihi: { seconds: number; nanoseconds: number };
  bitisTarihi: { seconds: number; nanoseconds: number };

  sehir: string;
  ilce?: string;
  mekan: string;
  adres?: string;
  harita?: { lat: number; lng: number };

  kisaAciklama: string;
  tamAciklama: string;
  kapakGorseli: string;
  galeriGorseller?: string[];

  kategoriler: string[];
  etiketler?: string[];

  organizator: string;
  organizatorWeb?: string;
  organizatorIletisim?: string;

  katilimUcretli: boolean;
  biletUcreti?: number;
  biletLinki?: string;

  katilanFirmalar?: string[];
  standNumaralari?: { firmaId: string; stand: string }[];

  olusturulmaTarihi: { seconds: number; nanoseconds: number };
  guncellenmeTarihi: { seconds: number; nanoseconds: number };
  durum: 'taslak' | 'yayinda' | 'arsiv';
  oneCikan: boolean;
  goruntulenmeSayisi: number;

  kaynak?: 'manuel' | 'ai-scraper';
  kaynakUrl?: string;

  metaBaslik?: string;
  metaAciklama?: string;
}

export const TUR_LABELS: Record<Etkinlik['tur'], string> = {
  fuar: 'Fuar',
  seminer: 'Seminer',
  konferans: 'Konferans',
  workshop: 'Workshop',
  webinar: 'Webinar',
};

export const TUR_COLORS: Record<Etkinlik['tur'], string> = {
  fuar: 'bg-emerald-100 text-emerald-700',
  seminer: 'bg-blue-100 text-blue-700',
  konferans: 'bg-purple-100 text-purple-700',
  workshop: 'bg-amber-100 text-amber-700',
  webinar: 'bg-rose-100 text-rose-700',
};
