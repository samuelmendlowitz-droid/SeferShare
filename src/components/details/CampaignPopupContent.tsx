import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { usePushka } from '../../context/PushkaContext';
import { useDetailStack } from '../../context/DetailStackContext';
import { getCampaign } from '../../services/campaigns';
import { getInstitution } from '../../services/institutions';
import { getNeshama } from '../../services/neshamos';
import { listSefarim } from '../../services/sefarim';
import type { Campaign, Institution, Neshama, Sefer } from '../../types';
import { campaignDollarTotal } from '../../lib/campaignMath';
import { neshamaDedicationLine } from '../../lib/neshamaFormat';
import { useLanguage } from '../../context/LanguageContext';
import { ProgressBar } from '../campaign/ProgressBar';
import { GiftCardOption } from '../donation/GiftCardOption';
import { DetailPopup } from './DetailPopup';
import { CampaignEditForm } from '../shared/CampaignEditForm';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Modal } from '../ui/Modal';
import { SeferThumbnail } from '../ui/SeferThumbnail';
import { MinusIcon, PlusIcon } from '../ui/icons';

interface CampaignPopupContentProps {
  id: string;
  isTop: boolean;
  zIndex: number;
  onClose: () => void;
}

export function CampaignPopupContent({ id: campaignId, isTop, zIndex, onClose }: CampaignPopupContentProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { showBilingual } = useLanguage();
  const pushka = usePushka();
  const { open } = useDetailStack();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [neshamas, setNeshamas] = useState<Neshama[]>([]);
  const [sefarimById, setSefarimById] = useState<Map<string, Sefer>>(new Map());
  const [stepQuantities, setStepQuantities] = useState<Record<string, number>>({});
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const c = await getCampaign(campaignId);
      if (cancelled) return;
      if (!c) {
        setNotFound(true);
        return;
      }
      setCampaign(c);
      setInstitution(await getInstitution(c.institutionId));
      if (c.neshamaIds?.length) {
        const fetched = await Promise.all(c.neshamaIds.map((nid) => getNeshama(nid)));
        if (!cancelled) setNeshamas(fetched.filter((n): n is Neshama => Boolean(n)));
      }
      const sefarim = await listSefarim();
      if (!cancelled) setSefarimById(new Map(sefarim.map((s) => [s.seferId, s])));
    })();
    return () => {
      cancelled = true;
    };
  }, [campaignId]);

  /** Re-fetches the campaign (and its institution/neshamas, in case the edit
   *  changed either) after the edit popup saves changes. */
  async function refetchCampaign() {
    const c = await getCampaign(campaignId);
    if (!c) return;
    setCampaign(c);
    setInstitution(await getInstitution(c.institutionId));
    if (c.neshamaIds?.length) {
      const fetched = await Promise.all(c.neshamaIds.map((nid) => getNeshama(nid)));
      setNeshamas(fetched.filter((n): n is Neshama => Boolean(n)));
    } else {
      setNeshamas([]);
    }
  }

  if (notFound) {
    return (
      <DetailPopup title={t('campaign.notFound')} onClose={onClose} isTop={isTop} zIndex={zIndex}>
        <p className="text-text-muted">{t('campaign.notFound')}</p>
      </DetailPopup>
    );
  }

  if (!campaign) {
    return (
      <DetailPopup title="…" onClose={onClose} isTop={isTop} zIndex={zIndex}>
        <LoadingSpinner />
      </DetailPopup>
    );
  }

  function inPushkaFor(seferId: string, vendorId: string): number {
    if (!campaign) return 0;
    const key = pushka.keyFor({ seferId, vendorId, campaignId: campaign.campaignId });
    return pushka.items.find((p) => pushka.keyFor(p) === key)?.quantity ?? 0;
  }

  function stepQuantityFor(itemKey: string, remaining: number): number {
    return Math.min(stepQuantities[itemKey] ?? (remaining > 0 ? 1 : 0), remaining);
  }

  function adjustStep(itemKey: string, delta: number, remaining: number) {
    setStepQuantities((prev) => {
      const next = (prev[itemKey] ?? (remaining > 0 ? 1 : 0)) + delta;
      return { ...prev, [itemKey]: Math.max(0, Math.min(remaining, next)) };
    });
  }

  function handleAddToPushka(itemKey: string, seferId: string, vendorId: string, retailPrice: number, remaining: number) {
    if (!campaign) return;
    const qty = stepQuantityFor(itemKey, remaining);
    if (qty <= 0) return;
    const sefer = sefarimById.get(seferId);
    const listing = sefer?.vendorListings.find((l) => l.vendorId === vendorId);
    pushka.addItem(
      {
        seferId,
        vendorId,
        vendorName: listing?.vendorName ?? '',
        englishName: sefer?.englishName ?? seferId,
        hebrewName: sefer?.hebrewName ?? '',
        price: retailPrice,
        imageUrl: listing?.imageUrls?.[0],
        campaignId: campaign.campaignId,
        campaignTitle: campaign.title ?? undefined,
        institutionId: campaign.institutionId,
      },
      qty,
    );
    setStepQuantities((prev) => ({ ...prev, [itemKey]: Math.min(1, remaining - qty) }));
  }

  return (
    <DetailPopup
      title={
        <>
          <span className="font-normal text-text-muted">{t('campaign.singular')} - </span>
          {campaign.title || t('campaign.untitled')}
        </>
      }
      onClose={onClose}
      isTop={isTop}
      zIndex={zIndex}
      footer={
        pushka.totalCount > 0 ? (
          <Button className="w-full" onClick={() => navigate('/pushka')}>
            {t('pushka.completeDonation', { count: pushka.totalCount, amount: pushka.totalPrice.toFixed(2) })}
          </Button>
        ) : undefined
      }
    >
      <div>
        <div className="mb-4 border-b border-border pb-4">
          <h1 className="text-2xl font-bold">{campaign.title || t('campaign.untitled')}</h1>
          {institution && (
            <p className="mt-1 text-sm">
              <button type="button" className="text-accent hover:underline" onClick={() => open('institution', institution.institutionId)}>
                {institution.name}
              </button>
              {neshamas.length > 0 && ' • '}
              {neshamas.length > 0 && (
                <span className="text-text-muted">
                  {t('neshama.liluyNishmat')}{' '}
                  {neshamas.map((n, idx) => (
                    <span key={n.neshamaId}>
                      {idx > 0 && ', '}
                      <button type="button" className="text-accent hover:underline" onClick={() => open('neshama', n.neshamaId)}>
                        {neshamaDedicationLine(n, showBilingual)}
                      </button>
                    </span>
                  ))}
                </span>
              )}
            </p>
          )}
          {campaign.description && <p className="mt-3 text-sm text-text">{campaign.description}</p>}

          <div className="mt-4">
            <p className="text-base font-semibold text-accent">
              {t('home.itemsNeeded', { fulfilled: campaign.totalItemsFulfilled, needed: campaign.totalItemsNeeded })}
            </p>
            <p className="text-sm text-text-muted">
              {t('home.dollarTotal', { amount: campaignDollarTotal(campaign).toFixed(2) })}
            </p>
          </div>
          <div className="mt-2">
            <ProgressBar fulfilled={campaign.totalItemsFulfilled} needed={campaign.totalItemsNeeded} />
          </div>
        </div>

        <h2 className="mb-2 text-base font-semibold">{t('campaign.selectSeforim')}</h2>
        <GiftCardOption
          onAdd={(amount) =>
            pushka.addGiftCard({
              institutionId: campaign.institutionId,
              institutionName: institution?.name,
              campaignId: campaign.campaignId,
              campaignTitle: campaign.title ?? undefined,
              amount,
            })
          }
        />
        <div className="space-y-2">
          {campaign.items.map((item) => {
            const itemKey = `${item.seferId}_${item.vendorId}`;
            const sefer = sefarimById.get(item.seferId);
            const listing = sefer?.vendorListings.find((l) => l.vendorId === item.vendorId);
            const inPushka = inPushkaFor(item.seferId, item.vendorId);
            const remaining = item.quantity - item.quantityFulfilled - inPushka;
            const stepQty = stepQuantityFor(itemKey, remaining);

            return (
              <Card key={itemKey}>
                <div className="flex items-center gap-3">
                  <SeferThumbnail imageUrl={listing?.imageUrls?.[0]} alt={sefer?.englishName ?? item.seferId} />
                  <div className="min-w-0 flex-1">
                    <button
                      type="button"
                      className="truncate text-start text-sm font-semibold text-accent hover:underline"
                      onClick={() => open('sefer', item.seferId)}
                    >
                      {sefer?.englishName ?? item.seferId} {sefer?.hebrewName ? `· ${sefer.hebrewName}` : ''}
                    </button>
                    <p className="text-xs text-text-muted">
                      {item.quantityFulfilled}/{item.quantity} — ${item.retailPrice.toFixed(2)}
                    </p>
                    {inPushka > 0 && (
                      <p className="text-xs font-medium text-accent">{t('pushka.inPushka', { count: inPushka })}</p>
                    )}
                  </div>
                  {remaining <= 0 && inPushka === 0 && (
                    <span className="shrink-0 text-xs font-medium text-success">{t('home.fulfilled')}</span>
                  )}
                </div>

                {remaining > 0 && (
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex items-center gap-1 rounded-btn border border-border">
                      <button
                        type="button"
                        onClick={() => adjustStep(itemKey, -1, remaining)}
                        aria-label={t('pushka.decreaseQuantity') ?? ''}
                        className="flex h-8 w-8 items-center justify-center text-text-muted disabled:opacity-30"
                        disabled={stepQty <= 0}
                      >
                        <MinusIcon width={14} height={14} />
                      </button>
                      <span className="w-8 text-center text-sm">{stepQty}</span>
                      <button
                        type="button"
                        onClick={() => adjustStep(itemKey, 1, remaining)}
                        aria-label={t('pushka.increaseQuantity') ?? ''}
                        className="flex h-8 w-8 items-center justify-center text-text-muted disabled:opacity-30"
                        disabled={stepQty >= remaining}
                      >
                        <PlusIcon width={14} height={14} />
                      </button>
                    </div>
                    <Button
                      variant="secondary"
                      className="flex-1"
                      disabled={stepQty <= 0}
                      onClick={() => handleAddToPushka(itemKey, item.seferId, item.vendorId, item.retailPrice, remaining)}
                    >
                      {t('pushka.addToPushka')}
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        {(profile?.uid === campaign.createdByUid || (institution && profile?.uid === institution.createdByUid)) && (
          <div className="mt-4 space-y-2 border-t border-border pt-4">
            {institution && profile?.uid === institution.createdByUid && (
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => navigate(`/institutions/${institution.institutionId}/spend`)}
              >
                {t('institution.giftCardBalance', { amount: (institution.giftCardBalance ?? 0).toFixed(2) })}
              </Button>
            )}
            {profile?.uid === campaign.createdByUid && (
              <Button variant="secondary" className="w-full" onClick={() => setEditOpen(true)}>
                {t('campaign.edit')}
              </Button>
            )}
          </div>
        )}
      </div>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title={t('campaign.edit')}>
        <CampaignEditForm
          campaign={campaign}
          sefarimById={sefarimById}
          onSaved={() => {
            setEditOpen(false);
            void refetchCampaign();
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
