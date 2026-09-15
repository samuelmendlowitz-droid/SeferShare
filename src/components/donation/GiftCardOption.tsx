import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { NumberField } from '../ui/NumberField';
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
  const [amount, setAmount] = useState(0);

  const valid = amount > 0;

  function handleAdd() {
    if (!valid) return;
    onAdd(Math.round(amount * 100) / 100);
    setAmount(0);
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
          <NumberField label={t('donation.amountLabel')} value={amount} onChange={setAmount} min={0} money />
          <Button className="w-full" disabled={!valid} onClick={handleAdd}>
            {t('donation.giftCardAdd')}
          </Button>
        </div>
      )}
    </Card>
  );
}
