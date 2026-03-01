import { useEffect } from 'react';

const DEFAULT_TITLE = "ModülerPazar — Türkiye'nin En Büyük Modüler Yapı Pazarı";

export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = title || DEFAULT_TITLE;
    return () => {
      document.title = DEFAULT_TITLE;
    };
  }, [title]);
}
