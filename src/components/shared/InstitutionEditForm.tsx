import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { deleteInstitution, updateInstitution } from '../../services/institutions';
import { uploadInstitutionImages } from '../../services/storage';
import { INSTITUTION_TYPES, MAX_INSTITUTION_IMAGES, type Address, type Institution, type InstitutionType } from '../../types';
import { AddressForm } from './AddressForm';
import { Button } from '../ui/Button';
import { BubbleGrid } from '../ui/BubbleGrid';
import { Card } from '../ui/Card';
import { FIELD_LABEL_CLASS, TextAreaField, TextField } from '../ui/TextField';
import { ImageUploadField } from '../ui/ImageUploadField';

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
  const [bio, setBio] = useState(institution.bio ?? '');
  const [accomplishments, setAccomplishments] = useState(institution.accomplishments ?? '');
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>(institution.images ?? []);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSave() {
    if (!name.trim() || !profile) return;
    setError(null);
    setSaving(true);
    try {
      const uploadedUrls = imageFiles.length ? await uploadInstitutionImages(profile.uid, imageFiles) : [];
      await updateInstitution(institution.institutionId, {
        name: name.trim(),
        hebrewName: hebrewName.trim() || undefined,
        type,
        customType: type === 'other' ? customType.trim() || undefined : undefined,
        address,
        bio: bio.trim() || undefined,
        accomplishments: accomplishments.trim() || undefined,
        images: [...existingImageUrls, ...uploadedUrls],
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
        <TextAreaField label={t('institution.bioLabel')} value={bio} onChange={setBio} rows={3} />
        <TextAreaField
          label={t('institution.accomplishmentsLabel')}
          value={accomplishments}
          onChange={setAccomplishments}
          rows={3}
        />
        <ImageUploadField
          label={t('institution.imagesLabel', { max: MAX_INSTITUTION_IMAGES })}
          existingImageUrls={existingImageUrls}
          onRemoveExisting={(index) => setExistingImageUrls((prev) => prev.filter((_, i) => i !== index))}
          newFiles={imageFiles}
          onAddFiles={(files) => setImageFiles((prev) => [...prev, ...files])}
          onRemoveNewFile={(index) => setImageFiles((prev) => prev.filter((_, i) => i !== index))}
          max={MAX_INSTITUTION_IMAGES}
        />
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
