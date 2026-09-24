import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { DetailPageLayout } from '../components/layout/DetailPageLayout';
import { CampaignCreateForm } from '../components/shared/CampaignCreateForm';

export function CampaignCreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <DetailPageLayout fallbackPath="/profile">
      <h1 className="mb-4 text-xl font-bold">{t('campaign.create')}</h1>
      <CampaignCreateForm onCreated={(campaignId) => navigate(`/campaigns/${campaignId}`)} />
    </DetailPageLayout>
  );
}
