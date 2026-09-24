import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { spendInstitutionBalance } from '../../services/institutions';
import type { DonationAd, Institution, ParentGender } from '../../types';
import { NESHAMA_PREFIXES, OTHER_PREFIX_VALUE } from '../../lib/neshamaPrefixes';
import { SeferPicker, type PickedItem } from '../donation/SeferPicker';
import { Button } from '../ui/Button';
import { BubbleGrid } from '../ui/BubbleGrid';
import { Card } from '../ui/Card';
import { FIELD_LABEL_CLASS, TextField, TextAreaField } from '../ui/TextField';

interface InstitutionSpendFormProps {
  institution: Institution;
  /** Called after a successful spend with the new balance, so the caller can
   *  refresh its own copy of the institution. */
  onSpent: (newBalance: number) => void;
}

/** Lets a verified institution's owner spend its gift card balance on seforim
 *  for itself — reached from Seforim > Gallery's institution switcher (Modal),
 *  not a dedicated route. No Stripe payment involved; runs entirely against
 *  the balance server-side (spendInstitutionBalance). */
export function InstitutionSpendForm({ institution, onSpent }: InstitutionSpendFormProps) {
  const { t } = useTranslation();
  const [picked, setPicked] = useState<PickedItem[]>([]);
  const [dedicationName, setDedicationName] = useState('');
  const [dedicationHebrewName, setDedicationHebrewName] = useState('');
  const [dedicationNamePrefix, setDedicationNamePrefix] = useState<string | undefined>(undefined);
  const [dedicationCustomNamePrefix, setDedicationCustomNamePrefix] = useState('');
  const [dedicationParentGender, setDedicationParentGender] = useState<ParentGender>('son');
  const [dedicationFatherHebrewName, setDedicationFatherHebrewName] = useState('');
  const [includeAd, setIncludeAd] = useState(false);
  const [ad, setAd] = useState<DonationAd>({ businessName: '', message: '' });
  const [donorMessage, setDonorMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<number | null>(null);

  const balance = institution.giftCardBalance ?? 0;
  const subtotal = picked.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const overBudget = subtotal > balance;

  async function handleSpend() {
    if (picked.length === 0 || overBudget) return;
    setSaving(true);
    setError(null);
    try {
      const result = await spendInstitutionBalance({
        institutionId: institution.institutionId,
        items: picked.map((i) => ({ seferId: i.seferId, vendorId: i.vendorId, quantity: i.quantity, priceEach: i.price })),
        donorMessage: donorMessage || undefined,
        donorDedication: dedicationName.trim()
          ? {
              name: dedicationName.trim(),
              hebrewName: dedicationHebrewName.trim() || undefined,
              namePrefix: dedicationNamePrefix,
              customNamePrefix:
                dedicationNamePrefix === OTHER_PREFIX_VALUE ? dedicationCustomNamePrefix.trim() || undefined : undefined,
              parentGender: dedicationFatherHebrewName.trim() ? dedicationParentGender : undefined,
              fatherHebrewName: dedicationFatherHebrewName.trim() || undefined,
            }
          : undefined,
        ad: includeAd && ad.businessName.trim() ? ad : undefined,
      });
      setSuccess(result.totalSpent);
      onSpent(balance - result.totalSpent);
      setPicked([]);
      setDedicationName('');
      setDedicationHebrewName('');
      setDedicationNamePrefix(undefined);
      setDedicationCustomNamePrefix('');
      setDedicationParentGender('son');
      setDedicationFatherHebrewName('');
      setIncludeAd(false);
      setAd({ businessName: '', message: '' });
      setDonorMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <Card className="mb-4 text-center">
        <h1 className="mb-1 text-lg font-bold">{institution.name}</h1>
        <p className="text-sm text-text-muted">{t('institution.giftCardBalance', { amount: balance.toFixed(2) })}</p>
      </Card>

      {success !== null && (
        <p className="mb-4 text-sm font-medium text-success">
          {t('institution.spendSuccess', { amount: success.toFixed(2) })}
        </p>
      )}

      <h2 className="mb-2 text-base font-semibold">{t('campaign.selectSeforim')}</h2>
      <SeferPicker picked={picked} onChange={setPicked} />

      <Card className="mt-4">
        <h2 className="mb-2 text-base font-semibold">{t('institution.spendDedicationTitle')}</h2>
        <div className="space-y-2">
          <TextField label={t('neshama.name')} value={dedicationName} onChange={setDedicationName} />
          <TextField label={t('neshama.hebrewName')} value={dedicationHebrewName} onChange={setDedicationHebrewName} />
          <div>
            <p className={FIELD_LABEL_CLASS}>{t('neshama.namePrefixLabel')}</p>
            <BubbleGrid
              rows={2}
              options={NESHAMA_PREFIXES.map((option) => ({ value: option.value, label: `${option.en} · ${option.he}` }))}
              isSelected={(v) => dedicationNamePrefix === v}
              onToggle={(v) => setDedicationNamePrefix((prev) => (prev === v ? undefined : v))}
            />
            {dedicationNamePrefix === OTHER_PREFIX_VALUE && (
              <div className="mt-2">
                <TextField
                  label={t('neshama.customNamePrefixLabel')}
                  value={dedicationCustomNamePrefix}
                  onChange={setDedicationCustomNamePrefix}
                />
              </div>
            )}
          </div>
          <TextField
            label={t('neshama.fatherHebrewName')}
            value={dedicationFatherHebrewName}
            onChange={setDedicationFatherHebrewName}
          />
          {dedicationFatherHebrewName.trim() && (
            <div>
              <p className={FIELD_LABEL_CLASS}>{t('neshama.parentGenderLabel')}</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setDedicationParentGender('son')}
                  className={`flex-1 rounded-btn border px-3 py-2 text-sm font-medium ${
                    dedicationParentGender === 'son' ? 'border-accent bg-accent text-white' : 'border-border text-text-muted'
                  }`}
                >
                  {t('neshama.son')}
                </button>
                <button
                  type="button"
                  onClick={() => setDedicationParentGender('daughter')}
                  className={`flex-1 rounded-btn border px-3 py-2 text-sm font-medium ${
                    dedicationParentGender === 'daughter'
                      ? 'border-accent bg-accent text-white'
                      : 'border-border text-text-muted'
                  }`}
                >
                  {t('neshama.daughter')}
                </button>
              </div>
            </div>
          )}
        </div>
      </Card>

      <Card className="mt-4">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" checked={includeAd} onChange={(e) => setIncludeAd(e.target.checked)} />
          {t('donation.includeAd')}
        </label>
        {includeAd && (
          <div className="mt-3 space-y-2">
            <TextField
              label={t('donation.adBusinessName')}
              value={ad.businessName}
              onChange={(v) => setAd({ ...ad, businessName: v })}
            />
            <TextField
              label={t('donation.adMessagePlaceholder')}
              value={ad.message ?? ''}
              onChange={(v) => setAd({ ...ad, message: v })}
            />
          </div>
        )}
      </Card>

      <TextAreaField
        label={t('donation.message')}
        value={donorMessage}
        onChange={setDonorMessage}
        rows={3}
        containerClassName="mb-4 mt-4"
      />

      <Card>
        <p className="text-sm text-text-muted">{t('donation.total')}</p>
        <p className={`mb-1 text-lg font-bold ${overBudget ? 'text-error' : 'text-accent'}`}>${subtotal.toFixed(2)}</p>
        {overBudget && <p className="mb-3 text-xs text-error">{t('institution.insufficientBalance')}</p>}
        {error && <p className="mb-3 text-sm text-error">{error}</p>}
        <Button className="w-full" disabled={saving || picked.length === 0 || overBudget} onClick={handleSpend}>
          {t('institution.spendBalance')}
        </Button>
      </Card>
    </div>
  );
}
