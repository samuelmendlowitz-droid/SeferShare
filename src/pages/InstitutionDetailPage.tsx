import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePushka } from '../context/PushkaContext';
import { getInstitution } from '../services/institutions';
import { listCampaignsByInstitution } from '../services/campaigns';
import type { Campaign, Institution } from '../types';
import { institutionTypeText } from '../lib/institutionFormat';
import { GiftCardOption } from '../components/donation/GiftCardOption';
import { DetailPageLayout } from '../components/layout/DetailPageLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

function addressLine(institution: Institution): string {
  const { line1, line2, city, state, postalCode } = institution.address;
  return [line1, line2, `${city}, ${state} ${postalCode}`.trim()].filter(Boolean).join(', ');
}

export function InstitutionDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { institutionId } = useParams();
  const { profile } = useAuth();
  const pushka = usePushka();
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[] | undefined>(undefined);

  useEffect(() => {
    if (!institutionId) return;
    let cancelled = false;
    (async () => {
      const inst = await getInstitution(institutionId);
      if (cancelled) return;
      if (!inst) {
        setNotFound(true);
        return;
      }
      setInstitution(inst);
      const found = await listCampaignsByInstitution(institutionId);
      if (!cancelled) setCampaigns(found);
    })();
    return () => {
      cancelled = true;
    };
  }, [institutionId]);

  if (notFound) {
    return (
      <DetailPageLayout fallbackPath="/campaigns">
        <p className="text-text-muted">{t('institution.notFound')}</p>
      </DetailPageLayout>
    );
  }

  if (!institution || campaigns === undefined) {
    return (
      <DetailPageLayout fallbackPath="/campaigns">
        <LoadingSpinner />
      </DetailPageLayout>
    );
  }

  const isOwn = profile?.uid === institution.createdByUid;

  return (
    <DetailPageLayout fallbackPath="/campaigns">
      <div className="mb-4 border-b border-border pb-4">
        <h1 className="text-2xl font-bold">{institution.name}</h1>
        <p className="mt-1 text-sm text-text-muted">
          {institutionTypeText(institution.type, institution.customType, t(`institution.${institution.type}`))}
        </p>
        <p className="mt-1 text-sm text-text">{addressLine(institution)}</p>
        <p className={`mt-1 text-xs font-medium ${institution.verified ? 'text-success' : 'text-text-muted'}`}>
          {institution.verified ? t('institution.verified') : t('institution.unverified')}
        </p>
      </div>

      {campaigns.length > 0 && (
        <>
          <h2 className="mb-2 text-base font-semibold">{t('campaign.campaignsHeading')}</h2>
          <div className="mb-4 space-y-2">
            {campaigns.map((campaign) => (
              <Card
                key={campaign.campaignId}
                className="cursor-pointer transition-transform duration-200 hover:-translate-y-0.5"
                onClick={() => navigate(`/campaigns/${campaign.campaignId}`)}
              >
                <p className="text-sm font-semibold">{campaign.title || t('campaign.untitled')}</p>
              </Card>
            ))}
          </div>
        </>
      )}

      <GiftCardOption
        onAdd={(amount) => pushka.addGiftCard({ institutionId: institution.institutionId, institutionName: institution.name, amount })}
      />

      {isOwn && (
        <div className="mt-4 space-y-2 border-t border-border pt-4">
          {/* Spending the gift card balance happens from Seforim > Gallery's
              institution switcher now, not from here — this just surfaces it. */}
          <p className="text-xs text-text-muted">
            {t('institution.giftCardBalance', { amount: (institution.giftCardBalance ?? 0).toFixed(2) })}
          </p>
          <Button variant="secondary" className="w-full" onClick={() => navigate(`/institutions/${institution.institutionId}/edit`)}>
            {t('institution.edit')}
          </Button>
        </div>
      )}
    </DetailPageLayout>
  );
}
