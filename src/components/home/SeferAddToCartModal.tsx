import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { listCampaignsBySefer } from '../../services/campaigns';
import type { SeforimShopItem } from '../../hooks/useSeforimShopFeed';
import type { Campaign } from '../../types';
import { Modal } from '../ui/Modal';
import { NumberField } from '../ui/NumberField';
import { BubbleGrid } from '../ui/BubbleGrid';
import { Button } from '../ui/Button';

const PICK_FOR_ME = 'pickForMe';

interface SeferAddToCartModalProps {
  item: SeforimShopItem;
  onClose: () => void;
  /** `campaign` is omitted when the donor picked "pick for me" — the item is
   *  added untagged, same as today, for the server-side algorithm to assign. */
  onConfirm: (quantity: number, campaign?: Campaign) => void;
}

/** Asks how many, and — when at least one active campaign is currently asking
 *  for this sefer — which one the donor wants to credit, defaulting to "pick
 *  for me" (an untagged item, same as adding without a campaign at all). */
export function SeferAddToCartModal({ item, onClose, onConfirm }: SeferAddToCartModalProps) {
  const { t } = useTranslation();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>(PICK_FOR_ME);
  const [quantity, setQuantity] = useState(1);
  const [campaignQuery, setCampaignQuery] = useState('');

  useEffect(() => {
    let cancelled = false;
    listCampaignsBySefer(item.sefer.seferId).then((found) => {
      if (cancelled) return;
      setCampaigns(found);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [item.sefer.seferId]);

  const selectedCampaign = campaigns.find((c) => c.campaignId === selectedCampaignId);
  const maxQuantity = selectedCampaign
    ? selectedCampaign.items
        .filter((ci) => ci.seferId === item.sefer.seferId)
        .reduce((sum, ci) => sum + Math.max(0, ci.quantity - ci.quantityFulfilled), 0)
    : undefined;

  useEffect(() => {
    if (maxQuantity !== undefined) setQuantity((q) => Math.min(q, maxQuantity));
  }, [maxQuantity]);

  function remainingFor(campaign: Campaign): number {
    return campaign.items
      .filter((ci) => ci.seferId === item.sefer.seferId)
      .reduce((sum, ci) => sum + Math.max(0, ci.quantity - ci.quantityFulfilled), 0);
  }

  return (
    <Modal open onClose={onClose} title={item.sefer.englishName}>
      <div className="space-y-4">
        <NumberField label={t('campaign.quantityLabel')} value={quantity} onChange={setQuantity} min={1} max={maxQuantity} />

        {!loading && campaigns.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-medium">{t('pushka.whichCampaignLabel')}</p>
            <BubbleGrid
              options={[
                { value: PICK_FOR_ME, label: t('pushka.pickForMe') },
                ...campaigns
                  .filter((c) => (c.title ?? '').toLowerCase().includes(campaignQuery.trim().toLowerCase()))
                  .map((c) => ({
                    value: c.campaignId,
                    label: remainingFor(c) <= 0 ? `${c.title || t('campaign.untitled')} (${t('home.fulfilled')})` : c.title || t('campaign.untitled'),
                  })),
              ]}
              isSelected={(id) => selectedCampaignId === id}
              onToggle={setSelectedCampaignId}
              disabledValues={new Set(campaigns.filter((c) => remainingFor(c) <= 0).map((c) => c.campaignId))}
              search={{
                query: campaignQuery,
                onQueryChange: setCampaignQuery,
                placeholder: t('pushka.whichCampaignLabel') ?? '',
                label: t('pushka.whichCampaignLabel') ?? '',
              }}
            />
          </div>
        )}

        <Button className="w-full" disabled={quantity <= 0} onClick={() => onConfirm(quantity, selectedCampaign)}>
          {t('pushka.addToPushka')}
        </Button>
      </div>
    </Modal>
  );
}
