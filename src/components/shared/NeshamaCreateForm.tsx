import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SEFER_TYPES, type Neshama, type ParentGender, type SeferType } from '../../types';
import { createNeshama } from '../../services/neshamos';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';

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
  const [parentGender, setParentGender] = useState<ParentGender>('son');
  const [fatherHebrewName, setFatherHebrewName] = useState('');
  const [seferTypes, setSeferTypes] = useState<SeferType[]>([]);
  const [saving, setSaving] = useState(false);

  function toggleSeferType(type: SeferType) {
    setSeferTypes((prev) => (prev.includes(type) ? prev.filter((t2) => t2 !== type) : [...prev, type]));
  }

  async function handleCreate() {
    if (!name.trim() || !fatherHebrewName.trim() || !profile) return;
    setSaving(true);
    try {
      const id = await createNeshama({
        createdByUid: profile.uid,
        name: name.trim(),
        hebrewName: hebrewName.trim() || undefined,
        parentGender,
        fatherHebrewName: fatherHebrewName.trim(),
        seferTypes,
      });
      const created: Neshama = {
        neshamaId: id,
        createdByUid: profile.uid,
        name: name.trim(),
        hebrewName: hebrewName.trim() || undefined,
        parentGender,
        fatherHebrewName: fatherHebrewName.trim(),
        seferTypes,
        seferIds: [],
        createdAt: Date.now(),
      };
      onCreated(created);
      setName('');
      setHebrewName('');
      setParentGender('son');
      setFatherHebrewName('');
      setSeferTypes([]);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-2">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={t('neshama.name') ?? ''}
        className="w-full rounded-btn border border-border px-3 py-2 text-sm"
      />
      <input
        value={hebrewName}
        onChange={(e) => setHebrewName(e.target.value)}
        placeholder={t('neshama.hebrewName') ?? ''}
        className="w-full rounded-btn border border-border px-3 py-2 text-sm"
      />
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
      <input
        value={fatherHebrewName}
        onChange={(e) => setFatherHebrewName(e.target.value)}
        placeholder={t('neshama.fatherHebrewName') ?? ''}
        className="w-full rounded-btn border border-border px-3 py-2 text-sm"
      />
      <div>
        <p className="mb-1 text-xs text-text-muted">{t('neshama.seferTypesLabel')}</p>
        <div className="flex flex-wrap gap-2">
          {SEFER_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => toggleSeferType(type)}
              className={`rounded-pill border px-3 py-1.5 text-sm font-medium transition-colors duration-200 ${
                seferTypes.includes(type)
                  ? 'border-accent bg-accent text-white'
                  : 'border-border bg-surface text-text-muted hover:border-accent hover:text-accent'
              }`}
            >
              {t(`sefer.${type}`)}
            </button>
          ))}
        </div>
      </div>
      <Button className="w-full" disabled={!name.trim() || !fatherHebrewName.trim() || saving} onClick={handleCreate}>
        {t('actions.add')}
      </Button>
    </div>
  );
}
