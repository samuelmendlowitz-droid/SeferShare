import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { createCampaign } from '../../services/campaigns';
import { uploadCampaignHeaderImage } from '../../services/storage';
import { DEFAULT_CAMPAIGN_THEME } from '../../lib/campaignTheme';
import type { Address, CampaignObjective, Institution } from '../../types';
import { SeferPicker, type PickedItem } from '../donation/SeferPicker';
import { InstitutionPicker } from './InstitutionPicker';
import { NeshamaPicker } from './NeshamaPicker';
import { AddressForm } from './AddressForm';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { ImageUploadField } from '../ui/ImageUploadField';
import { TextField, TextAreaField, FIELD_LABEL_CLASS } from '../ui/TextField';

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
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [objective, setObjective] = useState<CampaignObjective>('institution');
  const [institutionId, setInstitutionId] = useState<string>();
  const [institution, setInstitution] = useState<Institution>();
  const [neshamaIds, setNeshamaIds] = useState<string[]>([]);
  const [items, setItems] = useState<PickedItem[]>([]);
  const [addressDiffers, setAddressDiffers] = useState(false);
  const [customAddress, setCustomAddress] = useState<Address>(EMPTY_ADDRESS);
  const [headerPhotoFile, setHeaderPhotoFile] = useState<File>();
  const [bgColor, setBgColor] = useState(DEFAULT_CAMPAIGN_THEME.background);
  const [primaryColor, setPrimaryColor] = useState(DEFAULT_CAMPAIGN_THEME.primary);
  const [accentColor, setAccentColor] = useState(DEFAULT_CAMPAIGN_THEME.accent);
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
    if (objective === 'institution' && !institutionId) {
      setError(t('campaign.institutionRequired'));
      return;
    }
    if (objective === 'neshama' && neshamaIds.length === 0) {
      setError(t('campaign.neshamaRequired'));
      return;
    }
    if (items.length === 0) {
      setError(t('campaign.atLeastOneItem'));
      return;
    }
    if (startDate && endDate && endDate < startDate) {
      setError(t('campaign.endDateBeforeStart'));
      return;
    }
    setSaving(true);
    try {
      const shippingAddress = institution && !addressDiffers ? institution.address : customAddress;
      const headerImageUrl = headerPhotoFile
        ? await uploadCampaignHeaderImage(profile.uid, headerPhotoFile)
        : undefined;
      const campaignId = await createCampaign({
        createdByUid: profile.uid,
        title: title.trim(),
        description: description || undefined,
        headerImageUrl,
        colorTheme: { background: bgColor, primary: primaryColor, accent: accentColor },
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        objective,
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

      <h2 className="mb-2 mt-6 border-t border-border pt-4 text-base font-semibold">{t('campaign.datesLabel')}</h2>
      <div className="mb-4 flex gap-2">
        <TextField
          type="date"
          label={t('campaign.startDateLabel')}
          value={startDate}
          onChange={setStartDate}
          containerClassName="w-full"
        />
        <TextField
          type="date"
          label={t('campaign.endDateLabel')}
          value={endDate}
          onChange={setEndDate}
          containerClassName="w-full"
        />
      </div>

      <h2 className="mb-2 mt-6 border-t border-border pt-4 text-base font-semibold">{t('campaign.objectiveLabel')}</h2>
      <p className="mb-2 text-xs text-text-muted">{t('campaign.objectiveHint')}</p>
      <div className="mb-4 flex gap-2">
        <button
          type="button"
          onClick={() => setObjective('institution')}
          className={`flex-1 rounded-btn border px-3 py-2 text-sm font-medium ${
            objective === 'institution' ? 'border-accent bg-accent text-white' : 'border-border text-text-muted'
          }`}
        >
          {t('campaign.objectiveInstitution')}
        </button>
        <button
          type="button"
          onClick={() => setObjective('neshama')}
          className={`flex-1 rounded-btn border px-3 py-2 text-sm font-medium ${
            objective === 'neshama' ? 'border-accent bg-accent text-white' : 'border-border text-text-muted'
          }`}
        >
          {t('campaign.objectiveNeshama')}
        </button>
      </div>

      <h2 className="mb-2 mt-6 border-t border-border pt-4 text-base font-semibold">
        {t('campaign.selectWhere')}
        {objective === 'neshama' && (
          <span className="ms-1 text-xs font-normal text-text-muted">{t('campaign.optionalSuffix')}</span>
        )}
      </h2>
      <div className="mb-4">
        <InstitutionPicker value={institutionId} onChange={handleInstitutionChange} />
      </div>

      <h2 className="mb-2 mt-6 border-t border-border pt-4 text-base font-semibold">
        {t('campaign.selectWho')}
        {objective === 'institution' && (
          <span className="ms-1 text-xs font-normal text-text-muted">{t('campaign.optionalSuffix')}</span>
        )}
      </h2>
      <div className="mb-4">
        <NeshamaPicker values={neshamaIds} onChange={setNeshamaIds} />
      </div>

      <h2 className="mb-2 mt-6 border-t border-border pt-4 text-base font-semibold">{t('campaign.selectedSeforimLabel')}</h2>
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

      <h2 className="mb-2 mt-6 border-t border-border pt-4 text-base font-semibold">{t('campaign.appearanceLabel')}</h2>
      <div className="mb-4">
        <ImageUploadField
          label={t('campaign.headerPhotoLabel')}
          existingImageUrls={[]}
          onRemoveExisting={() => {}}
          newFiles={headerPhotoFile ? [headerPhotoFile] : []}
          onAddFiles={(files) => setHeaderPhotoFile(files[0])}
          onRemoveNewFile={() => setHeaderPhotoFile(undefined)}
          max={1}
        />
      </div>
      <div className="mb-4">
        <p className={FIELD_LABEL_CLASS}>{t('campaign.colorThemeLabel')}</p>
        <div className="flex gap-6">
          <label className="flex flex-col items-center gap-1">
            <input
              type="color"
              value={bgColor}
              onChange={(e) => setBgColor(e.target.value)}
              className="h-9 w-9 cursor-pointer rounded-full border border-border p-0"
            />
            <span className="text-[11px] text-text-muted">{t('campaign.colorBackgroundLabel')}</span>
          </label>
          <label className="flex flex-col items-center gap-1">
            <input
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="h-9 w-9 cursor-pointer rounded-full border border-border p-0"
            />
            <span className="text-[11px] text-text-muted">{t('campaign.colorPrimaryLabel')}</span>
          </label>
          <label className="flex flex-col items-center gap-1">
            <input
              type="color"
              value={accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
              className="h-9 w-9 cursor-pointer rounded-full border border-border p-0"
            />
            <span className="text-[11px] text-text-muted">{t('campaign.colorAccentLabel')}</span>
          </label>
        </div>
      </div>

      {error && <p className="mb-3 text-sm text-error">{error}</p>}

      <Button className="w-full" disabled={saving} onClick={handlePublish}>
        {t('campaign.publish')}
      </Button>
    </div>
  );
}
