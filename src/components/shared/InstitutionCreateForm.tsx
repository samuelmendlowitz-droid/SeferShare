import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Address, Institution, InstitutionType } from '../../types';
import { INSTITUTION_TYPES, MAX_INSTITUTION_IMAGES } from '../../types';
import { createInstitution } from '../../services/institutions';
import { uploadInstitutionImages } from '../../services/storage';
import { useAuth } from '../../context/AuthContext';
import { DEFAULT_COLOR_THEME } from '../../lib/colorTheme';
import { Button } from '../ui/Button';
import { BubbleGrid } from '../ui/BubbleGrid';
import { FIELD_LABEL_CLASS, TextAreaField, TextField } from '../ui/TextField';
import { ImageUploadField } from '../ui/ImageUploadField';
import { AddressForm } from './AddressForm';

const EMPTY_ADDRESS: Address = { line1: '', city: '', state: '', postalCode: '', country: '' };

interface InstitutionCreateFormProps {
  onCreated: (institution: Institution) => void;
}

/** Shared "add an institution" fields — used by both the institution picker and the
 *  Home page's Mekomos-tab create button. */
export function InstitutionCreateForm({ onCreated }: InstitutionCreateFormProps) {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [name, setName] = useState('');
  const [hebrewName, setHebrewName] = useState('');
  const [type, setType] = useState<InstitutionType>('shul');
  const [customType, setCustomType] = useState('');
  const [address, setAddress] = useState<Address>(EMPTY_ADDRESS);
  const [bio, setBio] = useState('');
  const [accomplishments, setAccomplishments] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [bgColor, setBgColor] = useState(DEFAULT_COLOR_THEME.background);
  const [primaryColor, setPrimaryColor] = useState(DEFAULT_COLOR_THEME.primary);
  const [accentColor, setAccentColor] = useState(DEFAULT_COLOR_THEME.accent);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    if (!profile || !name.trim()) return;
    setError(null);
    setSaving(true);
    try {
      const resolvedCustomType = type === 'other' ? customType.trim() || undefined : undefined;
      const images = imageFiles.length ? await uploadInstitutionImages(profile.uid, imageFiles) : [];
      const colorTheme = { background: bgColor, primary: primaryColor, accent: accentColor };
      const id = await createInstitution({
        name: name.trim(),
        hebrewName: hebrewName.trim() || undefined,
        type,
        customType: resolvedCustomType,
        address,
        bio: bio.trim() || undefined,
        accomplishments: accomplishments.trim() || undefined,
        images,
        colorTheme,
        createdByUid: profile.uid,
        verified: false,
      });
      const created: Institution = {
        institutionId: id,
        name: name.trim(),
        hebrewName: hebrewName.trim() || undefined,
        type,
        customType: resolvedCustomType,
        address,
        bio: bio.trim() || undefined,
        accomplishments: accomplishments.trim() || undefined,
        images,
        colorTheme,
        createdByUid: profile.uid,
        verified: false,
        createdAt: Date.now(),
      };
      onCreated(created);
      setName('');
      setHebrewName('');
      setType('shul');
      setCustomType('');
      setAddress(EMPTY_ADDRESS);
      setBio('');
      setAccomplishments('');
      setImageFiles([]);
      setBgColor(DEFAULT_COLOR_THEME.background);
      setPrimaryColor(DEFAULT_COLOR_THEME.primary);
      setAccentColor(DEFAULT_COLOR_THEME.accent);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-2">
      <TextField label={t('institution.name')} value={name} onChange={setName} />
      <TextField label={t('institution.hebrewName')} value={hebrewName} onChange={setHebrewName} />
      <div>
        <p className={FIELD_LABEL_CLASS}>{t('institution.type')}</p>
        <BubbleGrid
          options={INSTITUTION_TYPES.map((t2) => ({ value: t2, label: t(`institution.${t2}`) }))}
          isSelected={(v) => type === v}
          onToggle={(v) => setType(v as InstitutionType)}
        />
      </div>
      {type === 'other' && (
        <TextField required label={t('institution.customTypeLabel')} value={customType} onChange={setCustomType} />
      )}
      <AddressForm value={address} onChange={setAddress} />
      <TextAreaField label={t('institution.bioLabel')} value={bio} onChange={setBio} rows={3} />
      <TextAreaField
        label={t('institution.accomplishmentsLabel')}
        value={accomplishments}
        onChange={setAccomplishments}
        rows={3}
      />
      <ImageUploadField
        label={t('institution.imagesLabel', { max: MAX_INSTITUTION_IMAGES })}
        existingImageUrls={[]}
        onRemoveExisting={() => {}}
        newFiles={imageFiles}
        onAddFiles={(files) => setImageFiles((prev) => [...prev, ...files])}
        onRemoveNewFile={(index) => setImageFiles((prev) => prev.filter((_, i) => i !== index))}
        max={MAX_INSTITUTION_IMAGES}
      />
      <div>
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
      {error && <p className="text-sm text-error">{error}</p>}

      <Button className="w-full" disabled={!name.trim() || saving} onClick={handleCreate}>
        {t('actions.add')}
      </Button>
    </div>
  );
}
