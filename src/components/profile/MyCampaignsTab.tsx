import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { listMyCampaigns } from '../../services/campaigns';
import { listInstitutions } from '../../services/institutions';
import { listNeshamos } from '../../services/neshamos';
import type { Campaign, Institution, Neshama } from '../../types';
import { CampaignCard } from '../campaign/CampaignCard';
import { LoadingSpinner } from '../ui/LoadingSpinner';

export function MyCampaignsTab() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [institutionsById, setInstitutionsById] = useState<Map<string, Institution>>(new Map());
  const [neshamosById, setNeshamosById] = useState<Map<string, Neshama>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    Promise.all([listMyCampaigns(profile.uid), listInstitutions(), listNeshamos()])
      .then(([c, insts, nesh]) => {
        setCampaigns(c);
        setInstitutionsById(new Map(insts.map((i) => [i.institutionId, i])));
        setNeshamosById(new Map(nesh.map((n) => [n.neshamaId, n])));
      })
      .finally(() => setLoading(false));
  }, [profile]);

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
