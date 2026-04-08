import { useSettings } from '../context/SettingsContext';
import { useLanguage } from '../context/LanguageContext';

export default function BetaBadge() {
  const { settings, loading } = useSettings();
  const { lang } = useLanguage();

  if (loading || !settings.betaMode) return null;

  return (
    <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-emerald-100 text-emerald-700 border border-emerald-200 leading-none">
      {settings.betaLabel[lang]}
    </span>
  );
}
