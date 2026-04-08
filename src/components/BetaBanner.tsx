import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useLanguage } from '../context/LanguageContext';

const STORAGE_KEY = 'betaBannerDismissed';

export default function BetaBanner() {
  const { settings, loading } = useSettings();
  const { lang } = useLanguage();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(STORAGE_KEY) === '1') setDismissed(true);
    } catch { /* ignore */ }
  }, []);

  if (loading || !settings.betaMode || !settings.betaBannerVisible || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    try { sessionStorage.setItem(STORAGE_KEY, '1'); } catch { /* ignore */ }
  };

  return (
    <div className="bg-emerald-600 text-white text-sm text-center py-2 px-4 relative">
      <span>{settings.betaBannerText[lang]}</span>
      <button
        onClick={handleDismiss}
        aria-label={lang === 'en' ? 'Close' : 'Kapat'}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-emerald-700 rounded transition"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
