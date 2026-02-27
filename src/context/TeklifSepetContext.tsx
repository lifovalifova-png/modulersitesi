import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { FlashDeal } from '../data/flashDeals';

const MAX_FIRMS = 2;

interface TeklifSepetContextValue {
  firms: FlashDeal[];
  addFirm: (deal: FlashDeal) => 'added' | 'already' | 'full';
  removeFirm: (id: number) => void;
  isInSepet: (id: number) => boolean;
  isFull: boolean;
  isOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  clearAll: () => void;
}

const TeklifSepetContext = createContext<TeklifSepetContextValue | null>(null);

export function TeklifSepetProvider({ children }: { children: ReactNode }) {
  const [firms, setFirms] = useState<FlashDeal[]>(() => {
    try {
      const s = localStorage.getItem('teklifSepeti');
      return s ? JSON.parse(s) : [];
    } catch {
      return [];
    }
  });

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('teklifSepeti', JSON.stringify(firms));
  }, [firms]);

  function addFirm(deal: FlashDeal): 'added' | 'already' | 'full' {
    if (firms.some((f) => f.id === deal.id)) return 'already';
    if (firms.length >= MAX_FIRMS) return 'full';
    setFirms((prev) => [...prev, deal]);
    return 'added';
  }

  function removeFirm(id: number) {
    setFirms((prev) => prev.filter((f) => f.id !== id));
  }

  function clearAll() {
    setFirms([]);
  }

  return (
    <TeklifSepetContext.Provider
      value={{
        firms,
        addFirm,
        removeFirm,
        isInSepet: (id) => firms.some((f) => f.id === id),
        isFull: firms.length >= MAX_FIRMS,
        isOpen,
        openDrawer: () => setIsOpen(true),
        closeDrawer: () => setIsOpen(false),
        clearAll,
      }}
    >
      {children}
    </TeklifSepetContext.Provider>
  );
}

export function useTeklifSepet() {
  const ctx = useContext(TeklifSepetContext);
  if (!ctx) throw new Error('useTeklifSepet must be used within TeklifSepetProvider');
  return ctx;
}
