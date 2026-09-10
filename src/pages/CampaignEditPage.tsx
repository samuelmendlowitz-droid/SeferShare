import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getCampaign, updateCampaign } from '../services/campaigns';
import { getInstitution } from '../services/institutions';
import { listSefarim } from '../services/sefarim';
import type { Address, Campaign, CampaignItem, Institution, Sefer } from '../types';
import { SeferPicker, type PickedItem } from '../components/donation/SeferPicker';
import { InstitutionPicker } from '../components/shared/InstitutionPicker';
import { NeshamaPicker } from '../components/shared/NeshamaPicker';
import { AddressForm } from '../components/shared/AddressForm';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { SeferThumbnail } from '../components/ui/SeferThumbnail';

function addressesEqual(a: Address, b: Address): boolean {
  return (
    a.line1 === b.line1 &&
    (a.line2 ?? '') === (b.line2 ?? '') &&
    a.city === b.city &&
    a.state === b.state &&
    a.postalCode === b.postalCode &&
    a.country === b.country
  );
}

export function CampaignEditPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { campaignId } = useParams();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [sefarimById, setSefarimById] = useState<Map<string, Sefer>>(new Map());

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [institutionId, setInstitutionId] = useState<string>();
  const [institution, setInstitution] = useState<Institution>();
  const [neshamaId, setNeshamaId] = useState<string>();
  const [existingItems, setExistingItems] = useState<CampaignItem[]>([]);
  const [newItems, setNewItems] = useState<PickedItem[]>([]);
  const [addressDiffers, setAddressDiffers] = useState(false);
  const [customAddress, setCustomAddress] = useState<Address>({
    line1: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!campaignId) return;
    (async () => {
      const [c, sefarim] = await Promise.all([getCampaign(campaignId), listSefarim()]);
      setSefarimById(new Map(sefarim.map((s) => [s.seferId, s])));
      if (!c) {
        setNotFound(true);
        return;
      }
      setCampaign(c);
      setTitle(c.title ?? '');
      setDescription(c.description ?? '');
      setInstitutionId(c.institutionId ?? undefined);
      setNeshamaId(c.neshamaId ?? undefined);
      setExistingItems(c.items);
      setCustomAddress(c.shippingAddress);

      if (c.institutionId) {
        const inst = await getInstitution(c.institutionId);
        if (inst) {
          setInstitution(inst);
          setAddressDiffers(!addressesEqual(c.shippingAddress, inst.address));
        }
      }
    })();
  }, [campaignId]);

  if (notFound) {
    return (
      <div className="mx-auto max-w-2xl px-4 pt-6">
        <Button variant="secondary" className="mb-4" onClick={() => navigate('/profile')}>
          {t('actions.back')}
        </Button>
        <p className="text-text-muted">{t('campaign.notFound')}</p>
      </div>
    );
  }

  if (!campaign) return <LoadingSpinner fullScreen />;

  if (profile?.uid !== campaign.createdByUid) {
    return (
      <div className="mx-auto max-w-2xl px-4 pt-6">
        <p className="text-text-muted">Not authorized.</p>
      </div>
    );
  }

  function handleInstitutionChange(id: string | undefined, inst?: Institution) {
    setInstitutionId(id);
    setInstitution(inst);
  }

  function handleNeshamaChange(id: string | undefined) {
    setNeshamaId(id);
  }

  function updateExistingQuantity(index: number, quantity: number) {
    setExistingItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, quantity: Math.max(item.quantityFulfilled, quantity) } : item)),
    );
  }

  function removeExistingItem(index: number) {
    setExistingItems((prev) => prev.filter((_, i) => i !== index));
  }

  const showAddressForm = addressDiffers || !institution;

  async function handleSave() {
    if (!campaign) return;
    setError(null);
    if (!title.trim()) {
      setError(t('campaign.titleRequired'));
      return;
    }
    if (!institutionId && !neshamaId) {
      setError(t('campaign.atLeastOne'));
      return;
    }
    if (existingItems.length === 0 && newItems.length === 0) {
      setError(t('campaign.atLeastOneItem'));
      return;
    }
    setSaving(true);
    try {
      // Merge newly-added seforim into existingItems, summing quantity if the same
      // sefer+vendor combo is already present rather than creating a duplicate line.
      const merged = [...existingItems];
      for (const picked of newItems) {
        const idx = merged.findIndex((i) => i.seferId === picked.seferId && i.vendorId === picked.vendorId);
        if (idx >= 0) {
          merged[idx] = { ...merged[idx], quantity: merged[idx].quantity + picked.quantity };
        } else {
          merged.push({
            seferId: picked.seferId,
            vendorId: picked.vendorId,
            quantity: picked.quantity,
            quantityFulfilled: 0,
            retailPrice: picked.price,
          });
        }
      }

      const shippingAddress = institution && !addressDiffers ? institution.address : customAddress;

      await updateCampaign(campaign.campaignId, {
        title: title.trim(),
        description: description || undefined,
        institutionId,
        neshamaId,
        items: merged,
        shippingAddress,
        language: campaign.language,
      });
      navigate(`/campaigns/${campaign.campaignId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pb-24 pt-6">
      <Button variant="secondary" className="mb-4" onClick={() => navigate(`/campaigns/${campaign.campaignId}`)}>
        {t('actions.back')}
      </Button>

      <h1 className="mb-4 text-lg font-bold">{t('campaign.edit')}</h1>

      <input
        required
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={t('campaign.titlePlaceholder') ?? ''}
        className="mb-3 w-full rounded-btn border border-border px-3 py-2 text-sm"
      />

      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder={t('campaign.descriptionOptional') ?? ''}
        rows={4}
        className="mb-4 w-full rounded-btn border border-border px-3 py-2 text-sm"
      />

      <p className="mb-2 text-sm text-text-muted">{t('campaign.selectWhere')}</p>
      <div className="mb-4">
        <InstitutionPicker value={institutionId} onChange={handleInstitutionChange} />
      </div>

      <p className="mb-2 text-sm text-text-muted">{t('campaign.selectWho')}</p>
      <div className="mb-4">
        <NeshamaPicker value={neshamaId} onChange={handleNeshamaChange} />
      </div>

      <h2 className="mb-2 text-base font-semibold">{t('campaign.selectSeforim')}</h2>
      <div className="mb-4 space-y-2">
        {existingItems.map((item, index) => {
          const sefer = sefarimById.get(item.seferId);
          const listing = sefer?.vendorListings.find((l) => l.vendorId === item.vendorId);
          const canRemove = item.quantityFulfilled === 0;
          return (
            <Card key={`${item.seferId}-${item.vendorId}`} className="flex items-center gap-3">
              <SeferThumbnail imageUrl={listing?.imageUrls?.[0]} alt={sefer?.englishName ?? item.seferId} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {sefer?.englishName ?? item.seferId} {sefer?.hebrewName ? `· ${sefer.hebrewName}` : ''}
                </p>
                <p className="text-xs text-text-muted">
                  {item.quantityFulfilled > 0
                    ? t('campaign.alreadyFulfilled', { count: item.quantityFulfilled })
                    : `$${item.retailPrice.toFixed(2)}`}
                </p>
              </div>
              <input
                type="number"
                min={item.quantityFulfilled}
                value={item.quantity}
                onChange={(e) => updateExistingQuantity(index, Number(e.target.value))}
                className="w-16 shrink-0 rounded-btn border border-border px-2 py-1 text-center text-sm"
              />
              <button
                type="button"
                disabled={!canRemove}
                onClick={() => removeExistingItem(index)}
                aria-label={t('actions.delete') ?? ''}
                className="shrink-0 text-xs font-medium text-error disabled:opacity-30"
              >
                {t('actions.delete')}
              </button>
            </Card>
          );
        })}
      </div>

      <p className="mb-2 text-sm text-text-muted">{t('campaign.addMoreSeforim')}</p>
      <SeferPicker picked={newItems} onChange={setNewItems} />

      {institution && (
        <label className="my-4 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={addressDiffers}
            onChange={(e) => setAddressDiffers(e.target.checked)}
          />
          {t('campaign.shippingAddressDiffers')}
        </label>
      )}

      {showAddressForm && (
        <Card className="my-4">
          <AddressForm value={customAddress} onChange={setCustomAddress} />
        </Card>
      )}

      {error && <p className="mb-3 text-sm text-error">{error}</p>}

      <Button className="w-full" disabled={saving} onClick={handleSave}>
        {t('campaign.saveChanges')}
      </Button>
    </div>
  );
}
