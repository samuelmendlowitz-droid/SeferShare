import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePushka, type PushkaItem } from '../context/PushkaContext';
import type { PickedItem } from '../components/donation/SeferPicker';
import { CheckoutStep } from '../components/donation/CheckoutStep';
import { VirtualDedicationCard } from '../components/donation/VirtualDedicationCard';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { SeferThumbnail } from '../components/ui/SeferThumbnail';
import { MinusIcon, PlusIcon, CloseIcon } from '../components/ui/icons';

function toPickedItem(item: PushkaItem): PickedItem {
  return {
    seferId: item.seferId,
    vendorId: item.vendorId,
    vendorName: item.vendorName,
    englishName: item.englishName,
    hebrewName: item.hebrewName,
    price: item.price,
    quantity: item.quantity,
    imageUrl: item.imageUrl,
    campaignId: item.campaignId,
  };
}

export function PushkaPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const pushka = usePushka();

  const [step, setStep] = useState<'cart' | 'checkout' | 'confirmation'>('cart');
  const [donorMessage, setDonorMessage] = useState('');
  const [paidItems, setPaidItems] = useState<PushkaItem[]>([]);

  const groups = useMemo(() => {
    const byCampaign = new Map<string, PushkaItem[]>();
    const untagged: PushkaItem[] = [];
    for (const item of pushka.items) {
      if (item.campaignId) {
        const list = byCampaign.get(item.campaignId) ?? [];
        list.push(item);
        byCampaign.set(item.campaignId, list);
      } else {
        untagged.push(item);
      }
    }
    return { byCampaign, untagged };
  }, [pushka.items]);

  async function handlePaid() {
    setPaidItems(pushka.items);
    pushka.clear();
    setStep('confirmation');
  }

  if (step === 'confirmation') {
    return (
      <div className="mx-auto max-w-2xl px-4 pb-24 pt-6">
        <VirtualDedicationCard donorName={profile?.displayName ?? ''} items={paidItems.map(toPickedItem)} />
        <Button className="mt-4 w-full" onClick={() => navigate('/')}>
          {t('actions.done')}
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pb-24 pt-6">
      <Button variant="secondary" className="mb-4" onClick={() => navigate('/')}>
        {t('actions.back')}
      </Button>

      <h1 className="mb-4 text-lg font-bold">{t('pushka.title')}</h1>

      {pushka.items.length === 0 ? (
        <div className="text-center">
          <p className="mb-4 text-text-muted">{t('pushka.empty')}</p>
          <Button onClick={() => navigate('/')}>{t('pushka.goHome')}</Button>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {[...groups.byCampaign.entries()].map(([campaignId, items]) => (
              <div key={campaignId}>
                <button
                  type="button"
                  onClick={() => navigate(`/campaigns/${campaignId}`)}
                  className="mb-2 text-sm font-semibold text-accent hover:underline"
                >
                  {items[0].campaignTitle || t('campaign.untitled')}
                </button>
                <div className="space-y-2">
                  {items.map((item) => (
                    <PushkaRow key={pushka.keyFor(item)} item={item} />
                  ))}
                </div>
              </div>
            ))}

            {groups.untagged.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-semibold text-text-muted">{t('pushka.otherSeforim')}</p>
                <div className="space-y-2">
                  {groups.untagged.map((item) => (
                    <PushkaRow key={pushka.keyFor(item)} item={item} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {step === 'cart' && (
            <>
              <textarea
                value={donorMessage}
                onChange={(e) => setDonorMessage(e.target.value)}
                placeholder={t('donation.message') ?? ''}
                className="mb-4 mt-4 w-full rounded-btn border border-border px-3 py-2 text-sm"
                rows={3}
              />
              <p className="mb-3 text-sm text-text-muted">
                {t('donation.total')}: ${pushka.totalPrice.toFixed(2)}
              </p>
              <Button className="w-full" onClick={() => setStep('checkout')}>
                {t('pushka.donate')}
              </Button>
            </>
          )}

          {step === 'checkout' && (
            <div className="mt-4">
              <h2 className="mb-4 text-base font-semibold">{t('donation.checkout')}</h2>
              <CheckoutStep items={pushka.items.map(toPickedItem)} donorMessage={donorMessage} onPaid={handlePaid} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

function PushkaRow({ item }: { item: PushkaItem }) {
  const { t } = useTranslation();
  const pushka = usePushka();
  const key = pushka.keyFor(item);

  return (
    <Card className="flex items-center gap-3">
      <SeferThumbnail imageUrl={item.imageUrl} alt={item.englishName} size={48} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">
          {item.englishName} · {item.hebrewName}
        </p>
        <p className="text-xs text-text-muted">${item.price.toFixed(2)} each</p>
      </div>
      <div className="flex shrink-0 items-center gap-1 rounded-btn border border-border">
        <button
          type="button"
          onClick={() => pushka.updateQuantity(key, item.quantity - 1)}
          aria-label={t('pushka.decreaseQuantity') ?? ''}
          className="flex h-8 w-8 items-center justify-center text-text-muted"
        >
          <MinusIcon width={14} height={14} />
        </button>
        <span className="w-6 text-center text-sm">{item.quantity}</span>
        <button
          type="button"
          onClick={() => pushka.updateQuantity(key, item.quantity + 1)}
          aria-label={t('pushka.increaseQuantity') ?? ''}
          className="flex h-8 w-8 items-center justify-center text-text-muted"
        >
          <PlusIcon width={14} height={14} />
        </button>
      </div>
      <button
        type="button"
        onClick={() => pushka.removeItem(key)}
        aria-label={t('actions.delete') ?? ''}
        className="shrink-0 text-text-muted"
      >
        <CloseIcon width={16} height={16} />
      </button>
    </Card>
  );
}
