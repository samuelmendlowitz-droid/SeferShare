import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

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
}

export type NewPushkaItem = Omit<PushkaItem, 'quantity'>;

/** A monetary gift card added to the cart instead of specific seforim — see
 *  GiftCardOption. Never carries its own dedication/ad (no physical sefer). */
export interface PushkaGiftCard {
  id: string;
  institutionId: string;
  institutionName?: string;
  campaignId?: string;
  campaignTitle?: string;
  amount: number;
}

export type NewPushkaGiftCard = Omit<PushkaGiftCard, 'id'>;

interface PushkaContextValue {
  items: PushkaItem[];
  giftCards: PushkaGiftCard[];
  totalCount: number;
  totalPrice: number;
  keyFor: (item: Pick<PushkaItem, 'seferId' | 'vendorId' | 'campaignId'>) => string;
  addItem: (item: NewPushkaItem, quantity: number) => void;
  updateQuantity: (key: string, quantity: number) => void;
  removeItem: (key: string) => void;
  addGiftCard: (giftCard: NewPushkaGiftCard) => void;
  updateGiftCardAmount: (id: string, amount: number) => void;
  removeGiftCard: (id: string) => void;
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

function giftCardId(): string {
  return `gc_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

interface StoredPushka {
  items: PushkaItem[];
  giftCards: PushkaGiftCard[];
}

function loadInitial(): StoredPushka {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { items: [], giftCards: [] };
    const parsed = JSON.parse(raw);
    // Older versions stored a bare items array — migrate it in place.
    if (Array.isArray(parsed)) return { items: parsed, giftCards: [] };
    return { items: parsed.items ?? [], giftCards: parsed.giftCards ?? [] };
  } catch {
    return { items: [], giftCards: [] };
  }
}

export function PushkaProvider({ children }: { children: ReactNode }) {
  const initialRef = useRef<StoredPushka>();
  if (!initialRef.current) initialRef.current = loadInitial();
  const [items, setItems] = useState<PushkaItem[]>(initialRef.current.items);
  const [giftCards, setGiftCards] = useState<PushkaGiftCard[]>(initialRef.current.giftCards);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ items, giftCards }));
    } catch {
      // Storage can be unavailable (private browsing, quota) — the cart just
      // won't survive a reload in that case, which is an acceptable fallback.
    }
  }, [items, giftCards]);

  const value = useMemo<PushkaContextValue>(
    () => ({
      items,
      giftCards,
      totalCount: items.reduce((sum, i) => sum + i.quantity, 0) + giftCards.length,
      totalPrice:
        items.reduce((sum, i) => sum + i.price * i.quantity, 0) + giftCards.reduce((sum, g) => sum + g.amount, 0),
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
      addGiftCard(giftCard) {
        if (giftCard.amount <= 0) return;
        setGiftCards((prev) => [...prev, { ...giftCard, id: giftCardId() }]);
      },
      updateGiftCardAmount(id, amount) {
        setGiftCards((prev) =>
          amount <= 0 ? prev.filter((g) => g.id !== id) : prev.map((g) => (g.id === id ? { ...g, amount } : g)),
        );
      },
      removeGiftCard(id) {
        setGiftCards((prev) => prev.filter((g) => g.id !== id));
      },
      replaceUntagged(untaggedItems) {
        setItems((prev) => [...prev.filter((p) => p.campaignId), ...untaggedItems]);
      },
      clear() {
        setItems([]);
        setGiftCards([]);
      },
    }),
    [items, giftCards],
  );

  return <PushkaContext.Provider value={value}>{children}</PushkaContext.Provider>;
}

export function usePushka(): PushkaContextValue {
  const ctx = useContext(PushkaContext);
  if (!ctx) throw new Error('usePushka must be used within PushkaProvider');
  return ctx;
}
