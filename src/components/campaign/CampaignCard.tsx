import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { Campaign, Institution, Neshama, Sefer } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { campaignDollarFulfilled, campaignDollarTotal } from '../../lib/campaignMath';
import { Card } from '../ui/Card';
import { ProgressBar } from './ProgressBar';

interface CampaignCardProps {
  campaign: Campaign;
  institution?: Institution;
  neshama?: Neshama;
  sefarimById: Map<string, Sefer>;
}

export function CampaignCard({ campaign, institution, neshama, sefarimById }: CampaignCardProps) {
  const { t } = useTranslation();
  const { showBilingual } = useLanguage();
  const navigate = useNavigate();
  const dollarTotal = campaignDollarTotal(campaign);
  const dollarFulfilled = campaignDollarFulfilled(campaign);

  const seferTypesText = useMemo(() => {
    const types = new Set<string>();
    campaign.items.forEach((item) => {
      const type = sefarimById.get(item.seferId)?.type;
      if (type) types.add(t(`sefer.${type}`));
    });
    return [...types].join(', ');
  }, [campaign.items, sefarimById, t]);

  return (
    <Card
      className="mb-3 cursor-pointer transition-transform duration-200 hover:-translate-y-0.5"
      onClick={() => navigate(`/campaigns/${campaign.campaignId}`)}
    >
      {campaign.title && <p className="mb-1 text-base font-semibold">{campaign.title}</p>}

      {institution && (
        <p className="text-sm text-text">
          {institution.name}
          {showBilingual && institution.hebrewName ? ` · ${institution.hebrewName}` : ''}
        </p>
      )}
      {neshama && (
        <p className="text-sm text-text-muted">
          {t('neshama.liluyNishmat')} {neshama.name}
          {showBilingual && neshama.hebrewName ? ` · ${neshama.hebrewName}` : ''}
        </p>
      )}

      <div className="mt-3">
        <p className="text-lg font-bold text-accent">
          {t('home.itemsNeeded', {
            fulfilled: campaign.totalItemsFulfilled,
            needed: campaign.totalItemsNeeded,
          })}
        </p>
        {seferTypesText && <p className="text-xs text-text-muted">{seferTypesText}</p>}
      </div>

      <div className="mt-2">
        <p className="mb-1 text-xs text-text-muted">
          {t('home.dollarProgress', { fulfilled: dollarFulfilled.toFixed(2), total: dollarTotal.toFixed(2) })}
        </p>
        <ProgressBar fulfilled={dollarFulfilled} needed={dollarTotal} />
      </div>

      {campaign.status === 'fulfilled' && (
        <span className="mt-2 inline-block rounded-pill bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
          {t('home.fulfilled')}
        </span>
      )}
    </Card>
  );
}
