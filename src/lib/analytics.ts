/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

const GA_ID = 'G-KK8YBNMNL7';
const CONSENT_KEY = 'mp_cookie_consent';
let gaLoaded = false;

export function getConsent(): 'granted' | 'denied' | null {
  if (typeof window === 'undefined') return null;
  const v = localStorage.getItem(CONSENT_KEY);
  if (v === 'granted' || v === 'denied') return v;
  return null;
}

export function setConsent(value: 'granted' | 'denied'): void {
  localStorage.setItem(CONSENT_KEY, value);
  if (value === 'granted') loadGA();
}

export function loadGA(): void {
  if (gaLoaded || typeof document === 'undefined') return;
  gaLoaded = true;

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer!.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', GA_ID);
}

if (typeof window !== 'undefined' && getConsent() === 'granted') {
  loadGA();
}

export function trackEvent(name: string, params?: Record<string, unknown>): void {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', name, params);
  }
}

export async function trackWhatsAppClick(firmaId: string, ilanId?: string): Promise<void> {
  trackEvent('whatsapp_click', { firmaId, ilanId });
  try {
    const { addDoc, collection, serverTimestamp } = await import('firebase/firestore');
    const { db } = await import('./firebase');
    await addDoc(collection(db, 'whatsappTiklamalari'), {
      firmaId,
      ilanId: ilanId || null,
      tarih: serverTimestamp(),
      userAgent: navigator.userAgent,
    });
  } catch {
    // fire-and-forget
  }
}
