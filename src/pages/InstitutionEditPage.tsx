import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { deleteInstitution, getInstitution, updateInstitution } from '../services/institutions';
import { INSTITUTION_TYPES, type Address, type Institution, type InstitutionType } from '../types';
import { AddressForm } from '../components/shared/AddressForm';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { SelectField, TextField } from '../components/ui/TextField';

export function InstitutionEditPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { institutionId } = useParams();

  const [institution, setInstitution] = useState<Institution | null>(null);
  const [notFound, setNotFound] = useState(false);

  const [name, setName] = useState('');
  const [hebrewName, setHebrewName] = useState('');
  const [type, setType] = useState<InstitutionType>('shul');
  const [address, setAddress] = useState<Address>({ line1: '', city: '', state: '', postalCode: '', country: '' });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!institutionId) return;
    getInstitution(institutionId).then((inst) => {
      if (!inst) {
        setNotFound(true);
        return;
      }
      setInstitution(inst);
      setName(inst.name);
      setHebrewName(inst.hebrewName ?? '');
      setType(inst.type);
      setAddress(inst.address);
    });
  }, [institutionId]);

  if (notFound) {
    return (
      <div className="mx-auto max-w-2xl px-4 pt-6">
        <Button variant="secondary" className="mb-4" onClick={() => navigate('/')}>
          {t('actions.back')}
        </Button>
        <p className="text-text-muted">{t('institution.notFound')}</p>
      </div>
    );
  }

  if (!institution) return <LoadingSpinner fullScreen />;

  if (profile?.uid !== institution.createdByUid) {
    return (
      <div className="mx-auto max-w-2xl px-4 pt-6">
        <p className="text-text-muted">Not authorized.</p>
      </div>
    );
  }

  async function handleSave() {
    if (!institution || !name.trim()) return;
    setError(null);
    setSaving(true);
    try {
      await updateInstitution(institution.institutionId, {
        name: name.trim(),
        hebrewName: hebrewName.trim() || undefined,
        type,
        address,
      });
      navigate(`/institutions/${institution.institutionId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!institution) return;
    if (!window.confirm(t('institution.confirmDelete') ?? '')) return;
    setDeleting(true);
    try {
      await deleteInstitution(institution.institutionId);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pb-24 pt-6">
      <Button variant="secondary" className="mb-4" onClick={() => navigate(`/institutions/${institution.institutionId}`)}>
        {t('actions.back')}
      </Button>

      <h1 className="mb-4 text-lg font-bold">{t('institution.edit')}</h1>

      <div className="space-y-2">
        <TextField label={t('institution.name')} value={name} onChange={setName} />
        <TextField label={t('institution.hebrewName')} value={hebrewName} onChange={setHebrewName} />
        <SelectField
          label={t('institution.type')}
          value={type}
          onChange={setType}
          options={INSTITUTION_TYPES.map((t2) => ({ value: t2, label: t(`institution.${t2}`) }))}
        />
        <AddressForm value={address} onChange={setAddress} />
      </div>

      {error && <p className="mt-3 text-sm text-error">{error}</p>}

      <Button className="mt-4 w-full" disabled={saving || !name.trim()} onClick={handleSave}>
        {t('campaign.saveChanges')}
      </Button>

      <Card className="mt-6 border-error/30">
        <p className="mb-3 text-sm text-text-muted">{t('institution.deleteHint')}</p>
        <Button variant="secondary" className="w-full text-error" disabled={deleting} onClick={handleDelete}>
          {t('institution.delete')}
        </Button>
      </Card>
    </div>
  );
}
