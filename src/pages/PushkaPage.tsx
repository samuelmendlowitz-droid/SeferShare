import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePushka, type PushkaItem } from '../context/PushkaContext';
import { getNeshama } from '../services/neshamos';
import type { DonationAd, DonationDedication, Neshama } from '../types';
import type { PickedItem } from '../components/donation/SeferPicker';
import { CheckoutStep } from '../components/donation/CheckoutStep';
import { VirtualDedicationCard, type StickerInfo } from '../components/donation/VirtualDedicationCard';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { SeferThumbnail } from '../components/ui/SeferThumbnail';
import { MinusIcon, PlusIcon, CloseIcon } from '../components/ui/icons';

function toPickedItem(item: PushkaItem): PickedItem {
  return {
    seferId: item.seferId,
    vendorId: item.vendorId,
    vendorName: item.vendorName,
    englishName: item.englishName,
    hebrewName: item.hebrewName,
    price: item.price,
    quantity: item.quantity,
    imageUrl: item.imageUrl,
    campaignId: item.campaignId,
  };
}

const emptyDedication: DonationDedication = { name: '', hebrewName: '', relationship: '', message: '' };

function DedicationFields({ value, onChange }: { value: DonationDedication; onChange: (next: DonationDedication) => void }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-2">
      <input
        value={value.name}
        onChange={(e) => onChange({ ...value, name: e.target.value })}
        placeholder={t('neshama.name') ?? ''}
        className="w-full rounded-btn border border-border px-3 py-2 text-sm"
      />
      <input
        value={value.hebrewName ?? ''}
        onChange={(e) => onChange({ ...value, hebrewName: e.target.value })}
        placeholder={t('neshama.hebrewName') ?? ''}
        className="w-full rounded-btn border border-border px-3 py-2 text-sm"
      />
      <input
        value={value.relationship ?? ''}
        onChange={(e) => onChange({ ...value, relationship: e.target.value })}
        placeholder={t('neshama.relationship') ?? ''}
        className="w-full rounded-btn border border-border px-3 py-2 text-sm"
      />
      <textarea
        value={value.message ?? ''}
        onChange={(e) => onChange({ ...value, message: e.target.value })}
        placeholder={t('neshama.message') ?? ''}
        rows={2}
        className="w-full rounded-btn border border-border px-3 py-2 text-sm"
      />
    </div>
  );
}

