import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getCampaign } from '../services/campaigns';
import { getInstitution } from '../services/institutions';
import { getNeshama } from '../services/neshamos';
import { listSefarim } from '../services/sefarim';
import type { Campaign, Institution, Neshama, Sefer } from '../types';
import type { PickedItem } from '../components/donation/SeferPicker';
import { campaignDollarTotal } from '../lib/campaignMath';
import { ProgressBar } from '../components/campaign/ProgressBar';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { SeferThumbnail } from '../components/ui/SeferThumbnail';

export function CampaignDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { campaignId } = useParams();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [neshama, setNeshama] = useState<Neshama | null>(null);
  const [sefarimById, setSefarimById] = useState<Map<string, Sefer>>(new Map());
  const [quantities, setQuantities] = useState<Record<string, number>>({});

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

  function setQuantity(key: string, value: number, max: number) {
    setQuantities((prev) => ({ ...prev, [key]: Math.max(0, Math.min(max, value)) }));
  }

  const totalPicked = Object.values(quantities).reduce((sum, q) => sum + q, 0);

  function handleContinue() {
    if (!campaign) return;
    const items: PickedItem[] = campaign.items
      .map((item) => {
        const key = `${item.seferId}_${item.vendorId}`;
        const quantity = quantities[key] ?? 0;
        if (quantity <= 0) return null;
        const sefer = sefarimById.get(item.seferId);
        const listing = sefer?.vendorListings.find((l) => l.vendorId === item.vendorId);
        const picked: PickedItem = {
          seferId: item.seferId,
          vendorId: item.vendorId,
          vendorName: listing?.vendorName ?? '',
          englishName: sefer?.englishName ?? item.seferId,
          hebrewName: sefer?.hebrewName ?? '',
          price: item.retailPrice,
          quantity,
          imageUrl: listing?.imageUrls?.[0],
        };
        return picked;
      })
      .filter((i): i is PickedItem => i !== null);

    navigate('/donate', {
      state: {
        items,
        institutionId: campaign.institutionId ?? undefined,
        neshamaId: campaign.neshamaId ?? undefined,
      },
    });
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pb-24 pt-6">
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
          const key = `${item.seferId}_${item.vendorId}`;
          const sefer = sefarimById.get(item.seferId);
          const listing = sefer?.vendorListings.find((l) => l.vendorId === item.vendorId);
          const remaining = item.quantity - item.quantityFulfilled;
          return (
            <Card key={key} className="flex items-center gap-3">
              <SeferThumbnail imageUrl={listing?.imageUrls?.[0]} alt={sefer?.englishName ?? item.seferId} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {sefer?.englishName ?? item.seferId} {sefer?.hebrewName ? `· ${sefer.hebrewName}` : ''}
                </p>
                <p className="text-xs text-text-muted">
                  {item.quantityFulfilled}/{item.quantity} — ${item.retailPrice.toFixed(2)}
                </p>
              </div>
              {remaining > 0 ? (
                <input
                  type="number"
                  min={0}
                  max={remaining}
                  value={quantities[key] ?? 0}
                  onChange={(e) => setQuantity(key, Number(e.target.value), remaining)}
                  className="w-16 shrink-0 rounded-btn border border-border px-2 py-1 text-center text-sm"
                />
              ) : (
                <span className="shrink-0 text-xs font-medium text-success">{t('home.fulfilled')}</span>
              )}
            </Card>
          );
        })}
      </div>

      <Button className="mt-4 w-full" disabled={totalPicked === 0} onClick={handleContinue}>
        {t('actions.next')}
      </Button>
    </div>
  );
}
