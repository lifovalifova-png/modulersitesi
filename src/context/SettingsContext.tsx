import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface GlobalSettings {
  betaMode: boolean;
  betaLabel: { tr: string; en: string };
  betaBannerVisible: boolean;
  betaBannerText: { tr: string; en: string };
}

const DEFAULT_SETTINGS: GlobalSettings = {
  betaMode: true,
  betaLabel: { tr: 'Beta', en: 'Beta' },
  betaBannerVisible: true,
  betaBannerText: {
    tr: 'Bu platform şu anda beta aşamasındadır. Geri bildirimlerinizi bekliyoruz!',
    en: 'This platform is currently in beta. We welcome your feedback!',
  },
};

const SettingsContext = createContext<{ settings: GlobalSettings; loading: boolean }>({
  settings: DEFAULT_SETTINGS,
  loading: true,
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<GlobalSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'settings', 'global'),
      (snap) => {
        if (snap.exists()) {
          setSettings({ ...DEFAULT_SETTINGS, ...(snap.data() as Partial<GlobalSettings>) });
        }
        setLoading(false);
      },
      () => {
        setLoading(false);
      },
    );
    return unsub;
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
