import { useTranslation } from 'react-i18next';
import type { DonationAd, DonationDedication } from '../../types';
import type { PickedItem } from './SeferPicker';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

export interface StickerInfo {
  /** Campaign title (or donation.yourDedicationTitle) this sticker is printed for. */
  label: string;
  name: string;
  hebrewName?: string;
  relationship?: string;
  message?: string;
}

interface VirtualDedicationCardProps {
  donorName: string;
  items: PickedItem[];
  stickers: StickerInfo[];
  additionalDedications?: DonationDedication[];
  ad?: DonationAd;
}

export function VirtualDedicationCard({ donorName, items, stickers, additionalDedications, ad }: VirtualDedicationCardProps) {
  const { t } = useTranslation();

  return (
    <Card className="border-2 border-accent/20 bg-gradient-to-b from-surface to-bg text-center">
      <p className="text-xs uppercase tracking-wide text-text-muted">{t('app.name')}</p>
      <p className="mt-3 text-lg font-bold text-accent">{t('donation.confirmedTitle')}</p>

      {stickers.length > 0 && (
        <div className="mt-4 space-y-2 text-left">
          {stickers.map((sticker, idx) => (
            <div key={idx} className="rounded-btn border border-border/60 p-2">
              {sticker.label && <p className="text-xs uppercase tracking-wide text-text-muted">{sticker.label}</p>}
              <p className="text-base font-semibold">
                {t('neshama.liluyNishmat')} {sticker.name}
                {sticker.hebrewName ? ` · ${sticker.hebrewName}` : ''}
              </p>
              {sticker.message && <p className="mt-1 text-sm italic text-text-muted">"{sticker.message}"</p>}
            </div>
          ))}
        </div>
      )}

      {additionalDedications && additionalDedications.length > 0 && (
        <div className="mt-3 text-left">
          <p className="text-xs font-medium text-text-muted">{t('donation.additionalDedicationTitle')}</p>
          {additionalDedications.map((dedication, idx) => (
            <p key={idx} className="text-sm">
              {t('neshama.liluyNishmat')} {dedication.name}
              {dedication.hebrewName ? ` · ${dedication.hebrewName}` : ''}
            </p>
          ))}
        </div>
      )}

      <div className="mt-4 space-y-1 text-left">
        {items.map((item) => (
          <p key={`${item.seferId}-${item.vendorId}`} className="text-sm">
            {item.quantity}× {item.englishName} · {item.hebrewName}
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
