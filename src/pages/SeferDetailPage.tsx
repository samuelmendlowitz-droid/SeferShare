import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { getSefer } from '../services/sefarim';
import { listCampaignsBySefer } from '../services/campaigns';
import { useLanguage } from '../context/LanguageContext';
import { seferTypeText, subtypeLabel } from '../lib/seferTaxonomy';
import type { Campaign, Sefer } from '../types';
import { DetailPageLayout } from '../components/layout/DetailPageLayout';
import { Card } from '../components/ui/Card';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

export function SeferDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { seferId } = useParams();
  const { showBilingual } = useLanguage();
  const [sefer, setSefer] = useState<Sefer | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[] | undefined>(undefined);

  useEffect(() => {
    if (!seferId) return;
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
      <DetailPageLayout fallbackPath="/seforim">
        <p className="text-text-muted">{t('sefer.notFound')}</p>
      </DetailPageLayout>
    );
  }

  if (!sefer || campaigns === undefined) {
    return (
      <DetailPageLayout fallbackPath="/seforim">
        <LoadingSpinner />
      </DetailPageLayout>
    );
  }

  const typeText = seferTypeText(sefer.type, sefer.customType, t(`sefer.${sefer.type}`));
  const subLabel = subtypeLabel(sefer.type, sefer.subType, showBilingual, sefer.customSubType);
  const languagesText = (sefer.languages ?? []).map((lang) => t(`sefer.languages.${lang}`)).join(', ');

  return (
    <DetailPageLayout fallbackPath="/seforim">
      <div className="mb-4 border-b border-border pb-4">
        <p className="text-sm text-text-muted">
          {typeText}
          {subLabel ? ` · ${subLabel}` : ''}
        </p>
        <h1 className="mt-1 text-2xl font-bold">{sefer.englishName}</h1>
        {sefer.hebrewName && (
          <p dir="rtl" className="mt-1 text-base text-text">
            {sefer.hebrewName}
          </p>
        )}
        {languagesText && <p className="mt-1 text-sm text-text-muted">{languagesText}</p>}
      </div>

      <h2 className="mb-2 text-base font-semibold">{t('sefer.requestedByCampaigns')}</h2>
      {campaigns.length === 0 ? (
        <p className="text-sm text-text-muted">{t('sefer.noCampaigns')}</p>
      ) : (
        <div className="space-y-2">
          {campaigns.map((campaign) => {
            const matching = campaign.items.filter((item) => item.seferId === seferId);
            const quantity = matching.reduce((sum, item) => sum + item.quantity, 0);
            const quantityFulfilled = matching.reduce((sum, item) => sum + item.quantityFulfilled, 0);
            const stillNeeded = Math.max(0, quantity - quantityFulfilled);

            return (
              <Card
                key={campaign.campaignId}
                className="cursor-pointer transition-transform duration-200 hover:-translate-y-0.5"
                onClick={() => navigate(`/campaigns/${campaign.campaignId}`)}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold">{campaign.title || t('campaign.untitled')}</p>
                  <p className="shrink-0 text-sm text-text-muted">
                    {quantityFulfilled}/{quantity}
                  </p>
                </div>
                <p className="text-xs text-text-muted">{t('sefer.stillNeeded', { count: stillNeeded })}</p>
              </Card>
            );
          })}
        </div>
      )}
    </DetailPageLayout>
  );
}
