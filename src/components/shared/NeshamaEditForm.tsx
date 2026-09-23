import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { deleteNeshama, updateNeshama } from '../../services/neshamos';
import { SEFER_TYPES, type Neshama, type ParentGender, type SeferType } from '../../types';
import { NESHAMA_PREFIXES, OTHER_PREFIX_VALUE } from '../../lib/neshamaPrefixes';
import { Button } from '../ui/Button';
import { BubbleGrid } from '../ui/BubbleGrid';
import { Card } from '../ui/Card';
import { FIELD_LABEL_CLASS, TextField } from '../ui/TextField';

interface NeshamaEditFormProps {
  neshama: Neshama;
  onSaved: () => void;
  onDeleted: () => void;
}

/** Shared "edit a neshama" fields — same shape as NeshamaCreateForm, plus the
 *  delete action that only applies once a neshama exists. */
export function NeshamaEditForm({ neshama, onSaved, onDeleted }: NeshamaEditFormProps) {
  const { t } = useTranslation();

  const [name, setName] = useState(neshama.name);
  const [hebrewName, setHebrewName] = useState(neshama.hebrewName ?? '');
  const [namePrefix, setNamePrefix] = useState<string | undefined>(neshama.namePrefix);
  const [customNamePrefix, setCustomNamePrefix] = useState(neshama.customNamePrefix ?? '');
  const [parentGender, setParentGender] = useState<ParentGender>(neshama.parentGender);
  const [fatherHebrewName, setFatherHebrewName] = useState(neshama.fatherHebrewName);
  const [seferTypes, setSeferTypes] = useState<SeferType[]>(neshama.seferTypes ?? []);
  const [seferTypeQuery, setSeferTypeQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function toggleSeferType(type: SeferType) {
    setSeferTypes((prev) => (prev.includes(type) ? prev.filter((t2) => t2 !== type) : [...prev, type]));
  }

  async function handleSave() {
    if (!name.trim() || !fatherHebrewName.trim()) return;
    setError(null);
    setSaving(true);
    try {
      await updateNeshama(neshama.neshamaId, {
        name: name.trim(),
        hebrewName: hebrewName.trim() || undefined,
        namePrefix,
        customNamePrefix: namePrefix === OTHER_PREFIX_VALUE ? customNamePrefix.trim() || undefined : undefined,
        parentGender,
        fatherHebrewName: fatherHebrewName.trim(),
        seferTypes,
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm(t('neshama.confirmDelete') ?? '')) return;
    setDeleting(true);
    try {
      await deleteNeshama(neshama.neshamaId);
      onDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setDeleting(false);
    }
  }

  return (
    <div>
      <div className="space-y-2">
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
      </div>

      {error && <p className="mt-3 text-sm text-error">{error}</p>}

      <Button
        className="mt-4 w-full"
        disabled={saving || !name.trim() || !fatherHebrewName.trim()}
        onClick={handleSave}
      >
        {t('campaign.saveChanges')}
      </Button>

      <Card className="mt-6 border-error/30">
        <p className="mb-3 text-sm text-text-muted">{t('neshama.deleteHint')}</p>
        <Button variant="destructive" className="w-full" disabled={deleting} onClick={handleDelete}>
          {t('neshama.delete')}
        </Button>
      </Card>
    </div>
  );
}
