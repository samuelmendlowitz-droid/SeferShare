import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getInstitution } from '../services/institutions';
import { listCampaignsByInstitution } from '../services/campaigns';
import type { Campaign, Institution } from '../types';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

export function InstitutionDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { institutionId } = useParams();
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [activeCampaign, setActiveCampaign] = useState<Campaign | null | undefined>(undefined);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!institutionId) return;
    let cancelled = false;
    (async () => {
      try {
        const inst = await getInstitution(institutionId);
        if (cancelled) return;
        if (!inst) {
          setNotFound(true);
          return;
        }
        const campaigns = await listCampaignsByInstitution(institutionId);
        if (cancelled) return;
        setInstitution(inst);
        setActiveCampaign(campaigns.find((c) => c.status === 'active') ?? null);
      } catch {
        if (!cancelled) setLoadError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
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

  if (loadError) {
    return (
      <div className="mx-auto max-w-2xl px-4 pt-6">
        <Button variant="secondary" className="mb-4" onClick={() => navigate('/')}>
          {t('actions.back')}
        </Button>
        <p className="text-text-muted">{t('institution.loadError')}</p>
      </div>
    );
  }

  if (!institution || activeCampaign === undefined) return <LoadingSpinner fullScreen />;

  if (activeCampaign) {
    return <Navigate to={`/campaigns/${activeCampaign.campaignId}`} replace />;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pt-6">
      <Button variant="secondary" className="mb-4" onClick={() => navigate('/')}>
        {t('actions.back')}
      </Button>

      <Card className="text-center">
        <h1 className="mb-1 text-lg font-bold">{institution.name}</h1>
        <p className="mb-4 text-sm font-medium text-text-muted">{t('institution.noActiveCampaign')}</p>
        <p className="mb-4 text-sm text-text">{t('institution.noActiveCampaignPrompt')}</p>
        <div className="flex flex-col gap-2">
          <Button onClick={() => navigate('/', { state: { tab: 'what', institutionId: institution.institutionId } })}>
            {t('donation.makeADonation')}
          </Button>
          <Button variant="secondary" onClick={() => navigate('/', { state: { tab: 'all' } })}>
            {t('institution.findAnotherCampaign')}
          </Button>
          {profile?.uid === institution.createdByUid && (
            <Button
              variant="secondary"
              onClick={() => navigate(`/institutions/${institution.institutionId}/spend`)}
            >
              {t('institution.giftCardBalance', { amount: (institution.giftCardBalance ?? 0).toFixed(2) })}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
