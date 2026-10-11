import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getNeshama } from '../services/neshamos';
import { listCampaignsByNeshama } from '../services/campaigns';
import { getSefer } from '../services/sefarim';
import { formatNeshamaDedication, prefixedName } from '../lib/neshamaFormat';
import { getColorTheme } from '../lib/colorTheme';
import type { Campaign, Neshama, Sefer } from '../types';
import { DetailPageLayout } from '../components/layout/DetailPageLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

export function NeshamaDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { neshamaId } = useParams();
  const { profile } = useAuth();
  const [neshama, setNeshama] = useState<Neshama | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[] | undefined>(undefined);
  const [dedicatedSefarim, setDedicatedSefarim] = useState<Sefer[]>([]);

  useEffect(() => {
    if (!neshamaId) return;
    let cancelled = false;
    (async () => {
      const nesh = await getNeshama(neshamaId);
      if (cancelled) return;
      if (!nesh) {
        setNotFound(true);
        return;
      }
      setNeshama(nesh);
      const [found, sefarim] = await Promise.all([
        listCampaignsByNeshama(neshamaId),
        Promise.all((nesh.seferIds ?? []).map((sid) => getSefer(sid))),
      ]);
      if (cancelled) return;
      setCampaigns(found.filter((c) => c.status === 'active'));
      setDedicatedSefarim(sefarim.filter((s): s is Sefer => Boolean(s)));
    })();
    return () => {
      cancelled = true;
    };
  }, [neshamaId]);

  if (notFound) {
    return (
      <DetailPageLayout fallbackPath="/campaigns">
        <p className="text-text-muted">{t('neshama.notFound')}</p>
      </DetailPageLayout>
    );
  }

  if (!neshama || campaigns === undefined) {
    return (
      <DetailPageLayout fallbackPath="/campaigns">
        <LoadingSpinner />
      </DetailPageLayout>
    );
  }

  const isOwn = profile?.uid === neshama.createdByUid;
  const hasFavoriteSeforim = dedicatedSefarim.length > 0 || (neshama.seferTypes ?? []).length > 0;
  const lifespan = [neshama.dateOfBirth, neshama.dateOfDeath]
    .map((d) => (d ? new Date(d).toLocaleDateString() : undefined))
    .filter(Boolean);
  const theme = getColorTheme(neshama.colorTheme);
  const buttonThemeStyle = { backgroundColor: theme.accent, borderColor: theme.accent, color: '#FFFFFF' };

  return (
    <DetailPageLayout fallbackPath="/campaigns" backgroundColor="#FFFFFF">
      <Card className="mb-4" style={{ backgroundColor: theme.background, borderColor: theme.accent }}>
        {neshama.imageUrl && (
          <img
            src={neshama.imageUrl}
            alt={neshama.name}
            className="mb-3 h-24 w-24 rounded-full border border-border object-cover"
          />
        )}
        <h1 className="text-2xl font-bold" style={{ color: theme.primary }}>
          {prefixedName(neshama, false) ?? neshama.name}
        </h1>
        {neshama.hebrewName && (
          <p dir="rtl" className="mt-1 text-base" style={{ color: theme.accent }}>
            {formatNeshamaDedication(neshama, true)}
          </p>
        )}
        {lifespan.length > 0 && (
          <p className="mt-1 text-sm" style={{ color: theme.accent }}>
            {lifespan.join(' – ')}
          </p>
        )}
        {neshama.isRabbi && (
          <span className="mt-2 inline-block rounded-pill bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
            {t('neshama.isRabbiLabel')}
          </span>
        )}
      </Card>

      {neshama.bio && (
        <Card className="mb-4" style={{ backgroundColor: theme.background, borderColor: theme.accent }}>
          <h2 className="mb-2 text-base font-semibold" style={{ color: theme.primary }}>
            {t('neshama.bioHeading')}
          </h2>
          <p className="whitespace-pre-line text-sm" style={{ color: theme.accent }}>
            {neshama.bio}
          </p>
        </Card>
      )}

      {hasFavoriteSeforim && (
        <Card className="mb-4" style={{ backgroundColor: theme.background, borderColor: theme.accent }}>
          <h2 className="mb-2 text-base font-semibold" style={{ color: theme.primary }}>
            {t('neshama.favoriteSeforimHeading')}
          </h2>
          <p className="text-sm" style={{ color: theme.accent }}>
            {dedicatedSefarim.map((sefer, idx) => (
              <span key={sefer.seferId}>
                {idx > 0 && ', '}
                <button type="button" className="hover:underline" onClick={() => navigate(`/seforim/${sefer.seferId}`)}>
                  {sefer.englishName}
                </button>
              </span>
            ))}
            {dedicatedSefarim.length > 0 && (neshama.seferTypes ?? []).length > 0 && ', '}
            {(neshama.seferTypes ?? []).map((type) => t(`sefer.${type}`)).join(', ')}
          </p>
        </Card>
      )}

      {neshama.isRabbi && (neshama.seferimWritten ?? []).length > 0 && (
        <Card className="mb-4" style={{ backgroundColor: theme.background, borderColor: theme.accent }}>
          <h2 className="mb-2 text-base font-semibold" style={{ color: theme.primary }}>
            {t('neshama.seferimWrittenHeading')}
          </h2>
          <ul className="list-inside list-disc text-sm" style={{ color: theme.accent }}>
            {(neshama.seferimWritten ?? []).map((title) => (
              <li key={title}>{title}</li>
            ))}
          </ul>
        </Card>
      )}

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
            </Card>
          ))}
        </div>
      )}

      <div className="space-y-2 border-t border-border pt-4">
        <Button className="w-full" style={buttonThemeStyle} onClick={() => navigate(`/neshamos/${neshama.neshamaId}/donate`)}>
          {t('neshama.donateInTheirName')}
        </Button>
        {isOwn && (
          <Button
            variant="secondary"
            className="w-full"
            style={buttonThemeStyle}
            onClick={() => navigate(`/neshamos/${neshama.neshamaId}/edit`)}
          >
            {t('neshama.edit')}
          </Button>
        )}
      </div>
    </DetailPageLayout>
  );
}
