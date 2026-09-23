import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useDetailStack } from '../../context/DetailStackContext';
import { getNeshama } from '../../services/neshamos';
import { listCampaignsByNeshama } from '../../services/campaigns';
import { getSefer } from '../../services/sefarim';
import { formatNeshamaDedication, prefixedName } from '../../lib/neshamaFormat';
import type { Campaign, Neshama, Sefer } from '../../types';
import { DetailPopup } from './DetailPopup';
import { NeshamaEditForm } from '../shared/NeshamaEditForm';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Modal } from '../ui/Modal';

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
  const [editOpen, setEditOpen] = useState(false);

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

  async function refetchNeshama() {
    const nesh = await getNeshama(neshamaId);
    if (nesh) setNeshama(nesh);
  }

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

  const hasDedicatedInfo = dedicatedSefarim.length > 0 || (neshama.seferTypes ?? []).length > 0;

  return (
    <DetailPopup
      title={
        <>
          <span className="font-normal text-text-muted">{t('neshama.singular')} - </span>
          {prefixedName(neshama, false) ?? neshama.name}
        </>
      }
      onClose={onClose}
      isTop={isTop}
      zIndex={zIndex}
    >
      <div className="mb-4 border-b border-border pb-4">
        <h1 className="text-2xl font-bold">{prefixedName(neshama, false) ?? neshama.name}</h1>
        {neshama.hebrewName && (
          <p dir="rtl" className="mt-1 text-base text-text">
            {formatNeshamaDedication(neshama, true)}
          </p>
        )}
        {hasDedicatedInfo && (
          <p className="mt-2 text-xs text-text-muted">
            {dedicatedSefarim.map((sefer, idx) => (
              <span key={sefer.seferId}>
                {idx > 0 && ', '}
                <button type="button" className="text-accent hover:underline" onClick={() => open('sefer', sefer.seferId)}>
                  {sefer.englishName}
                </button>
              </span>
            ))}
            {dedicatedSefarim.length > 0 && (neshama.seferTypes ?? []).length > 0 && ', '}
            {(neshama.seferTypes ?? []).map((type) => t(`sefer.${type}`)).join(', ')}
          </p>
        )}
      </div>

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

      <div className="space-y-2 border-t border-border pt-4">
        <Button className="w-full" onClick={() => navigate(`/neshamos/${neshama.neshamaId}/donate`)}>
          {t('neshama.donateInTheirName')}
        </Button>
        {isOwn && (
          <Button variant="secondary" className="w-full" onClick={() => setEditOpen(true)}>
            {t('neshama.edit')}
          </Button>
        )}
      </div>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title={t('neshama.edit')}>
        <NeshamaEditForm
          neshama={neshama}
          onSaved={() => {
            setEditOpen(false);
            void refetchNeshama();
          }}
          onDeleted={() => {
            setEditOpen(false);
            onClose();
          }}
        />
      </Modal>
    </DetailPopup>
  );
}
