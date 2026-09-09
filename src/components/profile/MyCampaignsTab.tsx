import { useTranslation } from 'react-i18next';
import type { Campaign, Institution, Neshama } from '../../types';
import { CampaignCard } from '../campaign/CampaignCard';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface MyCampaignsTabProps {
  loading: boolean;
  campaigns: Campaign[];
  institutionsById: Map<string, Institution>;
  neshamosById: Map<string, Neshama>;
}

export function MyCampaignsTab({ loading, campaigns, institutionsById, neshamosById }: MyCampaignsTabProps) {
  const { t } = useTranslation();

  if (loading) return <LoadingSpinner />;
  if (campaigns.length === 0) return <p className="text-text-muted">{t('home.empty')}</p>;

  return (
    <div>
      {campaigns.map((c) => (
        <CampaignCard
          key={c.campaignId}
          campaign={c}
          institution={c.institutionId ? institutionsById.get(c.institutionId) : undefined}
          neshama={c.neshamaId ? neshamosById.get(c.neshamaId) : undefined}
        />
      ))}
    </div>
  );
}
