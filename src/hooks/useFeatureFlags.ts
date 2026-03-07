import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface FeatureFlags {
  aiAsistan:     boolean;
  teklifSepeti:  boolean;
  talepHavuzu:   boolean;
  onecikarIlan:  boolean;
  sinirsizTalep: boolean;
}

export const DEFAULT_FLAGS: FeatureFlags = {
  aiAsistan:     true,
  teklifSepeti:  true,
  talepHavuzu:   true,
  onecikarIlan:  false,
  sinirsizTalep: false,
};

export function useFeatureFlags(): { flags: FeatureFlags; loading: boolean } {
  const [flags,   setFlags]   = useState<FeatureFlags>(DEFAULT_FLAGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'features'), (snap) => {
      if (snap.exists()) {
        setFlags({ ...DEFAULT_FLAGS, ...(snap.data() as Partial<FeatureFlags>) });
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  return { flags, loading };
}
