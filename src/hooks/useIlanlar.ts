import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

/* ── Ilan veri modeli (Firestore "ilanlar" koleksiyonu) ─── */
export interface Ilan {
  id: string;
  baslik: string;
  kategori: string;
  kategoriSlug: string;
  sehir: string;
  fiyat: number;
  aciklama: string;
  ozellikler: {
    metrekare?: string;
    malzeme?: string;
    teslimSuresi?: string;
    [key: string]: string | undefined;
  };
  gorseller: string[];
  firmaId: string;
  firmaAdi: string;
  firmaDogrulanmis: boolean;
  acil: boolean;
  indirimli: boolean;
  status: 'aktif' | 'pasif';
  tarih: { seconds: number; nanoseconds: number } | null;
}

/* ── Hook ──────────────────────────────────────────────── */
export function useIlanlar(kategoriSlug?: string, sehir?: string) {
  const [ilanlar, setIlanlar] = useState<Ilan[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const unsub = onSnapshot(
      collection(db, 'ilanlar'),
      (snap) => {
        let docs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Ilan));
        /* status filtresi */
        docs = docs.filter((d) => d.status === 'aktif');
        /* opsiyonel kategori filtresi */
        if (kategoriSlug) docs = docs.filter((d) => d.kategoriSlug === kategoriSlug);
        /* opsiyonel şehir filtresi */
        if (sehir) docs = docs.filter((d) => d.sehir === sehir);
        setIlanlar(docs);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
    );

    return unsub;
  }, [kategoriSlug, sehir]);

  return { ilanlar, loading, error };
}

/* ── Yardımcı: fiyat formatla ──────────────────────────── */
export function formatFiyat(fiyat: number): string {
  return new Intl.NumberFormat('tr-TR').format(fiyat) + ' ₺';
}

/* ── Yardımcı: tarih formatla ──────────────────────────── */
export function formatTarih(tarih: { seconds: number } | null): string {
  if (!tarih) return '';
  return new Date(tarih.seconds * 1000).toLocaleDateString('tr-TR', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}
