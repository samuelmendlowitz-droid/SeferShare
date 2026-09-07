import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { Campaign, Institution, Neshama } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { campaignDollarTotal } from '../../lib/campaignMath';
import { Card } from '../ui/Card';
import { ProgressBar } from './ProgressBar';

interface CampaignCardProps {
  campaign: Campaign;
  institution?: Institution;
  neshama?: Neshama;
}

export function CampaignCard({ campaign, institution, neshama }: CampaignCardProps) {
  const { t } = useTranslation();
  const { showBilingual } = useLanguage();
  const navigate = useNavigate();
  const dollarTotal = campaignDollarTotal(campaign);

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
        <p className="text-sm text-text-muted">
          {t('home.dollarTotal', { amount: dollarTotal.toFixed(2) })}
        </p>
      </div>

      <div className="mt-2">
        <ProgressBar fulfilled={campaign.totalItemsFulfilled} needed={campaign.totalItemsNeeded} />
      </div>

      {campaign.status === 'fulfilled' && (
        <span className="mt-2 inline-block rounded-pill bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
          {t('home.fulfilled')}
        </span>
      )}
    </Card>
  );
}
