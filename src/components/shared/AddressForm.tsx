import { useTranslation } from 'react-i18next';
import type { Address } from '../../types';
import { TextField } from '../ui/TextField';

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
      <TextField label={t('address.line1')} value={value.line1} onChange={(v) => set('line1', v)} />
      <TextField label={t('address.line2')} value={value.line2 ?? ''} onChange={(v) => set('line2', v)} />
      <div className="flex gap-2">
        <TextField
          label={t('address.city')}
          value={value.city}
          onChange={(v) => set('city', v)}
          containerClassName="w-full"
        />
        <TextField
          label={t('address.state')}
          value={value.state}
          onChange={(v) => set('state', v)}
          containerClassName="w-full"
        />
      </div>
      <div className="flex gap-2">
        <TextField
          label={t('address.postalCode')}
          value={value.postalCode}
          onChange={(v) => set('postalCode', v)}
          containerClassName="w-full"
        />
        <TextField
          label={t('address.country')}
          value={value.country}
          onChange={(v) => set('country', v)}
          containerClassName="w-full"
        />
      </div>
    </div>
  );
}
