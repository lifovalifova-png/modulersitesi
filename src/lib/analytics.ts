/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
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
