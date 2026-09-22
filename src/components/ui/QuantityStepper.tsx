import { useTranslation } from 'react-i18next';
import { MinusIcon, PlusIcon } from './icons';

interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  className?: string;
}

/** The shared +/- quantity control used everywhere a donor adjusts how many
 *  copies of an item they want — the cart (PushkaPage), and picking seforim
 *  for a campaign or a targeted donation (SeferPicker). */
export function QuantityStepper({ value, onChange, min = 0, className = '' }: QuantityStepperProps) {
  const { t } = useTranslation();
  return (
    <div className={`flex shrink-0 items-center gap-1 rounded-btn border border-border ${className}`}>
      <button
        type="button"
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
        aria-label={t('pushka.decreaseQuantity') ?? ''}
        className="flex h-8 w-8 items-center justify-center text-text-muted disabled:opacity-30"
      >
        <MinusIcon width={14} height={14} />
      </button>
      <span className="w-6 text-center text-sm">{value}</span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        aria-label={t('pushka.increaseQuantity') ?? ''}
        className="flex h-8 w-8 items-center justify-center text-text-muted"
      >
        <PlusIcon width={14} height={14} />
      </button>
    </div>
  );
}
