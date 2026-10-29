import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { deleteInstitution, updateInstitution } from '../../services/institutions';
import { uploadInstitutionImages, uploadInstitutionLogo } from '../../services/storage';
import { getColorTheme } from '../../lib/colorTheme';
import { INSTITUTION_TYPES, MAX_INSTITUTION_IMAGES, type Address, type Institution, type InstitutionType } from '../../types';
import { AddressForm } from './AddressForm';
import { Button } from '../ui/Button';
import { BubbleGrid } from '../ui/BubbleGrid';
import { Card } from '../ui/Card';
import { FIELD_LABEL_CLASS, TextAreaField, TextField } from '../ui/TextField';
import { ImageUploadField, resolveImageUrls, type ImageItem } from '../ui/ImageUploadField';

const EMPTY_ADDRESS: Address = { line1: '', city: '', state: '', postalCode: '', country: '' };

interface InstitutionEditFormProps {
  institution: Institution;
  onSaved: () => void;
  onDeleted: () => void;
}

/** Shared "edit an institution" fields — same shape as InstitutionCreateForm,
 *  plus the delete action that only applies once an institution exists. */
export function InstitutionEditForm({ institution, onSaved, onDeleted }: InstitutionEditFormProps) {
  const { t } = useTranslation();
  const { profile } = useAuth();

  const [name, setName] = useState(institution.name);
  const [hebrewName, setHebrewName] = useState(institution.hebrewName ?? '');
  const [type, setType] = useState<InstitutionType>(institution.type);
  const [customType, setCustomType] = useState(institution.customType ?? '');
  const [address, setAddress] = useState<Address>(institution.address);
  const [shipsElsewhere, setShipsElsewhere] = useState(Boolean(institution.shippingAddress));
  const [shippingAddress, setShippingAddress] = useState<Address>(institution.shippingAddress ?? EMPTY_ADDRESS);
  const [bio, setBio] = useState(institution.bio ?? '');
  const [accomplishments, setAccomplishments] = useState(institution.accomplishments ?? '');
  const [logoItems, setLogoItems] = useState<ImageItem[]>(
    institution.logoUrl ? [{ kind: 'existing', url: institution.logoUrl }] : [],
  );
  const [imageItems, setImageItems] = useState<ImageItem[]>(
    (institution.images ?? []).map((url): ImageItem => ({ kind: 'existing', url })),
  );
  const existingTheme = getColorTheme(institution.colorTheme);
  const [bgColor, setBgColor] = useState(existingTheme.background);
  const [primaryColor, setPrimaryColor] = useState(existingTheme.primary);
  const [accentColor, setAccentColor] = useState(existingTheme.accent);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSave() {
    if (!name.trim() || !profile) return;
    setError(null);
    setSaving(true);
    try {
      const images = await resolveImageUrls(imageItems, (files) => uploadInstitutionImages(profile.uid, files));
      const logoItem = logoItems[0];
      const logoUrl =
        logoItem === undefined
          ? undefined
          : logoItem.kind === 'new'
            ? await uploadInstitutionLogo(profile.uid, logoItem.file)
            : logoItem.url;
      await updateInstitution(institution.institutionId, {
        name: name.trim(),
        hebrewName: hebrewName.trim() || undefined,
        type,
        customType: type === 'other' ? customType.trim() || undefined : undefined,
        address,
        shippingAddress: shipsElsewhere ? shippingAddress : undefined,
        bio: bio.trim() || undefined,
        accomplishments: accomplishments.trim() || undefined,
        images,
        logoUrl,
        colorTheme: { background: bgColor, primary: primaryColor, accent: accentColor },
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm(t('institution.confirmDelete') ?? '')) return;
    setDeleting(true);
    try {
      await deleteInstitution(institution.institutionId);
      onDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setDeleting(false);
    }
  }

  return (
    <div>
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
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={shipsElsewhere} onChange={(e) => setShipsElsewhere(e.target.checked)} />
          {t('institution.shipsElsewhereLabel')}
        </label>
        {shipsElsewhere && (
          <div className="rounded-btn border border-border p-3">
            <AddressForm value={shippingAddress} onChange={setShippingAddress} />
          </div>
        )}
        <TextAreaField label={t('institution.bioLabel')} value={bio} onChange={setBio} rows={3} />
        <TextAreaField
          label={t('institution.accomplishmentsLabel')}
          value={accomplishments}
          onChange={setAccomplishments}
          rows={3}
        />
        <ImageUploadField label={t('institution.logoLabel')} items={logoItems} onChange={setLogoItems} max={1} />
        <ImageUploadField
          label={t('institution.imagesLabel', { max: MAX_INSTITUTION_IMAGES })}
          items={imageItems}
          onChange={setImageItems}
          max={MAX_INSTITUTION_IMAGES}
          allowPrimarySelection
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
      </div>

      {error && <p className="mt-3 text-sm text-error">{error}</p>}

      <Button className="mt-4 w-full" disabled={saving || !name.trim()} onClick={handleSave}>
        {t('campaign.saveChanges')}
      </Button>

      <Card className="mt-6 border-error/30">
        <p className="mb-3 text-sm text-text-muted">{t('institution.deleteHint')}</p>
        <Button variant="destructive" className="w-full" disabled={deleting} onClick={handleDelete}>
          {t('institution.delete')}
        </Button>
      </Card>
    </div>
  );
}
