import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Institution, InstitutionType } from '../../types';
import { createInstitution, listInstitutions } from '../../services/institutions';
import { useAuth } from '../../context/AuthContext';

interface InstitutionPickerProps {
  value?: string;
  onChange: (institutionId: string | undefined) => void;
  allowCreate?: boolean;
}

export function InstitutionPicker({ value, onChange, allowCreate = false }: InstitutionPickerProps) {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [hebrewName, setHebrewName] = useState('');
  const [type, setType] = useState<InstitutionType>('shul');

  useEffect(() => {
    listInstitutions().then(setInstitutions);
  }, []);

  async function handleCreate() {
    if (!profile || !name) return;
    const id = await createInstitution({
      name,
      hebrewName: hebrewName || undefined,
      type,
      address: { line1: '', city: '', state: '', postalCode: '', country: '' },
      createdByUid: profile.uid,
    });
    setInstitutions((prev) => [...prev, { institutionId: id, name, hebrewName, type, address: { line1: '', city: '', state: '', postalCode: '', country: '' }, createdByUid: profile.uid, createdAt: Date.now() }]);
    onChange(id);
    setCreating(false);
    setName('');
    setHebrewName('');
  }

  if (creating) {
    return (
      <div className="space-y-2 rounded-btn border border-border p-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('institution.name') ?? ''}
          className="w-full rounded-btn border border-border px-3 py-2 text-sm"
        />
        <input
          value={hebrewName}
          onChange={(e) => setHebrewName(e.target.value)}
          placeholder={t('institution.hebrewName') ?? ''}
          className="w-full rounded-btn border border-border px-3 py-2 text-sm"
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value as InstitutionType)}
          className="w-full rounded-btn border border-border px-3 py-2 text-sm"
        >
          <option value="shul">{t('institution.shul')}</option>
          <option value="yeshiva">{t('institution.yeshiva')}</option>
          <option value="school">{t('institution.school')}</option>
          <option value="other">{t('institution.other')}</option>
        </select>
        <button
          type="button"
          onClick={handleCreate}
          className="rounded-btn bg-accent px-3 py-1.5 text-xs font-medium text-white"
        >
          {t('actions.add')}
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || undefined)}
        className="w-full rounded-btn border border-border px-3 py-2 text-sm"
      >
        <option value="">{t('campaign.selectWhere')}</option>
        {institutions.map((inst) => (
          <option key={inst.institutionId} value={inst.institutionId}>
            {inst.name}
          </option>
        ))}
      </select>
      {allowCreate && (
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="whitespace-nowrap rounded-btn border border-accent px-3 py-2 text-xs font-medium text-accent"
        >
          {t('actions.add')}
        </button>
      )}
    </div>
  );
}
