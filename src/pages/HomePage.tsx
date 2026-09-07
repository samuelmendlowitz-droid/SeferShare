import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout, type HomeFilter } from '../components/layout/AppLayout';
import { CampaignCard } from '../components/campaign/CampaignCard';
import { useCampaignFeed } from '../hooks/useCampaignFeed';

export function HomePage() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<HomeFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { loading, campaigns, institutionsById, neshamosById } = useCampaignFeed(filter, searchQuery);

  return (
    <AppLayout variant="home" filter={filter} onFilterChange={setFilter} onSearch={setSearchQuery}>
      <h1 className="mb-4 text-xl font-bold">{t('app.name')}</h1>

      {loading ? (
        <p className="text-text-muted">…</p>
      ) : campaigns.length === 0 ? (
        <p className="text-text-muted">{t('home.empty')}</p>
      ) : (
        campaigns.map((campaign) => (
          <CampaignCard
            key={campaign.campaignId}
            campaign={campaign}
            institution={campaign.institutionId ? institutionsById.get(campaign.institutionId) : undefined}
            neshama={campaign.neshamaId ? neshamosById.get(campaign.neshamaId) : undefined}
          />
        ))
      )}
    </AppLayout>
  );
}
