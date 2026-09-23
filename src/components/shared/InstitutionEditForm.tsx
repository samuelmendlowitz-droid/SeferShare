import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { deleteInstitution, updateInstitution } from '../../services/institutions';
import { INSTITUTION_TYPES, type Address, type Institution, type InstitutionType } from '../../types';
import { AddressForm } from './AddressForm';
import { Button } from '../ui/Button';
import { BubbleGrid } from '../ui/BubbleGrid';
import { Card } from '../ui/Card';
import { FIELD_LABEL_CLASS, TextField } from '../ui/TextField';

interface InstitutionEditFormProps {
  institution: Institution;
  onSaved: () => void;
  onDeleted: () => void;
}

/** Shared "edit an institution" fields — same shape as InstitutionCreateForm,
 *  plus the delete action that only applies once an institution exists. */
export function InstitutionEditForm({ institution, onSaved, onDeleted }: InstitutionEditFormProps) {
  const { t } = useTranslation();

  const [name, setName] = useState(institution.name);
  const [hebrewName, setHebrewName] = useState(institution.hebrewName ?? '');
  const [type, setType] = useState<InstitutionType>(institution.type);
  const [customType, setCustomType] = useState(institution.customType ?? '');
  const [address, setAddress] = useState<Address>(institution.address);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSave() {
    if (!name.trim()) return;
    setError(null);
    setSaving(true);
    try {
      await updateInstitution(institution.institutionId, {
        name: name.trim(),
        hebrewName: hebrewName.trim() || undefined,
        type,
        customType: type === 'other' ? customType.trim() || undefined : undefined,
        address,
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
