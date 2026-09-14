import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { getInstitution } from '../services/institutions';
import { listCampaignsByInstitution } from '../services/campaigns';
import { listNeshamos } from '../services/neshamos';
import { listSefarim } from '../services/sefarim';
import type { Campaign, Institution, Neshama, Sefer } from '../types';
import { CampaignCard } from '../components/campaign/CampaignCard';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useLanguage } from '../context/LanguageContext';

export function InstitutionDetailPage() {
  const { t } = useTranslation();
  const { showBilingual } = useLanguage();
  const navigate = useNavigate();
  const { institutionId } = useParams();
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [neshamosById, setNeshamosById] = useState<Map<string, Neshama>>(new Map());
  const [sefarimById, setSefarimById] = useState<Map<string, Sefer>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!institutionId) return;
    (async () => {
      const inst = await getInstitution(institutionId);
      if (!inst) {
        setNotFound(true);
        return;
      }
      const [campaignsForInstitution, neshamos, sefarim] = await Promise.all([
        listCampaignsByInstitution(institutionId),
        listNeshamos(),
        listSefarim(),
      ]);
      setInstitution(inst);
      setCampaigns(campaignsForInstitution);
      setNeshamosById(new Map(neshamos.map((n) => [n.neshamaId, n])));
      setSefarimById(new Map(sefarim.map((s) => [s.seferId, s])));
      setLoading(false);
    })();
  }, [institutionId]);

  if (notFound) {
    return (
      <div className="mx-auto max-w-2xl px-4 pt-6">
        <Button variant="secondary" className="mb-4" onClick={() => navigate('/')}>
          {t('actions.back')}
        </Button>
        <p className="text-text-muted">{t('institution.notFound')}</p>
      </div>
    );
  }

  if (loading || !institution) return <LoadingSpinner fullScreen />;

  return (
    <div className="mx-auto max-w-2xl px-4 pb-24 pt-6">
      <Button variant="secondary" className="mb-4" onClick={() => navigate('/')}>
        {t('actions.back')}
      </Button>

      <h1 className="mb-1 text-lg font-bold">
        {institution.name}
        {showBilingual && institution.hebrewName ? ` · ${institution.hebrewName}` : ''}
      </h1>
      <p className="mb-4 text-sm text-text-muted">{t(`institution.${institution.type}`)}</p>

      <h2 className="mb-2 text-base font-semibold">{t('campaign.campaignsHeading')}</h2>
      {campaigns.length === 0 ? (
        <p className="text-text-muted">{t('home.mekomosEmpty')}</p>
      ) : (
        campaigns.map((campaign) => (
          <CampaignCard
            key={campaign.campaignId}
            campaign={campaign}
            institution={institution}
            neshama={campaign.neshamaId ? neshamosById.get(campaign.neshamaId) : undefined}
            sefarimById={sefarimById}
          />
        ))
      )}
    </div>
  );
}
