import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface SosyalMedyaLinks {
  linkedin:  string;
  instagram: string;
  facebook:  string;
  twitter:   string;
  youtube:   string;
}

const DEFAULTS: SosyalMedyaLinks = {
  linkedin:  'https://linkedin.com/company/modulerpazar',
  instagram: '',
  facebook:  '',
  twitter:   '',
  youtube:   '',
};

export function useSosyalMedya() {
  const [links, setLinks] = useState<SosyalMedyaLinks>(DEFAULTS);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'sosyalMedya'), (snap) => {
      if (snap.exists()) {
        setLinks((prev) => ({ ...prev, ...(snap.data() as SosyalMedyaLinks) }));
      }
    });
    return unsub;
  }, []);

  return links;
}
