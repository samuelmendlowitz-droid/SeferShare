import { useTranslation } from 'react-i18next';
import type { Institution, Neshama } from '../../types';
import type { PickedItem } from './SeferPicker';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface VirtualDedicationCardProps {
  donorName: string;
  items: PickedItem[];
  neshama?: Neshama;
  institution?: Institution;
}

export function VirtualDedicationCard({ donorName, items, neshama, institution }: VirtualDedicationCardProps) {
  const { t } = useTranslation();

  return (
    <Card className="border-2 border-accent/20 bg-gradient-to-b from-surface to-bg text-center">
      <p className="text-xs uppercase tracking-wide text-text-muted">{t('app.name')}</p>
      <p className="mt-3 text-lg font-bold text-accent">{t('donation.confirmedTitle')}</p>

      {neshama && (
        <p className="mt-3 text-base font-semibold">
          {t('neshama.liluyNishmat')} {neshama.name}
          {neshama.hebrewName ? ` · ${neshama.hebrewName}` : ''}
        </p>
      )}
      {neshama?.message && <p className="mt-1 text-sm italic text-text-muted">"{neshama.message}"</p>}

      {institution && <p className="mt-2 text-sm text-text-muted">{institution.name}</p>}

      <div className="mt-4 space-y-1 text-left">
        {items.map((item) => (
          <p key={`${item.seferId}-${item.vendorId}`} className="text-sm">
            {item.quantity}× {item.englishName} · {item.hebrewName}
          </p>
        ))}
      </div>

      <p className="mt-4 text-sm text-text-muted">— {donorName}</p>

      <Button className="mt-4" onClick={() => navigator.share?.({ title: t('app.name') ?? '' })}>
        {t('donation.share')}
      </Button>
    </Card>
  );
}
