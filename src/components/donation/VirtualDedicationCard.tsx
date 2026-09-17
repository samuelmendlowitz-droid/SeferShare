import { useTranslation } from 'react-i18next';
import type { DonationAd, ParentGender, StickerDesign } from '../../types';
import type { PushkaGiftCard } from '../../context/PushkaContext';
import type { PickedItem } from './SeferPicker';
import { DEFAULT_STICKER_DESIGN } from '../../lib/stickerDesign';
import { StickerPreview } from './StickerPreview';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { GiftIcon } from '../ui/icons';

export interface StickerInfo {
  /** Campaign title this sticker is printed for — omitted for the donor's own
   *  cart-wide dedication or an algorithm-picked one (no campaign to name). */
  label?: string;
  name: string;
  hebrewName?: string;
  fatherHebrewName?: string;
  parentGender?: ParentGender;
  /** The institution this sefer is going to, when known at confirmation time. */
  donatedTo?: string;
}

interface VirtualDedicationCardProps {
  donorName: string;
  items: PickedItem[];
  giftCards?: PushkaGiftCard[];
  stickers: StickerInfo[];
  stickerDesign?: StickerDesign;
  ad?: DonationAd;
}

export function VirtualDedicationCard({
  donorName,
  items,
  giftCards = [],
  stickers,
  stickerDesign = DEFAULT_STICKER_DESIGN,
  ad,
}: VirtualDedicationCardProps) {
  const { t } = useTranslation();

  return (
    <Card className="border-2 border-accent/20 bg-gradient-to-b from-surface to-bg text-center">
      <p className="text-xs uppercase tracking-wide text-text-muted">{t('app.name')}</p>
      <p className="mt-3 text-lg font-bold text-accent">{t('donation.confirmedTitle')}</p>

      {stickers.length > 0 && (
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          {stickers.map((sticker, idx) => (
            <StickerPreview
              key={idx}
              design={stickerDesign}
              content={{
                label: sticker.label,
                dedicationName: sticker.name,
                dedicationHebrewName: sticker.hebrewName,
                dedicationFatherHebrewName: sticker.fatherHebrewName,
                dedicationParentGender: sticker.parentGender,
                donatedTo: sticker.donatedTo,
              }}
              className="max-w-[140px] shadow-card"
            />
          ))}
        </div>
      )}

      <div className="mt-4 space-y-1 text-left">
        {items.map((item) => (
          <p key={`${item.seferId}-${item.vendorId}`} className="text-sm">
            {item.quantity}× {item.englishName} · {item.hebrewName}
          </p>
        ))}
        {giftCards.map((giftCard) => (
          <p key={giftCard.id} className="flex items-center gap-1 text-sm">
            <GiftIcon width={14} height={14} />
            {giftCard.campaignTitle || giftCard.institutionName || t('donation.giftCardOption')}: $
            {giftCard.amount.toFixed(2)}
          </p>
        ))}
      </div>

      {ad && (
        <div className="mt-4 rounded-btn border border-dashed border-border p-2 text-left">
          <p className="text-xs font-medium text-text-muted">{t('donation.adSectionTitle')}</p>
          <p className="text-sm font-semibold">{ad.businessName}</p>
          {ad.message && <p className="text-xs text-text-muted">{ad.message}</p>}
        </div>
      )}

      <p className="mt-4 text-sm text-text-muted">— {donorName}</p>

      <Button className="mt-4" onClick={() => navigator.share?.({ title: t('app.name') ?? '' })}>
        {t('donation.share')}
      </Button>
    </Card>
  );
}
