import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SEFER_TYPES, type Neshama, type ParentGender, type SeferType } from '../../types';
import { createNeshama } from '../../services/neshamos';
import { uploadNeshamaImage } from '../../services/storage';
import { NESHAMA_PREFIXES, OTHER_PREFIX_VALUE } from '../../lib/neshamaPrefixes';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { BubbleGrid } from '../ui/BubbleGrid';
import { FIELD_LABEL_CLASS, TextAreaField, TextField } from '../ui/TextField';
import { ImageUploadField } from '../ui/ImageUploadField';

interface NeshamaCreateFormProps {
  onCreated: (neshama: Neshama) => void;
}

/** Shared "add a neshama" fields — used by both the campaign multi-picker and the
 *  pushka's cart-wide dedication picker. */
export function NeshamaCreateForm({ onCreated }: NeshamaCreateFormProps) {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [name, setName] = useState('');
  const [hebrewName, setHebrewName] = useState('');
  const [namePrefix, setNamePrefix] = useState<string | undefined>(undefined);
  const [customNamePrefix, setCustomNamePrefix] = useState('');
  const [parentGender, setParentGender] = useState<ParentGender>('son');
  const [fatherHebrewName, setFatherHebrewName] = useState('');
  const [bio, setBio] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [dateOfDeath, setDateOfDeath] = useState('');
  const [isRabbi, setIsRabbi] = useState(false);
  const [seferimWrittenText, setSeferimWrittenText] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [seferTypes, setSeferTypes] = useState<SeferType[]>([]);
  const [seferTypeQuery, setSeferTypeQuery] = useState('');
  const [saving, setSaving] = useState(false);

  function toggleSeferType(type: SeferType) {
    setSeferTypes((prev) => (prev.includes(type) ? prev.filter((t2) => t2 !== type) : [...prev, type]));
  }

  async function handleCreate() {
    if (!name.trim() || !fatherHebrewName.trim() || !profile) return;
    setSaving(true);
    try {
      const imageUrl = imageFile ? await uploadNeshamaImage(profile.uid, imageFile) : undefined;
      const seferimWritten = seferimWrittenText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);
      const id = await createNeshama({
        createdByUid: profile.uid,
        name: name.trim(),
        hebrewName: hebrewName.trim() || undefined,
        namePrefix,
        customNamePrefix: namePrefix === OTHER_PREFIX_VALUE ? customNamePrefix.trim() || undefined : undefined,
        parentGender,
        fatherHebrewName: fatherHebrewName.trim(),
        imageUrl,
        bio: bio.trim() || undefined,
        dateOfBirth: dateOfBirth || undefined,
        dateOfDeath: dateOfDeath || undefined,
        seferTypes,
        isRabbi,
        seferimWritten,
      });
      const created: Neshama = {
        neshamaId: id,
        createdByUid: profile.uid,
        name: name.trim(),
        hebrewName: hebrewName.trim() || undefined,
        namePrefix,
        customNamePrefix: namePrefix === OTHER_PREFIX_VALUE ? customNamePrefix.trim() || undefined : undefined,
        parentGender,
        fatherHebrewName: fatherHebrewName.trim(),
        imageUrl,
        bio: bio.trim() || undefined,
        dateOfBirth: dateOfBirth || undefined,
        dateOfDeath: dateOfDeath || undefined,
        seferTypes,
        seferIds: [],
        isRabbi,
        seferimWritten,
        createdAt: Date.now(),
      };
      onCreated(created);
      setName('');
      setHebrewName('');
      setNamePrefix(undefined);
      setCustomNamePrefix('');
      setParentGender('son');
      setFatherHebrewName('');
      setBio('');
      setDateOfBirth('');
      setDateOfDeath('');
      setIsRabbi(false);
      setSeferimWrittenText('');
      setImageFile(null);
      setSeferTypes([]);
      setSeferTypeQuery('');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-2">
      <ImageUploadField
        label={t('neshama.imageLabel')}
        existingImageUrls={[]}
        onRemoveExisting={() => {}}
        newFiles={imageFile ? [imageFile] : []}
        onAddFiles={(files) => setImageFile(files[0] ?? null)}
        onRemoveNewFile={() => setImageFile(null)}
        max={1}
      />
      <TextField label={t('neshama.name')} value={name} onChange={setName} />
      <TextField label={t('neshama.hebrewName')} value={hebrewName} onChange={setHebrewName} />
      <div>
        <p className={FIELD_LABEL_CLASS}>{t('neshama.namePrefixLabel')}</p>
        <BubbleGrid
          rows={2}
          options={NESHAMA_PREFIXES.map((option) => ({ value: option.value, label: `${option.en} · ${option.he}` }))}
          isSelected={(v) => namePrefix === v}
          onToggle={(v) => setNamePrefix((prev) => (prev === v ? undefined : v))}
        />
        {namePrefix === OTHER_PREFIX_VALUE && (
          <div className="mt-2">
            <TextField label={t('neshama.customNamePrefixLabel')} value={customNamePrefix} onChange={setCustomNamePrefix} />
          </div>
        )}
      </div>
      <div>
        <p className={FIELD_LABEL_CLASS}>{t('neshama.parentGenderLabel')}</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setParentGender('son')}
            className={`flex-1 rounded-btn border px-3 py-2 text-sm font-medium ${
              parentGender === 'son' ? 'border-accent bg-accent text-white' : 'border-border text-text-muted'
            }`}
          >
            {t('neshama.son')}
          </button>
          <button
            type="button"
            onClick={() => setParentGender('daughter')}
            className={`flex-1 rounded-btn border px-3 py-2 text-sm font-medium ${
              parentGender === 'daughter' ? 'border-accent bg-accent text-white' : 'border-border text-text-muted'
            }`}
          >
            {t('neshama.daughter')}
          </button>
        </div>
      </div>
      <TextField label={t('neshama.fatherHebrewName')} value={fatherHebrewName} onChange={setFatherHebrewName} />
      <TextAreaField label={t('neshama.bioLabel')} value={bio} onChange={setBio} rows={3} />
      <div className="flex gap-2">
        <TextField
          type="date"
          label={t('neshama.dateOfBirthLabel')}
          value={dateOfBirth}
          onChange={setDateOfBirth}
          containerClassName="w-full"
        />
        <TextField
          type="date"
          label={t('neshama.dateOfDeathLabel')}
          value={dateOfDeath}
          onChange={setDateOfDeath}
          containerClassName="w-full"
        />
      </div>
      <div>
        <p className={FIELD_LABEL_CLASS}>{t('neshama.seferTypesLabel')}</p>
        <BubbleGrid
          options={SEFER_TYPES.filter((type) => t(`sefer.${type}`).toLowerCase().includes(seferTypeQuery.trim().toLowerCase())).map(
            (type) => ({ value: type, label: t(`sefer.${type}`) }),
          )}
          isSelected={(v) => seferTypes.includes(v as SeferType)}
          onToggle={(v) => toggleSeferType(v as SeferType)}
          emptyMessage={t('actions.noResults') ?? ''}
          search={{
            query: seferTypeQuery,
            onQueryChange: setSeferTypeQuery,
            placeholder: t('filterSort.searchSeferTypes') ?? '',
            label: t('filterSort.searchSeferTypes') ?? '',
          }}
        />
      </div>
      <div>
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" checked={isRabbi} onChange={(e) => setIsRabbi(e.target.checked)} />
          {t('neshama.isRabbiLabel')}
        </label>
        <p className="mt-1 text-xs text-text-muted">{t('neshama.isRabbiHint')}</p>
      </div>
      {isRabbi && (
        <TextAreaField
          label={t('neshama.seferimWrittenLabel')}
          value={seferimWrittenText}
          onChange={setSeferimWrittenText}
          rows={3}
          placeholder={t('neshama.seferimWrittenPlaceholder') ?? ''}
        />
      )}
      <Button className="w-full" disabled={!name.trim() || !fatherHebrewName.trim() || saving} onClick={handleCreate}>
        {t('actions.add')}
      </Button>
    </div>
  );
}
