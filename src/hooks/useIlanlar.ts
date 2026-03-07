import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
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

    /*
     * Firestore'da tek-alan index kullanılır (composite index gerekmez).
     * — kategoriSlug varsa: sadece o kategorinin ilanları indirilir (~%80-90 daha az veri).
     * — yoksa: status='aktif' ile pasif ilanlar sunucu tarafında elenir.
     * Kalan filtreler (status, sehir) küçük subset üzerinde client'ta uygulanır.
     */
    const fsQuery = kategoriSlug
      ? query(collection(db, 'ilanlar'), where('kategoriSlug', '==', kategoriSlug))
      : query(collection(db, 'ilanlar'), where('status', '==', 'aktif'));

    const unsub = onSnapshot(
      fsQuery,
      (snap) => {
        let docs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Ilan));
        /* status filtresi (kategoriSlug modunda sunucudan pasifler gelebilir) */
        docs = docs.filter((d) => d.status === 'aktif');
        /* opsiyonel şehir filtresi — küçük subset, client OK */
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
