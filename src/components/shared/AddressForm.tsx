import { useTranslation } from 'react-i18next';
import type { Address } from '../../types';

interface AddressFormProps {
  value: Address;
  onChange: (address: Address) => void;
}

export function AddressForm({ value, onChange }: AddressFormProps) {
  const { t } = useTranslation();

  function set<K extends keyof Address>(key: K, val: Address[K]) {
    onChange({ ...value, [key]: val });
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-text-muted">{t('campaign.shippingAddress')}</p>
      <input
        value={value.line1}
        onChange={(e) => set('line1', e.target.value)}
        placeholder="Address line 1"
        className="w-full rounded-btn border border-border px-3 py-2 text-sm"
      />
      <input
        value={value.line2 ?? ''}
        onChange={(e) => set('line2', e.target.value)}
        placeholder="Address line 2 (optional)"
        className="w-full rounded-btn border border-border px-3 py-2 text-sm"
      />
      <div className="flex gap-2">
        <input
          value={value.city}
          onChange={(e) => set('city', e.target.value)}
          placeholder="City"
          className="w-full rounded-btn border border-border px-3 py-2 text-sm"
        />
        <input
          value={value.state}
          onChange={(e) => set('state', e.target.value)}
          placeholder="State"
          className="w-full rounded-btn border border-border px-3 py-2 text-sm"
        />
      </div>
      <div className="flex gap-2">
        <input
          value={value.postalCode}
          onChange={(e) => set('postalCode', e.target.value)}
          placeholder="Postal code"
          className="w-full rounded-btn border border-border px-3 py-2 text-sm"
        />
        <input
          value={value.country}
          onChange={(e) => set('country', e.target.value)}
          placeholder="Country"
          className="w-full rounded-btn border border-border px-3 py-2 text-sm"
        />
      </div>
    </div>
  );
}
