import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { usePushka } from '../../context/PushkaContext';
import { useDetailStack } from '../../context/DetailStackContext';
import { getInstitution } from '../../services/institutions';
import { listCampaignsByInstitution } from '../../services/campaigns';
import type { Campaign, Institution } from '../../types';
import { institutionTypeText } from '../../lib/institutionFormat';
import { GiftCardOption } from '../donation/GiftCardOption';
import { DetailPopup } from './DetailPopup';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface InstitutionPopupContentProps {
  id: string;
  isTop: boolean;
  zIndex: number;
  onClose: () => void;
}

function addressLine(institution: Institution): string {
  const { line1, line2, city, state, postalCode } = institution.address;
  return [line1, line2, `${city}, ${state} ${postalCode}`.trim()].filter(Boolean).join(', ');
}

export function InstitutionPopupContent({ id: institutionId, isTop, zIndex, onClose }: InstitutionPopupContentProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const pushka = usePushka();
  const { open } = useDetailStack();
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[] | undefined>(undefined);

  useEffect(() => {
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
      <DetailPopup title={t('institution.notFound')} onClose={onClose} isTop={isTop} zIndex={zIndex}>
        <p className="text-text-muted">{t('institution.notFound')}</p>
      </DetailPopup>
    );
  }

  if (!institution || campaigns === undefined) {
    return (
      <DetailPopup title="…" onClose={onClose} isTop={isTop} zIndex={zIndex}>
        <LoadingSpinner />
      </DetailPopup>
    );
  }

  const isOwn = profile?.uid === institution.createdByUid;

  return (
    <DetailPopup title={institution.name} onClose={onClose} isTop={isTop} zIndex={zIndex}>
      <Card className="mb-4">
        <p className="text-sm text-text-muted">{institutionTypeText(institution.type, institution.customType, t(`institution.${institution.type}`))}</p>
        <p className="mt-1 text-sm text-text">{addressLine(institution)}</p>
        {isOwn && (
          <div className="mt-3 flex flex-col gap-2">
            <Button variant="secondary" onClick={() => navigate(`/institutions/${institution.institutionId}/spend`)}>
              {t('institution.giftCardBalance', { amount: (institution.giftCardBalance ?? 0).toFixed(2) })}
            </Button>
            <Button variant="secondary" onClick={() => navigate(`/institutions/${institution.institutionId}/edit`)}>
              {t('institution.edit')}
            </Button>
          </div>
        )}
      </Card>

      {campaigns.length > 0 && (
        <div className="mb-4 space-y-2">
          {campaigns.map((campaign) => (
            <Card
              key={campaign.campaignId}
              className="cursor-pointer transition-transform duration-200 hover:-translate-y-0.5"
              onClick={() => open('campaign', campaign.campaignId)}
            >
              <p className="text-sm font-semibold">{campaign.title || t('campaign.untitled')}</p>
            </Card>
          ))}
        </div>
      )}

      <GiftCardOption
        onAdd={(amount) => pushka.addGiftCard({ institutionId: institution.institutionId, institutionName: institution.name, amount })}
      />
    </DetailPopup>
  );
}
