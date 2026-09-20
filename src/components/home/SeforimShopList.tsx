import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePushka } from '../../context/PushkaContext';
import { useLanguage } from '../../context/LanguageContext';
import { useDetailStack } from '../../context/DetailStackContext';
import { seferTypeText, subtypeLabel } from '../../lib/seferTaxonomy';
import type { SeforimShopItem } from '../../hooks/useSeforimShopFeed';
import type { Campaign } from '../../types';
import { SeferAddToCartModal } from './SeferAddToCartModal';
import { GiftCardOption } from '../donation/GiftCardOption';
import { Card } from '../ui/Card';
import { SeferThumbnail } from '../ui/SeferThumbnail';
import { PlusIcon } from '../ui/icons';

interface SeforimShopListProps {
  items: SeforimShopItem[];
  institutionId: string;
  institutionName?: string;
}

/** Shopping-platform-style grid: a card per sefer (photo, name, type/subtype,
 *  price, a "+" to add to cart) — tapping the name opens its detail popup
 *  instead of adding to cart. */
export function SeforimShopList({ items, institutionId, institutionName }: SeforimShopListProps) {
  const { t } = useTranslation();
  const { showBilingual } = useLanguage();
  const pushka = usePushka();
  const { open } = useDetailStack();
  const [activeItem, setActiveItem] = useState<SeforimShopItem | null>(null);

  function handleConfirmAdd(item: SeforimShopItem, quantity: number, campaign?: Campaign) {
    if (campaign) {
      const campaignItem = campaign.items.find((ci) => ci.seferId === item.sefer.seferId);
      if (!campaignItem) return;
      const listing = item.sefer.vendorListings.find((l) => l.vendorId === campaignItem.vendorId);
      pushka.addItem(
        {
          seferId: item.sefer.seferId,
          vendorId: campaignItem.vendorId,
          vendorName: listing?.vendorName ?? '',
          englishName: item.sefer.englishName,
          hebrewName: item.sefer.hebrewName,
          price: campaignItem.retailPrice,
          imageUrl: listing?.imageUrls?.[0],
          campaignId: campaign.campaignId,
          campaignTitle: campaign.title ?? undefined,
          institutionId: campaign.institutionId,
        },
        quantity,
      );
    } else if (item.listing) {
      pushka.addItem(
        {
          seferId: item.sefer.seferId,
          vendorId: item.listing.vendorId,
          vendorName: item.listing.vendorName,
          englishName: item.sefer.englishName,
          hebrewName: item.sefer.hebrewName,
          price: item.listing.price,
          imageUrl: item.listing.imageUrls?.[0],
          institutionId,
        },
        quantity,
      );
    }
    setActiveItem(null);
  }

  return (
    <div>
      <GiftCardOption onAdd={(amount) => pushka.addGiftCard({ institutionId, institutionName, amount })} />

      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => {
          const inCartCount = pushka.items
            .filter((p) => p.seferId === item.sefer.seferId)
            .reduce((sum, p) => sum + p.quantity, 0);
          const subLabel = subtypeLabel(item.sefer.type, item.sefer.subType, showBilingual, item.sefer.customSubType);

          return (
            <Card key={item.sefer.seferId} className="flex flex-col items-center gap-1 text-center">
              <SeferThumbnail imageUrl={item.listing?.imageUrls?.[0]} alt={item.sefer.englishName} size={112} />
              <button
                type="button"
                className="mt-1 line-clamp-2 text-sm font-semibold text-accent hover:underline"
                onClick={() => open('sefer', item.sefer.seferId)}
              >
                {item.sefer.englishName}
              </button>
              <p className="text-xs text-text-muted">
                {seferTypeText(item.sefer.type, item.sefer.customType, t(`sefer.${item.sefer.type}`))}
                {subLabel ? ` · ${subLabel}` : ''}
              </p>
              {item.listing ? (
                <p className="text-sm font-medium">${item.listing.price.toFixed(2)}</p>
              ) : (
                <p className="text-xs text-text-muted">{t('actions.noResults')}</p>
              )}
              {inCartCount > 0 && (
                <p className="text-xs font-medium text-accent">{t('pushka.inPushka', { count: inCartCount })}</p>
              )}

              {item.listing && item.inStock ? (
                <button
                  type="button"
                  onClick={() => setActiveItem(item)}
                  aria-label={t('pushka.addToPushka') ?? ''}
                  className="mt-1 flex h-9 w-9 items-center justify-center rounded-full bg-accent text-white"
                >
                  <PlusIcon width={18} height={18} />
                </button>
              ) : (
                item.listing && <p className="mt-1 text-xs font-medium text-error">{t('filterSort.outOfStock')}</p>
              )}
            </Card>
          );
        })}
      </div>

      {activeItem && (
        <SeferAddToCartModal
          item={activeItem}
          onClose={() => setActiveItem(null)}
          onConfirm={(quantity, campaign) => handleConfirmAdd(activeItem, quantity, campaign)}
        />
      )}
    </div>
  );
}
