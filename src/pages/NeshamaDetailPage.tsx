import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { getNeshama } from '../services/neshamos';
import { listCampaignsByNeshama } from '../services/campaigns';
import { listInstitutions } from '../services/institutions';
import { listSefarim } from '../services/sefarim';
import type { Campaign, Institution, Neshama, Sefer } from '../types';
import { CampaignCard } from '../components/campaign/CampaignCard';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useLanguage } from '../context/LanguageContext';

export function NeshamaDetailPage() {
  const { t } = useTranslation();
  const { showBilingual } = useLanguage();
  const navigate = useNavigate();
  const { neshamaId } = useParams();
  const [neshama, setNeshama] = useState<Neshama | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [institutionsById, setInstitutionsById] = useState<Map<string, Institution>>(new Map());
  const [sefarimById, setSefarimById] = useState<Map<string, Sefer>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!neshamaId) return;
    (async () => {
      const nesh = await getNeshama(neshamaId);
      if (!nesh) {
        setNotFound(true);
        return;
      }
      const [campaignsForNeshama, institutions, sefarim] = await Promise.all([
        listCampaignsByNeshama(neshamaId),
        listInstitutions(),
        listSefarim(),
      ]);
      setNeshama(nesh);
      setCampaigns(campaignsForNeshama);
      setInstitutionsById(new Map(institutions.map((i) => [i.institutionId, i])));
      setSefarimById(new Map(sefarim.map((s) => [s.seferId, s])));
      setLoading(false);
    })();
  }, [neshamaId]);

  if (notFound) {
    return (
      <div className="mx-auto max-w-2xl px-4 pt-6">
        <Button variant="secondary" className="mb-4" onClick={() => navigate('/')}>
          {t('actions.back')}
        </Button>
        <p className="text-text-muted">{t('neshama.notFound')}</p>
      </div>
    );
  }

  if (loading || !neshama) return <LoadingSpinner fullScreen />;

  return (
    <div className="mx-auto max-w-2xl px-4 pb-24 pt-6">
      <Button variant="secondary" className="mb-4" onClick={() => navigate('/')}>
        {t('actions.back')}
      </Button>

      <h1 className="mb-1 text-lg font-bold">
        {t('neshama.liluyNishmat')} {neshama.name}
        {showBilingual && neshama.hebrewName ? ` · ${neshama.hebrewName}` : ''}
      </h1>
      {neshama.message && <p className="mb-4 text-sm italic text-text-muted">"{neshama.message}"</p>}

      <h2 className="mb-2 text-base font-semibold">{t('campaign.campaignsHeading')}</h2>
      {campaigns.length === 0 ? (
        <p className="text-text-muted">{t('home.neshamosEmpty')}</p>
      ) : (
        campaigns.map((campaign) => (
          <CampaignCard
            key={campaign.campaignId}
            campaign={campaign}
            institution={campaign.institutionId ? institutionsById.get(campaign.institutionId) : undefined}
            neshama={neshama}
            sefarimById={sefarimById}
          />
        ))
      )}
    </div>
  );
}
