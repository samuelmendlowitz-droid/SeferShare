import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { getCampaign } from '../services/campaigns';
import { listSefarim } from '../services/sefarim';
import type { Campaign, Sefer } from '../types';
import { DetailPageLayout } from '../components/layout/DetailPageLayout';
import { CampaignEditForm } from '../components/shared/CampaignEditForm';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

export function CampaignEditPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { campaignId } = useParams();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [sefarimById, setSefarimById] = useState<Map<string, Sefer>>(new Map());

  useEffect(() => {
    if (!campaignId) return;
    (async () => {
      const [c, sefarim] = await Promise.all([getCampaign(campaignId), listSefarim()]);
      if (!c) {
        setNotFound(true);
        return;
      }
      setCampaign(c);
      setSefarimById(new Map(sefarim.map((s) => [s.seferId, s])));
    })();
  }, [campaignId]);

  if (notFound) {
    return (
      <DetailPageLayout fallbackPath="/campaigns">
        <p className="text-text-muted">{t('campaign.notFound')}</p>
      </DetailPageLayout>
    );
  }

  if (!campaign) {
    return (
      <DetailPageLayout fallbackPath="/campaigns">
        <LoadingSpinner />
      </DetailPageLayout>
    );
  }

  return (
    <DetailPageLayout fallbackPath={`/campaigns/${campaign.campaignId}`}>
      <h1 className="mb-4 text-xl font-bold">{t('campaign.edit')}</h1>
      <CampaignEditForm
        campaign={campaign}
        sefarimById={sefarimById}
        onSaved={() => navigate(`/campaigns/${campaign.campaignId}`)}
        onDeleted={() => navigate('/campaigns')}
      />
    </DetailPageLayout>
  );
}
