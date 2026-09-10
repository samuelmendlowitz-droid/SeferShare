import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export interface PushkaItem {
  seferId: string;
  vendorId: string;
  vendorName: string;
  englishName: string;
  hebrewName: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  /** Set when added straight from a campaign's page — credited to that exact
   *  campaign first at checkout, rather than assigned by the general algorithm. */
  campaignId?: string;
  campaignTitle?: string;
  institutionId?: string;
  neshamaId?: string;
}

export type NewPushkaItem = Omit<PushkaItem, 'quantity'>;

interface PushkaContextValue {
  items: PushkaItem[];
  totalCount: number;
  totalPrice: number;
  keyFor: (item: Pick<PushkaItem, 'seferId' | 'vendorId' | 'campaignId'>) => string;
  addItem: (item: NewPushkaItem, quantity: number) => void;
  updateQuantity: (key: string, quantity: number) => void;
  removeItem: (key: string) => void;
  /** Replaces every item with no campaignId (items not tied to a specific
   *  campaign) wholesale — used by the generic "add more seforim" browser. */
  replaceUntagged: (untaggedItems: PushkaItem[]) => void;
  clear: () => void;
}

const PushkaContext = createContext<PushkaContextValue | undefined>(undefined);

const STORAGE_KEY = 'sefershare_pushka';

function keyFor(item: Pick<PushkaItem, 'seferId' | 'vendorId' | 'campaignId'>): string {
  return `${item.seferId}_${item.vendorId}_${item.campaignId ?? 'none'}`;
}

function loadInitialItems(): PushkaItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function PushkaProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<PushkaItem[]>(loadInitialItems);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Storage can be unavailable (private browsing, quota) — the cart just
      // won't survive a reload in that case, which is an acceptable fallback.
    }
  }, [items]);

  const value = useMemo<PushkaContextValue>(
    () => ({
      items,
      totalCount: items.reduce((sum, i) => sum + i.quantity, 0),
      totalPrice: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      keyFor,
      addItem(newItem, quantity) {
        if (quantity <= 0) return;
        setItems((prev) => {
          const key = keyFor(newItem);
          const idx = prev.findIndex((p) => keyFor(p) === key);
          if (idx >= 0) {
            return prev.map((p, i) => (i === idx ? { ...p, quantity: p.quantity + quantity } : p));
          }
          return [...prev, { ...newItem, quantity }];
        });
      },
      updateQuantity(key, quantity) {
        setItems((prev) =>
          quantity <= 0 ? prev.filter((p) => keyFor(p) !== key) : prev.map((p) => (keyFor(p) === key ? { ...p, quantity } : p)),
        );
      },
      removeItem(key) {
        setItems((prev) => prev.filter((p) => keyFor(p) !== key));
      },
      replaceUntagged(untaggedItems) {
        setItems((prev) => [...prev.filter((p) => p.campaignId), ...untaggedItems]);
      },
      clear() {
        setItems([]);
      },
    }),
    [items],
  );

  return <PushkaContext.Provider value={value}>{children}</PushkaContext.Provider>;
}

export function usePushka(): PushkaContextValue {
  const ctx = useContext(PushkaContext);
  if (!ctx) throw new Error('usePushka must be used within PushkaProvider');
  return ctx;
}
