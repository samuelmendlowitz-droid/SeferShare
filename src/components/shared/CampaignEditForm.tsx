import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { deleteCampaign, updateCampaign } from '../../services/campaigns';
import { getInstitution } from '../../services/institutions';
import type { Address, Campaign, CampaignItem, Institution, Sefer } from '../../types';
import { SeferPicker, type PickedItem } from '../donation/SeferPicker';
import { InstitutionPicker } from './InstitutionPicker';
import { NeshamaPicker } from './NeshamaPicker';
import { AddressForm } from './AddressForm';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { NumberField } from '../ui/NumberField';
import { SeferThumbnail } from '../ui/SeferThumbnail';
import { TextField, TextAreaField } from '../ui/TextField';

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

interface CampaignEditFormProps {
  campaign: Campaign;
  sefarimById: Map<string, Sefer>;
  onSaved: () => void;
  onDeleted: () => void;
}

/** Shared "edit a campaign" fields — same shape as CampaignCreateForm, plus the
 *  existing-items list and delete action that only apply once a campaign exists. */
export function CampaignEditForm({ campaign, sefarimById, onSaved, onDeleted }: CampaignEditFormProps) {
  const { t } = useTranslation();

  const [title, setTitle] = useState(campaign.title ?? '');
  const [description, setDescription] = useState(campaign.description ?? '');
  const [institutionId, setInstitutionId] = useState<string | undefined>(campaign.institutionId ?? undefined);
  const [institution, setInstitution] = useState<Institution>();
  const [neshamaIds, setNeshamaIds] = useState<string[]>(campaign.neshamaIds ?? []);
  const [existingItems, setExistingItems] = useState<CampaignItem[]>(campaign.items);
  const [newItems, setNewItems] = useState<PickedItem[]>([]);
  const [addressDiffers, setAddressDiffers] = useState(false);
  const [customAddress, setCustomAddress] = useState<Address>(campaign.shippingAddress);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!campaign.institutionId) return;
    getInstitution(campaign.institutionId).then((inst) => {
      if (!inst) return;
      setInstitution(inst);
      setAddressDiffers(!addressesEqual(campaign.shippingAddress, inst.address));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaign.institutionId]);

  function handleInstitutionChange(id: string | undefined, inst?: Institution) {
    setInstitutionId(id);
    setInstitution(inst);
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
    setError(null);
    if (!title.trim()) {
      setError(t('campaign.titleRequired'));
      return;
    }
    if (!institutionId) {
      setError(t('campaign.institutionRequired'));
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
        neshamaIds,
        items: merged,
        shippingAddress,
        language: campaign.language,
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm(t('campaign.confirmDelete') ?? '')) return;
    setDeleting(true);
    try {
      await deleteCampaign(campaign.campaignId);
      onDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setDeleting(false);
    }
  }

  return (
    <div>
      <TextField
        required
        label={t('campaign.titlePlaceholder')}
        value={title}
        onChange={setTitle}
        containerClassName="mb-3"
      />

      <TextAreaField
        label={t('campaign.descriptionOptional')}
        value={description}
        onChange={setDescription}
        rows={4}
        containerClassName="mb-4"
      />

      <h2 className="mb-2 mt-6 border-t border-border pt-4 text-base font-semibold">{t('campaign.selectWhere')}</h2>
      <div className="mb-4">
        <InstitutionPicker value={institutionId} onChange={handleInstitutionChange} />
      </div>

      <h2 className="mb-2 mt-6 border-t border-border pt-4 text-base font-semibold">{t('campaign.selectWho')}</h2>
      <div className="mb-4">
        <NeshamaPicker values={neshamaIds} onChange={setNeshamaIds} />
      </div>

      <h2 className="mb-2 mt-6 border-t border-border pt-4 text-base font-semibold">{t('campaign.selectSeforim')}</h2>
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
              <NumberField
                label={t('campaign.quantityLabel')}
                min={item.quantityFulfilled}
                value={item.quantity}
                onChange={(quantity) => updateExistingQuantity(index, quantity)}
                containerClassName="w-20 shrink-0"
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

      <h2 className="mb-2 mt-6 border-t border-border pt-4 text-base font-semibold">{t('campaign.addMoreSeforim')}</h2>
      <SeferPicker picked={newItems} onChange={setNewItems} />

      {institution && (
        <label className="my-4 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={addressDiffers} onChange={(e) => setAddressDiffers(e.target.checked)} />
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

      <Card className="mt-6 border-error/30">
        <p className="mb-3 text-sm text-text-muted">{t('campaign.deleteHint')}</p>
        <Button variant="destructive" className="w-full" disabled={deleting} onClick={handleDelete}>
          {t('campaign.delete')}
        </Button>
      </Card>
    </div>
  );
}
