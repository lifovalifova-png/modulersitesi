import { useState, useEffect, useRef } from 'react';
import {
  collection, query, where, limit, onSnapshot,
  getDocs, startAfter, type QueryDocumentSnapshot,
} from 'firebase/firestore';
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
  acilSatis?: boolean;
  acilSatisFiyat?: number;
  acilSatisNedeni?: string;
  acilSatisBitis?: { seconds: number; nanoseconds: number } | null;
  ilanBitis?: { seconds: number; nanoseconds: number } | null;
  yenilenmeSayisi?: number;
  aktif?: boolean;
  stokDurumu?: 'var' | 'tedarik' | 'yok';
}

const PAGE_SIZE = 20;

/* ── Hook ──────────────────────────────────────────────── */
export function useIlanlar(kategoriSlug?: string, sehir?: string) {
  const [ilanlar,     setIlanlar]     = useState<Ilan[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [hasMore,     setHasMore]     = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  /* Son Firestore dökümanı — sonraki sayfa için cursor */
  const lastDocRef = useRef<QueryDocumentSnapshot | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setIlanlar([]);
    setHasMore(false);
    lastDocRef.current = null;

    /*
     * Firestore'da tek-alan index kullanılır (composite index gerekmez).
     * — kategoriSlug varsa: sadece o kategorinin ilanları indirilir (~%80-90 daha az veri).
     * — yoksa: status='aktif' ile pasif ilanlar sunucu tarafında elenir.
     * Kalan filtreler (status, sehir) küçük subset üzerinde client'ta uygulanır.
     */
    const fsQuery = kategoriSlug
      ? query(collection(db, 'ilanlar'), where('kategoriSlug', '==', kategoriSlug), limit(PAGE_SIZE))
      : query(collection(db, 'ilanlar'), where('status', '==', 'aktif'), limit(PAGE_SIZE));

    const unsub = onSnapshot(
      fsQuery,
      (snap) => {
        let docs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Ilan));
        /* status filtresi (kategoriSlug modunda sunucudan pasifler gelebilir) */
        docs = docs.filter((d) => d.status === 'aktif' && d.aktif !== false);
        /* opsiyonel şehir filtresi — küçük subset, client OK */
        if (sehir) docs = docs.filter((d) => d.sehir === sehir);
        setIlanlar(docs);
        lastDocRef.current = snap.docs[snap.docs.length - 1] ?? null;
        setHasMore(snap.docs.length >= PAGE_SIZE);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
    );

    return unsub;
  }, [kategoriSlug, sehir]);

  /* Sonraki 20 ilanı Firestore'dan getir, mevcut listeye ekle */
  async function loadMore() {
    if (!lastDocRef.current || loadingMore) return;
    setLoadingMore(true);
    try {
      const fsQuery = kategoriSlug
        ? query(collection(db, 'ilanlar'), where('kategoriSlug', '==', kategoriSlug), startAfter(lastDocRef.current), limit(PAGE_SIZE))
        : query(collection(db, 'ilanlar'), where('status', '==', 'aktif'), startAfter(lastDocRef.current), limit(PAGE_SIZE));

      const snap = await getDocs(fsQuery);
      let docs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Ilan));
      docs = docs.filter((d) => d.status === 'aktif' && d.aktif !== false);
      if (sehir) docs = docs.filter((d) => d.sehir === sehir);

      setIlanlar((prev) => {
        const existingIds = new Set(prev.map((d) => d.id));
        return [...prev, ...docs.filter((d) => !existingIds.has(d.id))];
      });
      if (snap.docs.length > 0) {
        lastDocRef.current = snap.docs[snap.docs.length - 1];
      }
      setHasMore(snap.docs.length >= PAGE_SIZE);
    } catch {
      /* silent — mevcut veriler korunur */
    } finally {
      setLoadingMore(false);
    }
  }

  return { ilanlar, loading, error, hasMore, loadingMore, loadMore };
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
