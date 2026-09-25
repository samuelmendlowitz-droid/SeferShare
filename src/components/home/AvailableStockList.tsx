import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { AvailableStockEntry } from '../../types';
import { Card } from '../ui/Card';
import { SeferThumbnail } from '../ui/SeferThumbnail';
import { MinusIcon, PlusIcon, CheckCircleIcon } from '../ui/icons';

interface AvailableStockListProps {
  items: AvailableStockEntry[];
  /** Omitted (or empty) for a donor/browsing view — the grid renders read-only,
   *  with no quantity stepper or claim button, when there's no institution to
   *  claim on behalf of. */
  onClaim?: (entry: AvailableStockEntry, quantity: number) => void | Promise<void>;
}

/** Same shopping-grid shell as SeforimShopList, but for donated-with-no-
 *  destination stock: a claim quantity control + button instead of price
 *  emphasis (there's nothing to buy — it's already been paid for). */
export function AvailableStockList({ items, onClaim }: AvailableStockListProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((item) => (
        <StockCard key={item.id} item={item} onClaim={onClaim} />
      ))}
    </div>
  );
}

function StockCard({ item, onClaim }: { item: AvailableStockEntry; onClaim?: AvailableStockListProps['onClaim'] }) {
  const { t } = useTranslation();
  const [quantity, setQuantity] = useState(0);
  const [claiming, setClaiming] = useState(false);

  async function handleClaim() {
    if (quantity <= 0 || !onClaim || claiming) return;
    setClaiming(true);
    try {
      await onClaim(item, quantity);
      setQuantity(0);
    } finally {
      setClaiming(false);
    }
  }

  return (
    <Card className="flex flex-col items-center gap-1 text-center">
      <div className="flex flex-1 flex-col items-center gap-1">
        <SeferThumbnail imageUrl={item.imageUrl} alt={item.englishName} size={112} />
        <p className="mt-1 line-clamp-2 text-sm font-semibold">{item.englishName}</p>
        <p className="text-xs text-text-muted">{item.hebrewName}</p>
        <p className="text-xs font-medium text-accent">{t('seforim.availableCount', { count: item.quantity })}</p>
      </div>

      {onClaim && (
        <div className="mt-2 flex w-full shrink-0 items-center gap-1.5">
          <div className="flex h-9 min-w-0 flex-1 items-center rounded-btn border border-border">
            <button
              type="button"
              disabled={quantity <= 0}
              onClick={() => setQuantity((q) => Math.max(0, q - 1))}
              aria-label={t('pushka.decreaseQuantity') ?? ''}
              className="flex h-full w-7 shrink-0 items-center justify-center text-text-muted disabled:opacity-30"
            >
              <MinusIcon width={13} height={13} />
            </button>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={quantity}
              onChange={(e) => {
                const digits = e.target.value.replace(/[^0-9]/g, '');
                const parsed = digits === '' ? 0 : Math.min(Number(digits), item.quantity);
                setQuantity(parsed);
              }}
              aria-label={t('campaign.quantityLabel') ?? ''}
              className="min-w-0 flex-1 border-0 bg-transparent text-center text-sm focus:outline-none"
            />
            <button
              type="button"
              disabled={quantity >= item.quantity}
              onClick={() => setQuantity((q) => Math.min(item.quantity, q + 1))}
              aria-label={t('pushka.increaseQuantity') ?? ''}
              className="flex h-full w-7 shrink-0 items-center justify-center text-text-muted disabled:opacity-30"
            >
              <PlusIcon width={13} height={13} />
            </button>
          </div>
          <button
            type="button"
            onClick={handleClaim}
            disabled={quantity <= 0 || claiming}
            aria-label={t('seforim.claimAction') ?? ''}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-white disabled:opacity-30"
          >
            <CheckCircleIcon width={16} height={16} />
          </button>
        </div>
      )}
    </Card>
  );
}
