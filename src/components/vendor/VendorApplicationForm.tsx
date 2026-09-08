import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { applyToBeVendor } from '../../services/users';
import type { Address } from '../../types';
import { AddressForm } from '../shared/AddressForm';
import { Button } from '../ui/Button';

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
      <input
        required
        value={companyName}
        onChange={(e) => setCompanyName(e.target.value)}
        placeholder={t('vendor.companyName') ?? ''}
        className="w-full rounded-btn border border-border px-3 py-2 text-sm"
      />
      <input
        required
        value={contactName}
        onChange={(e) => setContactName(e.target.value)}
        placeholder={t('vendor.contactName') ?? ''}
        className="w-full rounded-btn border border-border px-3 py-2 text-sm"
      />
      <input
        required
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder={t('auth.phone') ?? ''}
        className="w-full rounded-btn border border-border px-3 py-2 text-sm"
      />
      <input
        required
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={t('auth.email') ?? ''}
        className="w-full rounded-btn border border-border px-3 py-2 text-sm"
      />
      <AddressForm value={address} onChange={setAddress} />
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder={t('vendor.notesOptional') ?? ''}
        rows={3}
        className="w-full rounded-btn border border-border px-3 py-2 text-sm"
      />
      {error && <p className="text-sm text-error">{error}</p>}
      <Button type="submit" disabled={submitting} className="w-full">
        {t('vendor.submitApplication')}
      </Button>
    </form>
  );
}
