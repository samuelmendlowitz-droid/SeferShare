import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { createCampaign } from '../../services/campaigns';
import type { Address, Institution } from '../../types';
import { SeferPicker, type PickedItem } from '../donation/SeferPicker';
import { InstitutionPicker } from './InstitutionPicker';
import { NeshamaPicker } from './NeshamaPicker';
import { AddressForm } from './AddressForm';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { TextField, TextAreaField } from '../ui/TextField';

const EMPTY_ADDRESS: Address = { line1: '', city: '', state: '', postalCode: '', country: '' };

interface CampaignCreateFormProps {
  onCreated: (campaignId: string) => void;
}

/** Shared "add a campaign" fields — used wherever the app's + Campaign button
 *  appears, inside the same popup shell as the add-mokom/add-neshama forms. */
export function CampaignCreateForm({ onCreated }: CampaignCreateFormProps) {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { language } = useLanguage();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [institutionId, setInstitutionId] = useState<string>();
  const [institution, setInstitution] = useState<Institution>();
  const [neshamaIds, setNeshamaIds] = useState<string[]>([]);
  const [items, setItems] = useState<PickedItem[]>([]);
  const [addressDiffers, setAddressDiffers] = useState(false);
  const [customAddress, setCustomAddress] = useState<Address>(EMPTY_ADDRESS);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function handleInstitutionChange(id: string | undefined, inst?: Institution) {
    setInstitutionId(id);
    setInstitution(inst);
  }

  const showAddressForm = addressDiffers || !institution;

  async function handlePublish() {
    if (!profile) return;
    setError(null);
    if (!title.trim()) {
      setError(t('campaign.titleRequired'));
      return;
    }
    if (!institutionId) {
      setError(t('campaign.institutionRequired'));
      return;
    }
    if (items.length === 0) {
      setError(t('campaign.atLeastOneItem'));
      return;
    }
    setSaving(true);
    try {
      const shippingAddress = institution && !addressDiffers ? institution.address : customAddress;
      const campaignId = await createCampaign({
        createdByUid: profile.uid,
        title: title.trim(),
        description: description || undefined,
        institutionId,
        neshamaIds,
        items: items.map((i) => ({
          seferId: i.seferId,
          vendorId: i.vendorId,
          quantity: i.quantity,
          retailPrice: i.price,
        })),
        shippingAddress,
        language,
      });
      onCreated(campaignId);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
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
      <SeferPicker picked={items} onChange={setItems} />

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

      <Button className="w-full" disabled={saving} onClick={handlePublish}>
        {t('campaign.publish')}
      </Button>
    </div>
  );
}
