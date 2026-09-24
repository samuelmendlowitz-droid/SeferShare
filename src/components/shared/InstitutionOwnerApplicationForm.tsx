import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { applyToBeInstitutionOwner } from '../../services/users';
import type { Address } from '../../types';
import { AddressForm } from './AddressForm';
import { Button } from '../ui/Button';
import { TextField, TextAreaField } from '../ui/TextField';

const EMPTY_ADDRESS: Address = { line1: '', city: '', state: '', postalCode: '', country: '' };

interface InstitutionOwnerApplicationFormProps {
  onSubmitted: () => void;
}

/** Person-level "become a verified institution owner" questionnaire — a
 *  prerequisite for creating any institution. Mirrors VendorApplicationForm. */
export function InstitutionOwnerApplicationForm({ onSubmitted }: InstitutionOwnerApplicationFormProps) {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [institutionName, setInstitutionName] = useState('');
  const [contactName, setContactName] = useState(profile?.displayName ?? '');
  const [address, setAddress] = useState<Address>(EMPTY_ADDRESS);
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [email, setEmail] = useState(profile?.email ?? '');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setSubmitting(true);
    setError(null);
    try {
      await applyToBeInstitutionOwner(profile.uid, {
        institutionName,
        contactName,
        address,
        phone,
        email,
        ...(notes ? { notes } : {}),
        submittedAt: Date.now(),
      });
      onSubmitted();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <TextField required label={t('institution.ownerInstitutionName')} value={institutionName} onChange={setInstitutionName} />
      <TextField required label={t('institution.ownerContactName')} value={contactName} onChange={setContactName} />
      <TextField required type="tel" inputMode="tel" label={t('auth.phone')} value={phone} onChange={setPhone} />
      <TextField required type="email" inputMode="email" label={t('auth.email')} value={email} onChange={setEmail} />
      <AddressForm value={address} onChange={setAddress} />
      <TextAreaField label={t('institution.ownerNotesOptional')} value={notes} onChange={setNotes} rows={3} />
      {error && <p className="text-sm text-error">{error}</p>}
      <Button type="submit" disabled={submitting} className="w-full">
        {t('institution.ownerSubmitApplication')}
      </Button>
    </form>
  );
}
