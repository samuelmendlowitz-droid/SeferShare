import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { getNeshama } from '../services/neshamos';
import { listCampaignsByNeshama } from '../services/campaigns';
import type { Campaign, Neshama } from '../types';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

export function NeshamaDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { neshamaId } = useParams();
  const [neshama, setNeshama] = useState<Neshama | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [activeCampaign, setActiveCampaign] = useState<Campaign | null | undefined>(undefined);
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
        const campaigns = await listCampaignsByNeshama(neshamaId);
        if (cancelled) return;
        setNeshama(nesh);
        setActiveCampaign(campaigns.find((c) => c.status === 'active') ?? null);
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

  if (!neshama || activeCampaign === undefined) return <LoadingSpinner fullScreen />;

  if (activeCampaign) {
    return <Navigate to={`/campaigns/${activeCampaign.campaignId}`} replace />;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pt-6">
      <Button variant="secondary" className="mb-4" onClick={() => navigate('/')}>
        {t('actions.back')}
      </Button>

      <Card className="text-center">
        <h1 className="mb-1 text-lg font-bold">
          {t('neshama.liluyNishmat')} {neshama.name}
        </h1>
        <p className="mb-4 text-sm font-medium text-text-muted">{t('neshama.noActiveCampaign')}</p>
        <Button className="w-full" onClick={() => navigate(`/neshamos/${neshama.neshamaId}/donate`)}>
          {t('neshama.donateInTheirName')}
        </Button>
      </Card>
    </div>
  );
}
