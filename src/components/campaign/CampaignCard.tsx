import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { Campaign, Institution, Neshama, Sefer } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { campaignDollarFulfilled, campaignDollarTotal } from '../../lib/campaignMath';
import { formatCampaignDateRange } from '../../lib/campaignDates';
import { getCampaignThemeHex } from '../../lib/campaignTheme';
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
  const { language, showBilingual } = useLanguage();
  const navigate = useNavigate();
  const dollarTotal = campaignDollarTotal(campaign);
  const dollarFulfilled = campaignDollarFulfilled(campaign);
  const isOwn = profile?.uid === campaign.createdByUid;
  const themeHex = getCampaignThemeHex(campaign.colorTheme);
  const dateRangeText = formatCampaignDateRange(campaign.startDate, campaign.endDate, language);

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
      className="mb-3 cursor-pointer overflow-hidden transition-transform duration-200 hover:-translate-y-0.5"
      onClick={() => navigate(`/campaigns/${campaign.campaignId}`)}
    >
        <div className="-mx-4 -mt-4 mb-3">
          <div className="h-1.5" style={{ backgroundColor: themeHex }} />
          {campaign.headerImageUrl && (
            <img src={campaign.headerImageUrl} alt="" className="h-32 w-full object-cover" />
          )}
        </div>

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
              title={t('campaign.edit') ?? ''}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-text-muted hover:bg-bg hover:text-accent"
            >
              <EditIcon width={16} height={16} />
            </button>
          )}
        </div>

        {/* Only the campaign's objective shows here — a 'neshama' campaign can still
            have an institution attached (and vice versa), but the card is about
            whichever one is the actual point. Campaigns created before this field
            existed default to 'institution', matching their old behavior. */}
        {(campaign.objective ?? 'institution') === 'institution' && institution && (
          <p className="text-sm text-text">
            <button
              type="button"
              className="hover:underline"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/institutions/${institution.institutionId}`);
              }}
            >
              {institution.name}
              {showBilingual && institution.hebrewName ? ` · ${institution.hebrewName}` : ''}
            </button>
          </p>
        )}
        {(campaign.objective ?? 'institution') === 'neshama' && neshamas.length > 0 && (
          <p className="text-sm text-text-muted">
            {t('neshama.liluyNishmat')}{' '}
            {neshamas.map((n, idx) => (
              <span key={n.neshamaId}>
                {idx > 0 && ', '}
                <button
                  type="button"
                  className="hover:underline"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/neshamos/${n.neshamaId}`);
                  }}
                >
                  {neshamaDedicationLine(n, showBilingual)}
                </button>
              </span>
            ))}
          </p>
        )}

        <div className="mt-3">
          <p className="text-lg font-bold" style={{ color: themeHex }}>
            {t('home.itemsNeeded', {
              fulfilled: campaign.totalItemsFulfilled,
              needed: campaign.totalItemsNeeded,
            })}
          </p>
          {seferTypesText && <p className="text-xs text-text-muted">{seferTypesText}</p>}
          {dateRangeText && <p className="text-xs text-text-muted">{dateRangeText}</p>}
        </div>

        <div className="mt-2">
          <p className="mb-1 text-xs text-text-muted">
            {t('home.dollarProgress', { fulfilled: dollarFulfilled.toFixed(2), total: dollarTotal.toFixed(2) })}
          </p>
          <ProgressBar fulfilled={dollarFulfilled} needed={dollarTotal} colorHex={themeHex} />
        </div>

        {campaign.status === 'fulfilled' && (
          <span className="mt-2 inline-block rounded-pill bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
            {t('home.fulfilled')}
          </span>
        )}
    </Card>
  );
}
