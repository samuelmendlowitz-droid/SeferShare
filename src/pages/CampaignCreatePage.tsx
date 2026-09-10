import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { createCampaign } from '../services/campaigns';
import type { Address, Institution } from '../types';
import { SeferPicker, type PickedItem } from '../components/donation/SeferPicker';
import { InstitutionPicker } from '../components/shared/InstitutionPicker';
import { NeshamaPicker } from '../components/shared/NeshamaPicker';
import { AddressForm } from '../components/shared/AddressForm';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

const EMPTY_ADDRESS: Address = { line1: '', city: '', state: '', postalCode: '', country: '' };

export function CampaignCreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { language } = useLanguage();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [institutionId, setInstitutionId] = useState<string>();
  const [institution, setInstitution] = useState<Institution>();
  const [neshamaId, setNeshamaId] = useState<string>();
  const [items, setItems] = useState<PickedItem[]>([]);
  const [addressDiffers, setAddressDiffers] = useState(false);
  const [customAddress, setCustomAddress] = useState<Address>(EMPTY_ADDRESS);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function handleInstitutionChange(id: string | undefined, inst?: Institution) {
    setInstitutionId(id);
    setInstitution(inst);
  }

  function handleNeshamaChange(id: string | undefined) {
    setNeshamaId(id);
  }

  const showAddressForm = addressDiffers || !institution;

  async function handlePublish() {
    if (!profile) return;
    setError(null);
    if (!title.trim()) {
      setError(t('campaign.titleRequired'));
      return;
    }
    if (!institutionId && !neshamaId) {
      setError(t('campaign.atLeastOne'));
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
        neshamaId,
        items: items.map((i) => ({
          seferId: i.seferId,
          vendorId: i.vendorId,
          quantity: i.quantity,
          retailPrice: i.price,
        })),
        shippingAddress,
        language,
      });
      navigate(`/campaigns/${campaignId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pb-24 pt-6">
      <Button variant="secondary" className="mb-4" onClick={() => navigate('/profile')}>
        {t('actions.back')}
      </Button>

      <h1 className="mb-4 text-lg font-bold">{t('campaign.create')}</h1>

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
      <SeferPicker picked={items} onChange={setItems} />

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

      <Button className="w-full" disabled={saving} onClick={handlePublish}>
        {t('campaign.publish')}
      </Button>
    </div>
  );
}
