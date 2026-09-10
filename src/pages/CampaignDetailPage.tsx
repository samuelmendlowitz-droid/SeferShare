import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePushka } from '../context/PushkaContext';
import { getCampaign } from '../services/campaigns';
import { getInstitution } from '../services/institutions';
import { getNeshama } from '../services/neshamos';
import { listSefarim } from '../services/sefarim';
import type { Campaign, Institution, Neshama, Sefer } from '../types';
import { campaignDollarTotal } from '../lib/campaignMath';
import { ProgressBar } from '../components/campaign/ProgressBar';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { SeferThumbnail } from '../components/ui/SeferThumbnail';
import { MinusIcon, PlusIcon } from '../components/ui/icons';

export function CampaignDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const pushka = usePushka();
  const { campaignId } = useParams();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [neshama, setNeshama] = useState<Neshama | null>(null);
  const [sefarimById, setSefarimById] = useState<Map<string, Sefer>>(new Map());
  const [stepQuantities, setStepQuantities] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!campaignId) return;
    (async () => {
      const c = await getCampaign(campaignId);
      if (!c) {
        setNotFound(true);
        return;
      }
      setCampaign(c);
      if (c.institutionId) setInstitution(await getInstitution(c.institutionId));
      if (c.neshamaId) setNeshama(await getNeshama(c.neshamaId));
      const sefarim = await listSefarim();
      setSefarimById(new Map(sefarim.map((s) => [s.seferId, s])));
    })();
  }, [campaignId]);

  if (notFound) {
    return (
      <div className="mx-auto max-w-2xl px-4 pt-6">
        <Button variant="secondary" className="mb-4" onClick={() => navigate('/')}>
          {t('actions.back')}
        </Button>
        <p className="text-text-muted">{t('campaign.notFound')}</p>
      </div>
    );
  }

  if (!campaign) return <LoadingSpinner fullScreen />;

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
        institutionId: campaign.institutionId ?? undefined,
        neshamaId: campaign.neshamaId ?? undefined,
      },
      qty,
    );
    setStepQuantities((prev) => ({ ...prev, [itemKey]: Math.min(1, remaining - qty) }));
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pb-32 pt-6">
      <div className="mb-4 flex items-center justify-between">
        <Button variant="secondary" onClick={() => navigate('/')}>
          {t('actions.back')}
        </Button>
        {profile?.uid === campaign.createdByUid && (
          <Button variant="secondary" onClick={() => navigate(`/campaigns/${campaign.campaignId}/edit`)}>
            {t('campaign.edit')}
          </Button>
        )}
      </div>

      <Card>
        {campaign.title && <h1 className="mb-1 text-lg font-bold">{campaign.title}</h1>}
        {institution && <p className="text-sm">{institution.name}</p>}
        {neshama && (
          <p className="text-sm text-text-muted">
            {t('neshama.liluyNishmat')} {neshama.name}
          </p>
        )}
        {neshama?.message && <p className="mt-1 text-sm italic text-text-muted">"{neshama.message}"</p>}
        {campaign.description && <p className="mt-3 text-sm text-text">{campaign.description}</p>}

        <div className="mt-4">
          <p className="text-xl font-bold text-accent">
            {t('home.itemsNeeded', { fulfilled: campaign.totalItemsFulfilled, needed: campaign.totalItemsNeeded })}
          </p>
          <p className="text-sm text-text-muted">
            {t('home.dollarTotal', { amount: campaignDollarTotal(campaign).toFixed(2) })}
          </p>
        </div>
        <div className="mt-2">
          <ProgressBar fulfilled={campaign.totalItemsFulfilled} needed={campaign.totalItemsNeeded} />
        </div>
      </Card>

      <h2 className="mb-2 mt-4 text-base font-semibold">{t('campaign.selectSeforim')}</h2>
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
                  <p className="truncate text-sm font-semibold">
                    {sefer?.englishName ?? item.seferId} {sefer?.hebrewName ? `· ${sefer.hebrewName}` : ''}
                  </p>
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

      {pushka.totalCount > 0 && (
        <div
          className="fixed inset-x-0 z-40 mx-auto max-w-2xl px-4"
          style={{ bottom: 'max(1rem, calc(env(safe-area-inset-bottom) + 0.5rem))' }}
        >
          <Button className="w-full shadow-navbar" onClick={() => navigate('/pushka')}>
            {t('pushka.completeDonation', { count: pushka.totalCount, amount: pushka.totalPrice.toFixed(2) })}
          </Button>
        </div>
      )}
    </div>
  );
}
