import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { GiftIcon } from '../ui/icons';

interface GiftCardOptionProps {
  onAdd: (amount: number) => void;
}

/** The "donate a gift card instead" option shown at the top of a Sefer list —
 *  works for a specific campaign or a whole institution alike, since a gift card
 *  is just money added to the institution's balance rather than a specific sefer. */
export function GiftCardOption({ onAdd }: GiftCardOptionProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');

  const parsed = Number(amount);
  const valid = amount.trim() !== '' && Number.isFinite(parsed) && parsed > 0;

  function handleAdd() {
    if (!valid) return;
    onAdd(Math.round(parsed * 100) / 100);
    setAmount('');
    setOpen(false);
  }

  return (
    <Card className="mb-3 border-dashed">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center gap-3 text-left"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-btn bg-accent/10 text-accent">
          <GiftIcon width={20} height={20} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">{t('donation.giftCardOption')}</span>
          <span className="block text-xs text-text-muted">{t('donation.giftCardHint')}</span>
        </span>
      </button>

      {open && (
        <div className="mt-3 space-y-2 border-t border-border pt-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-text-muted">$</span>
            <input
              type="number"
              min={1}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-btn border border-border px-3 py-2 text-sm"
            />
          </div>
          <Button className="w-full" disabled={!valid} onClick={handleAdd}>
            {t('donation.giftCardAdd')}
          </Button>
        </div>
      )}
    </Card>
  );
}
