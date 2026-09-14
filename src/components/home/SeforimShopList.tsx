import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePushka } from '../../context/PushkaContext';
import type { SeforimShopItem } from '../../hooks/useSeforimShopFeed';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { SeferThumbnail } from '../ui/SeferThumbnail';
import { MinusIcon, PlusIcon } from '../ui/icons';

interface SeforimShopListProps {
  items: SeforimShopItem[];
}

export function SeforimShopList({ items }: SeforimShopListProps) {
  const { t } = useTranslation();
  const pushka = usePushka();
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  function quantityFor(itemKey: string): number {
    return quantities[itemKey] ?? 1;
  }

  function adjust(itemKey: string, delta: number) {
    setQuantities((prev) => ({ ...prev, [itemKey]: Math.max(1, quantityFor(itemKey) + delta) }));
  }

  function addToPushka(item: SeforimShopItem) {
    if (!item.listing) return;
    const itemKey = `${item.sefer.seferId}_${item.listing.vendorId}`;
    pushka.addItem(
      {
        seferId: item.sefer.seferId,
        vendorId: item.listing.vendorId,
        vendorName: item.listing.vendorName,
        englishName: item.sefer.englishName,
        hebrewName: item.sefer.hebrewName,
        price: item.listing.price,
        imageUrl: item.listing.imageUrls?.[0],
      },
      quantityFor(itemKey),
    );
    setQuantities((prev) => ({ ...prev, [itemKey]: 1 }));
  }

  return (
    <div className="space-y-2">
      {items.map((item) => {
        const itemKey = `${item.sefer.seferId}_${item.listing?.vendorId ?? 'none'}`;
        const inPushkaCount = item.listing
          ? pushka.items.find(
              (p) => pushka.keyFor(p) === pushka.keyFor({ seferId: item.sefer.seferId, vendorId: item.listing!.vendorId }),
            )?.quantity ?? 0
          : 0;

        return (
          <Card key={item.sefer.seferId} className="flex items-center gap-3">
            <SeferThumbnail imageUrl={item.listing?.imageUrls?.[0]} alt={item.sefer.englishName} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">
                {item.sefer.englishName} · {item.sefer.hebrewName}
              </p>
              <p className="text-xs text-text-muted">{t(`sefer.${item.sefer.type}`)}</p>
              {item.listing ? (
                <p className="text-sm">${item.listing.price.toFixed(2)}</p>
              ) : (
                <p className="text-xs text-text-muted">{t('actions.noResults')}</p>
              )}
              {inPushkaCount > 0 && (
                <p className="text-xs font-medium text-accent">{t('pushka.inPushka', { count: inPushkaCount })}</p>
              )}
              {item.listing && !item.inStock && (
                <p className="text-xs font-medium text-error">{t('filterSort.outOfStock')}</p>
              )}
            </div>

            {item.listing && item.inStock && (
              <div className="flex shrink-0 flex-col items-end gap-2">
                <div className="flex items-center gap-1 rounded-btn border border-border">
                  <button
                    type="button"
                    onClick={() => adjust(itemKey, -1)}
                    aria-label={t('pushka.decreaseQuantity') ?? ''}
                    className="flex h-8 w-8 items-center justify-center text-text-muted"
                  >
                    <MinusIcon width={14} height={14} />
                  </button>
                  <span className="w-6 text-center text-sm">{quantityFor(itemKey)}</span>
                  <button
                    type="button"
                    onClick={() => adjust(itemKey, 1)}
                    aria-label={t('pushka.increaseQuantity') ?? ''}
                    className="flex h-8 w-8 items-center justify-center text-text-muted"
                  >
                    <PlusIcon width={14} height={14} />
                  </button>
                </div>
                <Button variant="secondary" onClick={() => addToPushka(item)}>
                  {t('pushka.addToPushka')}
                </Button>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