export function PushkaPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const pushka = usePushka();

  const [step, setStep] = useState<'form' | 'confirmation'>('form');
  const [donorMessage, setDonorMessage] = useState('');
  const [donorDedication, setDonorDedication] = useState<DonationDedication>(emptyDedication);
  const [extraDedications, setExtraDedications] = useState<DonationDedication[]>([]);
  const [includeAd, setIncludeAd] = useState(false);
  const [ad, setAd] = useState<DonationAd>({ businessName: '', message: '' });
  const [neshamosById, setNeshamosById] = useState<Map<string, Neshama>>(new Map());
  const [paidItems, setPaidItems] = useState<PushkaItem[]>([]);
  const [paidStickers, setPaidStickers] = useState<StickerInfo[]>([]);

  const groups = useMemo(() => {
    const byCampaign = new Map<string, PushkaItem[]>();
    const untagged: PushkaItem[] = [];
    for (const item of pushka.items) {
      if (item.campaignId) {
        const list = byCampaign.get(item.campaignId) ?? [];
        list.push(item);
        byCampaign.set(item.campaignId, list);
      } else {
        untagged.push(item);
      }
    }
    return { byCampaign, untagged };
  }, [pushka.items]);

  useEffect(() => {
    const ids = [...new Set(pushka.items.map((i) => i.neshamaId).filter((id): id is string => Boolean(id)))];
    if (ids.length === 0) {
      setNeshamosById(new Map());
      return;
    }
    Promise.all(ids.map((id) => getNeshama(id))).then((results) => {
      const map = new Map<string, Neshama>();
      results.forEach((n, idx) => {
        if (n) map.set(ids[idx], n);
      });
      setNeshamosById(map);
    });
  }, [pushka.items]);

  // Campaigns already dedicated to a neshama always print that neshama on the sticker.
  const campaignStickerGroups = useMemo(
    () =>
      [...groups.byCampaign.entries()]
        .map(([campaignId, items]) => ({
          campaignId,
          campaignTitle: items[0].campaignTitle,
          neshama: items[0].neshamaId ? neshamosById.get(items[0].neshamaId) : undefined,
        }))
        .filter((g): g is typeof g & { neshama: Neshama } => Boolean(g.neshama)),
    [groups.byCampaign, neshamosById],
  );

  // Everything else (untagged items, or campaigns with no neshama of their own) shares
  // the donor's own dedication on its sticker.
  const hasDonorStickerItems = useMemo(
    () => groups.untagged.length > 0 || [...groups.byCampaign.values()].some((items) => !items[0].neshamaId),
    [groups],
  );

  function addExtraDedication() {
    setExtraDedications((prev) => [...prev, { ...emptyDedication }]);
  }

  function updateExtraDedication(idx: number, next: DonationDedication) {
    setExtraDedications((prev) => prev.map((d, i) => (i === idx ? next : d)));
  }

  function removeExtraDedication(idx: number) {
    setExtraDedications((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handlePaid() {
    setPaidItems(pushka.items);
    const stickers: StickerInfo[] = campaignStickerGroups.map((g) => ({
      label: g.campaignTitle || t('campaign.untitled'),
      name: g.neshama.name,
      hebrewName: g.neshama.hebrewName,
      message: g.neshama.message,
    }));
    if (donorDedication.name.trim()) {
      stickers.push({ label: t('donation.yourDedicationTitle'), ...donorDedication });
    }
    setPaidStickers(stickers);
    pushka.clear();
    setStep('confirmation');
  }

  if (step === 'confirmation') {
    return (
      <div className="mx-auto max-w-2xl px-4 pb-24 pt-6">
        <VirtualDedicationCard
          donorName={profile?.displayName ?? ''}
          items={paidItems.map(toPickedItem)}
          stickers={paidStickers}
          additionalDedications={extraDedications.filter((d) => d.name.trim())}
          ad={includeAd && ad.businessName.trim() ? ad : undefined}
        />
        <Button className="mt-4 w-full" onClick={() => navigate('/')}>
          {t('actions.done')}
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pb-24 pt-6">
      <Button variant="secondary" className="mb-4" onClick={() => navigate('/')}>
        {t('actions.back')}
      </Button>

      <h1 className="mb-4 text-lg font-bold">{t('pushka.title')}</h1>

      {pushka.items.length === 0 ? (
        <div className="text-center">
          <p className="mb-4 text-text-muted">{t('pushka.empty')}</p>
          <Button onClick={() => navigate('/')}>{t('pushka.goHome')}</Button>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {[...groups.byCampaign.entries()].map(([campaignId, items]) => (
              <div key={campaignId}>
                <button
                  type="button"
                  onClick={() => navigate(`/campaigns/${campaignId}`)}
                  className="mb-2 text-sm font-semibold text-accent hover:underline"
                >
                  {items[0].campaignTitle || t('campaign.untitled')}
                </button>
                <div className="space-y-2">
                  {items.map((item) => (
                    <PushkaRow key={pushka.keyFor(item)} item={item} />
                  ))}
                </div>
              </div>
            ))}

            {groups.untagged.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-semibold text-text-muted">{t('pushka.otherSeforim')}</p>
                <div className="space-y-2">
                  {groups.untagged.map((item) => (
                    <PushkaRow key={pushka.keyFor(item)} item={item} />
                  ))}
                </div>
              </div>
            )}
          </div>

          <Card className="mt-4">
            <h2 className="mb-3 text-base font-semibold">{t('donation.dedicationsTitle')}</h2>

            {campaignStickerGroups.length > 0 && (
              <div className="mb-3 space-y-2">
                {campaignStickerGroups.map((g) => (
                  <p key={g.campaignId} className="text-sm text-text-muted">
                    {t('donation.stickerAuto', {
                      campaignTitle: g.campaignTitle || t('campaign.untitled'),
                      liluyNishmat: t('neshama.liluyNishmat'),
                      name: g.neshama.name,
                    })}
                  </p>
                ))}
              </div>
            )}

            {hasDonorStickerItems && (
              <div className="mb-4 rounded-btn border border-border p-3">
                <p className="mb-1 text-sm font-medium">{t('donation.yourDedicationTitle')}</p>
                <p className="mb-2 text-xs text-text-muted">{t('donation.yourDedicationHint')}</p>
                <DedicationFields value={donorDedication} onChange={setDonorDedication} />
              </div>
            )}

            {extraDedications.map((dedication, idx) => (
              <div key={idx} className="mb-3 rounded-btn border border-border p-3">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{t('donation.additionalDedicationTitle')}</p>
                    <p className="text-xs text-text-muted">{t('donation.additionalDedicationHint')}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeExtraDedication(idx)}
                    aria-label={t('donation.removeDedication') ?? ''}
                    className="shrink-0 text-text-muted"
                  >
                    <CloseIcon width={16} height={16} />
                  </button>
                </div>
                <DedicationFields value={dedication} onChange={(next) => updateExtraDedication(idx, next)} />
              </div>
            ))}

            <Button variant="secondary" className="w-full" onClick={addExtraDedication}>
              {t('donation.addDedication')}
            </Button>
          </Card>

          <Card className="mt-4">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={includeAd} onChange={(e) => setIncludeAd(e.target.checked)} />
              {t('donation.includeAd')}
            </label>
            {includeAd && (
              <div className="mt-3 space-y-2">
                <input
                  value={ad.businessName}
                  onChange={(e) => setAd({ ...ad, businessName: e.target.value })}
                  placeholder={t('donation.adBusinessName') ?? ''}
                  className="w-full rounded-btn border border-border px-3 py-2 text-sm"
                />
                <input
                  value={ad.message ?? ''}
                  onChange={(e) => setAd({ ...ad, message: e.target.value })}
                  placeholder={t('donation.adMessagePlaceholder') ?? ''}
                  className="w-full rounded-btn border border-border px-3 py-2 text-sm"
                />
              </div>
            )}
          </Card>

          <textarea
            value={donorMessage}
            onChange={(e) => setDonorMessage(e.target.value)}
            placeholder={t('donation.message') ?? ''}
            className="mb-4 mt-4 w-full rounded-btn border border-border px-3 py-2 text-sm"
            rows={3}
          />

          <CheckoutStep
            items={pushka.items.map(toPickedItem)}
            donorMessage={donorMessage}
            donorDedication={donorDedication.name.trim() ? donorDedication : undefined}
            additionalDedications={extraDedications.filter((d) => d.name.trim())}
            ad={includeAd && ad.businessName.trim() ? ad : undefined}
            onPaid={handlePaid}
          />
        </>
      )}
    </div>
  );
}

function PushkaRow({ item }: { item: PushkaItem }) {
  const { t } = useTranslation();
  const pushka = usePushka();
  const key = pushka.keyFor(item);

  return (
    <Card className="flex items-center gap-3">
      <SeferThumbnail imageUrl={item.imageUrl} alt={item.englishName} size={48} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">
          {item.englishName} · {item.hebrewName}
        </p>
        <p className="text-xs text-text-muted">${item.price.toFixed(2)} each</p>
      </div>
      <div className="flex shrink-0 items-center gap-1 rounded-btn border border-border">
        <button
          type="button"
          onClick={() => pushka.updateQuantity(key, item.quantity - 1)}
          aria-label={t('pushka.decreaseQuantity') ?? ''}
          className="flex h-8 w-8 items-center justify-center text-text-muted"
        >
          <MinusIcon width={14} height={14} />
        </button>
        <span className="w-6 text-center text-sm">{item.quantity}</span>
        <button
          type="button"
          onClick={() => pushka.updateQuantity(key, item.quantity + 1)}
          aria-label={t('pushka.increaseQuantity') ?? ''}
          className="flex h-8 w-8 items-center justify-center text-text-muted"
        >
          <PlusIcon width={14} height={14} />
        </button>
      </div>
      <button
        type="button"
        onClick={() => pushka.removeItem(key)}
        aria-label={t('actions.delete') ?? ''}
        className="shrink-0 text-text-muted"
      >
        <CloseIcon width={16} height={16} />
      </button>
    </Card>
  );
}
