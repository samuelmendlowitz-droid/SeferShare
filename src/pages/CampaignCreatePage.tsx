import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { createCampaign } from '../services/campaigns';
import type { Address } from '../types';
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
  const [institutionId, setInstitutionId] = useState<string>();
  const [neshamaId, setNeshamaId] = useState<string>();
  const [items, setItems] = useState<PickedItem[]>([]);
  const [address, setAddress] = useState<Address>(EMPTY_ADDRESS);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handlePublish() {
    if (!profile) return;
    setError(null);
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
      const campaignId = await createCampaign({
        createdByUid: profile.uid,
        title: title || undefined,
        institutionId,
        neshamaId,
        items: items.map((i) => ({
          seferId: i.seferId,
          vendorId: i.vendorId,
          quantity: i.quantity,
          retailPrice: i.price,
        })),
        shippingAddress: address,
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
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={t('campaign.titleOptional') ?? ''}
        className="mb-4 w-full rounded-btn border border-border px-3 py-2 text-sm"
      />

      <Card className="mb-3">
        <p className="mb-2 text-sm text-text-muted">{t('campaign.selectWhere')}</p>
        <InstitutionPicker value={institutionId} onChange={setInstitutionId} allowCreate />
      </Card>

      <Card className="mb-4">
        <p className="mb-2 text-sm text-text-muted">{t('campaign.selectWho')}</p>
        <NeshamaPicker value={neshamaId} onChange={setNeshamaId} allowCreate />
      </Card>

      <h2 className="mb-2 text-base font-semibold">{t('campaign.selectSeforim')}</h2>
      <SeferPicker picked={items} onChange={setItems} />

      <Card className="my-4">
        <AddressForm value={address} onChange={setAddress} />
      </Card>

      {error && <p className="mb-3 text-sm text-error">{error}</p>}

      <Button className="w-full" disabled={saving} onClick={handlePublish}>
        {t('campaign.publish')}
      </Button>
    </div>
  );
}
