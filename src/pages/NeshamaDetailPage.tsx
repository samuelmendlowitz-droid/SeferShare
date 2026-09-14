import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { getNeshama } from '../services/neshamos';
import { listCampaignsByNeshama } from '../services/campaigns';
import { getInstitution } from '../services/institutions';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { neshamaDedicationLine } from '../lib/neshamaFormat';
import type { Campaign, Institution, Neshama } from '../types';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

export function NeshamaDetailPage() {
  const { t } = useTranslation();
  const { showBilingual } = useLanguage();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { neshamaId } = useParams();
  const [neshama, setNeshama] = useState<Neshama | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[] | undefined>(undefined);
  const [institutionsById, setInstitutionsById] = useState<Map<string, Institution>>(new Map());
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!neshamaId) return;
    let cancelled = false;
    (async () => {
      try {
        const nesh = await getNeshama(neshamaId);
        if (cancelled) return;
        if (!nesh) {
          setNotFound(true);
          return;
        }
        const found = await listCampaignsByNeshama(neshamaId);
        if (cancelled) return;
        const active = found.filter((c) => c.status === 'active');
        const institutions = await Promise.all(
          [...new Set(active.map((c) => c.institutionId))].map((id) => getInstitution(id)),
        );
        if (cancelled) return;
        setNeshama(nesh);
        setCampaigns(active);
        setInstitutionsById(new Map(institutions.filter((i): i is Institution => Boolean(i)).map((i) => [i.institutionId, i])));
      } catch {
        if (!cancelled) setLoadError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
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

  if (loadError) {
    return (
      <div className="mx-auto max-w-2xl px-4 pt-6">
        <Button variant="secondary" className="mb-4" onClick={() => navigate('/')}>
          {t('actions.back')}
        </Button>
        <p className="text-text-muted">{t('neshama.loadError')}</p>
      </div>
    );
  }

  if (!neshama || campaigns === undefined) return <LoadingSpinner fullScreen />;

  return (
    <div className="mx-auto max-w-2xl px-4 pt-6">
      <div className="mb-4 flex items-center justify-between">
        <Button variant="secondary" onClick={() => navigate('/')}>
          {t('actions.back')}
        </Button>
        {profile?.uid === neshama.createdByUid && (
          <Button variant="secondary" onClick={() => navigate(`/neshamos/${neshama.neshamaId}/edit`)}>
            {t('neshama.edit')}
          </Button>
        )}
      </div>

      <Card className="mb-4 text-center">
        <h1 className="text-lg font-bold">
          {t('neshama.liluyNishmat')} {neshamaDedicationLine(neshama, showBilingual)}
        </h1>
        {(neshama.seferTypes ?? []).length > 0 && (
          <p className="mt-1 text-xs text-text-muted">
            {(neshama.seferTypes ?? []).map((type) => t(`sefer.${type}`)).join(', ')}
          </p>
        )}
      </Card>

      <h2 className="mb-2 text-base font-semibold">{t('neshama.chooseCampaign')}</h2>
      {campaigns.length === 0 ? (
        <p className="mb-4 text-sm text-text-muted">{t('neshama.noActiveCampaign')}</p>
      ) : (
        <div className="mb-4 space-y-2">
          {campaigns.map((campaign) => (
            <Card
              key={campaign.campaignId}
              className="cursor-pointer transition-transform duration-200 hover:-translate-y-0.5"
              onClick={() => navigate(`/campaigns/${campaign.campaignId}`)}
            >
              <p className="text-sm font-semibold">{campaign.title || t('campaign.untitled')}</p>
              <p className="text-xs text-text-muted">{institutionsById.get(campaign.institutionId)?.name}</p>
            </Card>
          ))}
        </div>
      )}

      <h2 className="mb-2 text-base font-semibold">{t('neshama.chooseInstitution')}</h2>
      <Button className="w-full" onClick={() => navigate(`/neshamos/${neshama.neshamaId}/donate`)}>
        {t('neshama.donateInTheirName')}
      </Button>
    </div>
  );
}
