import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDetailStack } from '../../context/DetailStackContext';
import { getSefer } from '../../services/sefarim';
import { listCampaignsBySefer } from '../../services/campaigns';
import { useLanguage } from '../../context/LanguageContext';
import { seferTypeText, subtypeLabel } from '../../lib/seferTaxonomy';
import type { Campaign, Sefer } from '../../types';
import { DetailPopup } from './DetailPopup';
import { Card } from '../ui/Card';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface SeferPopupContentProps {
  id: string;
  isTop: boolean;
  zIndex: number;
  onClose: () => void;
}

export function SeferPopupContent({ id: seferId, isTop, zIndex, onClose }: SeferPopupContentProps) {
  const { t } = useTranslation();
  const { showBilingual } = useLanguage();
  const { open } = useDetailStack();
  const [sefer, setSefer] = useState<Sefer | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[] | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const s = await getSefer(seferId);
      if (cancelled) return;
      if (!s) {
        setNotFound(true);
        return;
      }
      setSefer(s);
      const found = await listCampaignsBySefer(seferId);
      if (!cancelled) setCampaigns(found);
    })();
    return () => {
      cancelled = true;
    };
  }, [seferId]);

  if (notFound) {
    return (
      <DetailPopup title={t('sefer.notFound')} onClose={onClose} isTop={isTop} zIndex={zIndex}>
        <p className="text-text-muted">{t('sefer.notFound')}</p>
      </DetailPopup>
    );
  }

  if (!sefer || campaigns === undefined) {
    return (
      <DetailPopup title="…" onClose={onClose} isTop={isTop} zIndex={zIndex}>
        <LoadingSpinner />
      </DetailPopup>
    );
  }

  const typeText = seferTypeText(sefer.type, sefer.customType, t(`sefer.${sefer.type}`));
  const subLabel = subtypeLabel(sefer.type, sefer.subType, showBilingual, sefer.customSubType);

  return (
    <DetailPopup title={sefer.englishName} onClose={onClose} isTop={isTop} zIndex={zIndex}>
      <Card className="mb-4">
        {sefer.hebrewName && (
          <p dir="rtl" className="text-sm text-text">
            {sefer.hebrewName}
          </p>
        )}
        <p className="mt-1 text-sm text-text-muted">
          {typeText}
          {subLabel ? ` · ${subLabel}` : ''}
        </p>
      </Card>

      <h2 className="mb-2 text-base font-semibold">{t('sefer.requestedByCampaigns')}</h2>
      {campaigns.length === 0 ? (
        <p className="text-sm text-text-muted">{t('sefer.noCampaigns')}</p>
      ) : (
        <div className="space-y-2">
          {campaigns.map((campaign) => (
            <Card
              key={campaign.campaignId}
              className="cursor-pointer transition-transform duration-200 hover:-translate-y-0.5"
              onClick={() => open('campaign', campaign.campaignId)}
            >
              <p className="text-sm font-semibold">{campaign.title || t('campaign.untitled')}</p>
            </Card>
          ))}
        </div>
      )}
    </DetailPopup>
  );
}
