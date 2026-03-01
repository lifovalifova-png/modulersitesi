import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import tr from '../i18n/tr';
import en from '../i18n/en';

type Lang = 'tr' | 'en';

const DICTIONARIES: Record<Lang, Record<string, string>> = { tr, en };

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function getInitialLang(): Lang {
  try {
    const stored = localStorage.getItem('lang');
    if (stored === 'tr' || stored === 'en') return stored;
  } catch {
    /* ignore */
  }
  return 'tr';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(getInitialLang);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try { localStorage.setItem('lang', next); } catch { /* ignore */ }
  }, []);

  const t = useCallback(
    (key: string) => DICTIONARIES[lang][key] ?? DICTIONARIES['tr'][key] ?? key,
    [lang],
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
