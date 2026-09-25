import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { usePushka } from '../../context/PushkaContext';
import { useLanguage } from '../../context/LanguageContext';
import { seferTypeText, subtypeLabel } from '../../lib/seferTaxonomy';
import type { SeforimShopItem } from '../../hooks/useSeforimShopFeed';
import { Card } from '../ui/Card';
import { SeferThumbnail } from '../ui/SeferThumbnail';
import { MinusIcon, PlusIcon, PushkaIcon } from '../ui/icons';

interface SeforimShopListProps {
  items: SeforimShopItem[];
  /** Shows each item's outstanding campaign demand instead of price emphasis —
   *  used by the Demand tab, which is this same list/data just re-framed around
   *  "what's needed" rather than "what's for sale". */
  showDemand?: boolean;
}

/** Shopping-platform-style grid: a card per sefer (photo, name, type/subtype,
 *  price, a quantity stepper + add-to-pushka button) — tapping the name opens
 *  its detail page instead of adding to cart. Every sefer with a vendor
 *  listing is shown; the browsing donor doesn't pick an institution or
 *  campaign up front (see HomePage's "what" tab filter/sort sheet for
 *  narrowing by institution instead) — an item added here goes in untagged,
 *  same as any other "pick for me" item, for the server-side algorithm to
 *  assign both an institution and a campaign at checkout. */
export function SeforimShopList({ items, showDemand }: SeforimShopListProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((item) => (
        <ShopItemCard key={item.sefer.seferId} item={item} showDemand={showDemand} />
      ))}
    </div>
  );
}

function ShopItemCard({ item, showDemand }: { item: SeforimShopItem; showDemand?: boolean }) {
  const { t } = useTranslation();
  const { showBilingual } = useLanguage();
  const pushka = usePushka();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(0);

  const inCartCount = pushka.items
    .filter((p) => p.seferId === item.sefer.seferId)
    .reduce((sum, p) => sum + p.quantity, 0);
  const subLabel = subtypeLabel(item.sefer.type, item.sefer.subType, showBilingual, item.sefer.customSubType);

  function handleAdd() {
    if (quantity <= 0 || !item.listing) return;
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
      quantity,
    );
    setQuantity(0);
  }

  return (
    <Card className="flex flex-col items-center gap-1 text-center">
      <div className="flex flex-1 flex-col items-center gap-1">
        <SeferThumbnail imageUrl={item.listing?.imageUrls?.[0]} alt={item.sefer.englishName} size={112} />
        <button
          type="button"
          className="mt-1 line-clamp-2 text-sm font-semibold text-accent hover:underline"
          onClick={() => navigate(`/seforim/${item.sefer.seferId}`)}
        >
          {item.sefer.englishName}
        </button>
        <p className="text-xs text-text-muted">
          {seferTypeText(item.sefer.type, item.sefer.customType, t(`sefer.${item.sefer.type}`))}
          {subLabel ? ` · ${subLabel}` : ''}
        </p>
        {showDemand && (
          <p className="text-xs font-semibold text-accent">
            {item.need > 0 ? t('seforim.needed', { count: item.need }) : t('seforim.noneNeeded')}
          </p>
        )}
        {item.listing ? (
          <p className="text-sm font-medium">${item.listing.price.toFixed(2)}</p>
        ) : (
          <p className="text-xs text-text-muted">{t('actions.noResults')}</p>
        )}
        {inCartCount > 0 && (
          <p className="text-xs font-medium text-accent">{t('pushka.inPushka', { count: inCartCount })}</p>
        )}
        {item.listing && !item.inStock && (
          <p className="text-xs font-medium text-error">{t('filterSort.outOfStock')}</p>
        )}
      </div>

      {item.listing && item.inStock && (
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
                setQuantity(digits === '' ? 0 : Number(digits));
              }}
              aria-label={t('campaign.quantityLabel') ?? ''}
              className="min-w-0 flex-1 border-0 bg-transparent text-center text-sm focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              aria-label={t('pushka.increaseQuantity') ?? ''}
              className="flex h-full w-7 shrink-0 items-center justify-center text-text-muted"
            >
              <PlusIcon width={13} height={13} />
            </button>
          </div>
          <button
            type="button"
            onClick={handleAdd}
            disabled={quantity <= 0}
            aria-label={t('pushka.addToPushka') ?? ''}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-white disabled:opacity-30"
          >
            <PushkaIcon width={16} height={16} />
          </button>
        </div>
      )}
    </Card>
  );
}
