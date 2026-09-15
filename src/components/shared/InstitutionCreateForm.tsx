import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Address, Institution, InstitutionType } from '../../types';
import { INSTITUTION_TYPES } from '../../types';
import { createInstitution } from '../../services/institutions';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { SelectField, TextField } from '../ui/TextField';
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
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    if (!profile || !name.trim()) return;
    setSaving(true);
    try {
      const resolvedCustomType = type === 'other' ? customType.trim() || undefined : undefined;
      const id = await createInstitution({
        name: name.trim(),
        hebrewName: hebrewName.trim() || undefined,
        type,
        customType: resolvedCustomType,
        address,
        createdByUid: profile.uid,
      });
      const created: Institution = {
        institutionId: id,
        name: name.trim(),
        hebrewName: hebrewName.trim() || undefined,
        type,
        customType: resolvedCustomType,
        address,
        createdByUid: profile.uid,
        createdAt: Date.now(),
      };
      onCreated(created);
      setName('');
      setHebrewName('');
      setType('shul');
      setCustomType('');
      setAddress(EMPTY_ADDRESS);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-2">
      <TextField label={t('institution.name')} value={name} onChange={setName} />
      <TextField label={t('institution.hebrewName')} value={hebrewName} onChange={setHebrewName} />
      <SelectField
        label={t('institution.type')}
        value={type}
        onChange={setType}
        options={INSTITUTION_TYPES.map((t2) => ({ value: t2, label: t(`institution.${t2}`) }))}
      />
      {type === 'other' && (
        <TextField required label={t('institution.customTypeLabel')} value={customType} onChange={setCustomType} />
      )}
      <AddressForm value={address} onChange={setAddress} />
      <Button className="w-full" disabled={!name.trim() || saving} onClick={handleCreate}>
        {t('actions.add')}
      </Button>
    </div>
  );
}
