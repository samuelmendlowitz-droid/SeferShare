import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Address, Institution, InstitutionType } from '../../types';
import { INSTITUTION_TYPES, MAX_INSTITUTION_IMAGES } from '../../types';
import { createInstitution } from '../../services/institutions';
import { uploadInstitutionImages } from '../../services/storage';
import { useAuth } from '../../context/AuthContext';
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
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    if (!profile || !name.trim()) return;
    setSaving(true);
    try {
      const resolvedCustomType = type === 'other' ? customType.trim() || undefined : undefined;
      const images = imageFiles.length ? await uploadInstitutionImages(profile.uid, imageFiles) : [];
      const id = await createInstitution({
        name: name.trim(),
        hebrewName: hebrewName.trim() || undefined,
        type,
        customType: resolvedCustomType,
        address,
        bio: bio.trim() || undefined,
        accomplishments: accomplishments.trim() || undefined,
        images,
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
      <Button className="w-full" disabled={!name.trim() || saving} onClick={handleCreate}>
        {t('actions.add')}
      </Button>
    </div>
  );
}
