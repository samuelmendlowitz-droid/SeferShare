import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePushka } from '../context/PushkaContext';
import { getInstitution } from '../services/institutions';
import { listCampaignsByInstitution } from '../services/campaigns';
import type { Campaign, Institution } from '../types';
import { institutionTypeText } from '../lib/institutionFormat';
import { getColorTheme } from '../lib/colorTheme';
import { GiftCardOption } from '../components/donation/GiftCardOption';
import { DetailPageLayout } from '../components/layout/DetailPageLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ImageGalleryWheel } from '../components/ui/ImageGalleryWheel';
import { InstitutionLogo } from '../components/ui/InstitutionLogo';

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
  const canEdit = isOwn || Boolean(profile?.isAdmin);
  const theme = getColorTheme(institution.colorTheme);
  const buttonThemeStyle = { backgroundColor: theme.accent, borderColor: theme.accent, color: '#FFFFFF' };

  return (
    <DetailPageLayout fallbackPath="/campaigns" backgroundColor="#FFFFFF">
      {institution.images && institution.images.length > 0 && (
        <div className="mb-4">
          <ImageGalleryWheel images={institution.images} alt={institution.name} />
        </div>
      )}

      <Card className="mb-4" style={{ backgroundColor: theme.background, borderColor: theme.accent }}>
        <div className="flex items-center gap-2">
          <InstitutionLogo logoUrl={institution.logoUrl} alt={institution.name} size={32} />
          <h1 className="text-2xl font-bold" style={{ color: theme.primary }}>
            {institution.name}
          </h1>
        </div>
        <p className="mt-1 text-sm" style={{ color: theme.accent }}>
          {institutionTypeText(institution.type, institution.customType, t(`institution.${institution.type}`))}
        </p>
        <p className="mt-1 text-sm" style={{ color: theme.accent }}>
          {addressLine(institution)}
        </p>
        <p
          className={`mt-1 text-xs font-medium ${institution.verified ? 'text-success' : ''}`}
          style={institution.verified ? undefined : { color: theme.accent }}
        >
          {institution.verified ? t('institution.verified') : t('institution.unverified')}
        </p>
      </Card>

      {institution.bio && (
        <Card className="mb-4" style={{ backgroundColor: theme.background, borderColor: theme.accent }}>
          <h2 className="mb-2 text-base font-semibold" style={{ color: theme.primary }}>
            {t('institution.bioHeading')}
          </h2>
          <p className="whitespace-pre-line text-sm" style={{ color: theme.accent }}>
            {institution.bio}
          </p>
        </Card>
      )}

      {institution.accomplishments && (
        <Card className="mb-4" style={{ backgroundColor: theme.background, borderColor: theme.accent }}>
          <h2 className="mb-2 text-base font-semibold" style={{ color: theme.primary }}>
            {t('institution.accomplishmentsHeading')}
          </h2>
          <p className="whitespace-pre-line text-sm" style={{ color: theme.accent }}>
            {institution.accomplishments}
          </p>
        </Card>
      )}

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

      {canEdit && (
        <div className="mt-4 space-y-2 border-t border-border pt-4">
          {/* Spending the gift card balance happens from Seforim > Gallery's
              institution switcher now, not from here — this just surfaces it,
              and only to the actual owner (an admin edits/deletes but doesn't
              need this financial detail surfaced inline). */}
          {isOwn && (
            <p className="text-xs" style={{ color: theme.accent }}>
              {t('institution.giftCardBalance', { amount: (institution.giftCardBalance ?? 0).toFixed(2) })}
            </p>
          )}
          <Button
            variant="secondary"
            className="w-full"
            style={buttonThemeStyle}
            onClick={() => navigate(`/institutions/${institution.institutionId}/edit`)}
          >
            {t('institution.edit')}
          </Button>
        </div>
      )}
    </DetailPageLayout>
  );
}
