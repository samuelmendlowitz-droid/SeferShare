import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { applyToBeVendor } from '../../services/users';
import type { Address } from '../../types';
import { AddressForm } from '../shared/AddressForm';
import { Button } from '../ui/Button';
import { TextField, TextAreaField } from '../ui/TextField';

const EMPTY_ADDRESS: Address = { line1: '', city: '', state: '', postalCode: '', country: '' };

interface VendorApplicationFormProps {
  onSubmitted: () => void;
}

export function VendorApplicationForm({ onSubmitted }: VendorApplicationFormProps) {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [companyName, setCompanyName] = useState('');
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
      await applyToBeVendor(profile.uid, {
        companyName,
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
      <TextField required label={t('vendor.companyName')} value={companyName} onChange={setCompanyName} />
      <TextField required label={t('vendor.contactName')} value={contactName} onChange={setContactName} />
      <TextField required type="tel" inputMode="tel" label={t('auth.phone')} value={phone} onChange={setPhone} />
      <TextField required type="email" inputMode="email" label={t('auth.email')} value={email} onChange={setEmail} />
      <AddressForm value={address} onChange={setAddress} />
      <TextAreaField label={t('vendor.notesOptional')} value={notes} onChange={setNotes} rows={3} />
      {error && <p className="text-sm text-error">{error}</p>}
      <Button type="submit" disabled={submitting} className="w-full">
        {t('vendor.submitApplication')}
      </Button>
    </form>
  );
}
