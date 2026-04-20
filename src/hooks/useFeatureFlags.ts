import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface FeatureFlags {
  aiAsistan:       boolean;
  teklifSepeti:    boolean;
  talepHavuzu:     boolean;
  onecikarIlan:    boolean;
  sinirsizTalep:   boolean;
  puanlamaSistemi: boolean;
  fiyatHesaplama:  boolean;
  fiyatlandirma:   boolean;
}

// Tüm flagler false — fail-closed: döküman yoksa veya okunamazsa özellikler kapalı kalır
export const DEFAULT_FLAGS: FeatureFlags = {
  aiAsistan:       false,
  teklifSepeti:    false,
  talepHavuzu:     false,
  onecikarIlan:    false,
  sinirsizTalep:   false,
  puanlamaSistemi: false,
  fiyatHesaplama:  false,
  fiyatlandirma:   false,
};

export function useFeatureFlags(): { flags: FeatureFlags; loading: boolean } {
  const [flags,   setFlags]   = useState<FeatureFlags>(DEFAULT_FLAGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'settings', 'features'),
      (snap) => {
        if (snap.exists()) {
          setFlags({ ...DEFAULT_FLAGS, ...(snap.data() as Partial<FeatureFlags>) });
        } else {
          setFlags(DEFAULT_FLAGS);
        }
        setLoading(false);
      },
      (_err) => {
        // Okuma hatası (ağ sorunu vb.) — tüm flagler kapalı kalır
        setFlags(DEFAULT_FLAGS);
        setLoading(false);
      },
    );
    return unsub;
  }, []);

  return { flags, loading };
}
