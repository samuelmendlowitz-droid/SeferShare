import { useTranslation } from 'react-i18next';
import type { Campaign, Institution, Neshama, Sefer } from '../../types';
import { CampaignCard } from '../campaign/CampaignCard';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface MyCampaignsTabProps {
  loading: boolean;
  campaigns: Campaign[];
  institutionsById: Map<string, Institution>;
  neshamosById: Map<string, Neshama>;
  sefarimById: Map<string, Sefer>;
}

export function MyCampaignsTab({ loading, campaigns, institutionsById, neshamosById, sefarimById }: MyCampaignsTabProps) {
  const { t } = useTranslation();

  if (loading) return <LoadingSpinner />;
  if (campaigns.length === 0) return <p className="text-text-muted">{t('home.empty')}</p>;

  return (
    <div>
      {campaigns.map((c) => (
        <CampaignCard
          key={c.campaignId}
          campaign={c}
          institution={institutionsById.get(c.institutionId)}
          neshamas={(c.neshamaIds ?? [])
            .map((id) => neshamosById.get(id))
            .filter((n): n is Neshama => Boolean(n))}
          sefarimById={sefarimById}
        />
      ))}
    </div>
  );
}
