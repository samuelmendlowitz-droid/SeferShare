import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useDetailStack } from '../../context/DetailStackContext';
import { getNeshama } from '../../services/neshamos';
import { listCampaignsByNeshama } from '../../services/campaigns';
import { getSefer } from '../../services/sefarim';
import { prefixedName } from '../../lib/neshamaFormat';
import type { Campaign, Neshama, Sefer } from '../../types';
import { DetailPopup } from './DetailPopup';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface NeshamaPopupContentProps {
  id: string;
  isTop: boolean;
  zIndex: number;
  onClose: () => void;
}

export function NeshamaPopupContent({ id: neshamaId, isTop, zIndex, onClose }: NeshamaPopupContentProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { open } = useDetailStack();
  const [neshama, setNeshama] = useState<Neshama | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[] | undefined>(undefined);
  const [dedicatedSefarim, setDedicatedSefarim] = useState<Sefer[]>([]);

  useEffect(() => {
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
      <DetailPopup title={t('neshama.notFound')} onClose={onClose} isTop={isTop} zIndex={zIndex}>
        <p className="text-text-muted">{t('neshama.notFound')}</p>
      </DetailPopup>
    );
  }

  if (!neshama || campaigns === undefined) {
    return (
      <DetailPopup title="…" onClose={onClose} isTop={isTop} zIndex={zIndex}>
        <LoadingSpinner />
      </DetailPopup>
    );
  }

  const isOwn = profile?.uid === neshama.createdByUid;

  return (
    <DetailPopup
      title={`${t('neshama.singular')} - ${prefixedName(neshama, false) ?? neshama.name}`}
      onClose={onClose}
      isTop={isTop}
      zIndex={zIndex}
    >
      <div className="mb-4 border-b border-border pb-4">
        {neshama.hebrewName && (
          <p dir="rtl" className="text-sm text-text">
            {prefixedName(neshama, true)}
          </p>
        )}
        <p className="mt-1 text-sm text-text-muted">{neshama.fatherHebrewName}</p>
        {isOwn && (
          <div className="mt-3">
            <Button variant="secondary" onClick={() => navigate(`/neshamos/${neshama.neshamaId}/edit`)}>
              {t('neshama.edit')}
            </Button>
          </div>
        )}
      </div>

      {(dedicatedSefarim.length > 0 || (neshama.seferTypes ?? []).length > 0) && (
        <div className="mb-4">
          <h2 className="mb-2 text-base font-semibold">{t('neshama.dedicatedSeforim')}</h2>
          {dedicatedSefarim.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {dedicatedSefarim.map((sefer) => (
                <button
                  key={sefer.seferId}
                  type="button"
                  className="rounded-pill border border-accent px-3 py-1 text-xs font-medium text-accent hover:bg-accent/5"
                  onClick={() => open('sefer', sefer.seferId)}
                >
                  {sefer.englishName}
                </button>
              ))}
            </div>
          )}
          {(neshama.seferTypes ?? []).length > 0 && (
            <p className="text-xs text-text-muted">{(neshama.seferTypes ?? []).map((type) => t(`sefer.${type}`)).join(', ')}</p>
          )}
        </div>
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
              onClick={() => open('campaign', campaign.campaignId)}
            >
              <p className="text-sm font-semibold">{campaign.title || t('campaign.untitled')}</p>
            </Card>
          ))}
        </div>
      )}

      <Button className="w-full" onClick={() => navigate(`/neshamos/${neshama.neshamaId}/donate`)}>
        {t('neshama.donateInTheirName')}
      </Button>
    </DetailPopup>
  );
}
