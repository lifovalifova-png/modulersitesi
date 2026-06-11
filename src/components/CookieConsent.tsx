import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getConsent, setConsent, loadGA } from '../lib/analytics';
import { useLanguage } from '../context/LanguageContext';

export default function CookieConsent() {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(() => getConsent() === null);

  if (!visible) return null;

  function accept() {
    setConsent('granted');
    loadGA();
    setVisible(false);
  }

  function deny() {
    setConsent('denied');
    setVisible(false);
  }

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 bg-white border-t border-gray-200 shadow-lg px-4 py-3 sm:px-6 sm:py-4">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
        <p className="text-sm text-gray-600 flex-1 text-center sm:text-left">
          {t('cookie.text')}{' '}
          <Link to="/gizlilik" className="underline text-emerald-700 hover:text-emerald-800">
            {t('cookie.policyLink')}
          </Link>
        </p>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={deny}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
          >
            {t('cookie.deny')}
          </button>
          <button
            onClick={accept}
            className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition"
          >
            {t('cookie.accept')}
          </button>
        </div>
      </div>
    </div>
  );
}
