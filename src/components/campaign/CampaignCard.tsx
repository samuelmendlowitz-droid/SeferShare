import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { Campaign, Institution, Neshama, Sefer } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { campaignDollarFulfilled, campaignDollarTotal } from '../../lib/campaignMath';
import { neshamaDedicationLine } from '../../lib/neshamaFormat';
import { Card } from '../ui/Card';
import { EditIcon } from '../ui/icons';
import { ProgressBar } from './ProgressBar';

interface CampaignCardProps {
  campaign: Campaign;
  institution?: Institution;
  neshamas?: Neshama[];
  sefarimById: Map<string, Sefer>;
}

export function CampaignCard({ campaign, institution, neshamas = [], sefarimById }: CampaignCardProps) {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { showBilingual } = useLanguage();
  const navigate = useNavigate();
  const dollarTotal = campaignDollarTotal(campaign);
  const dollarFulfilled = campaignDollarFulfilled(campaign);
  const isOwn = profile?.uid === campaign.createdByUid;

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
      <div className="flex items-start justify-between gap-2">
        {campaign.title && <p className="mb-1 text-base font-semibold">{campaign.title}</p>}
        {isOwn && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/campaigns/${campaign.campaignId}/edit`);
            }}
            aria-label={t('campaign.edit') ?? ''}
            className="shrink-0 text-text-muted hover:text-accent"
          >
            <EditIcon width={16} height={16} />
          </button>
        )}
      </div>

      {(institution || neshamas.length > 0) && (
        <p className="text-sm text-text">
          {institution && (
            <span>
              {institution.name}
              {showBilingual && institution.hebrewName ? ` · ${institution.hebrewName}` : ''}
            </span>
          )}
          {institution && neshamas.length > 0 && ' • '}
          {neshamas.length > 0 && (
            <span className={institution ? 'text-text-muted' : ''}>
              {t('neshama.liluyNishmat')} {neshamas.map((n) => neshamaDedicationLine(n, showBilingual)).join(', ')}
            </span>
          )}
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
