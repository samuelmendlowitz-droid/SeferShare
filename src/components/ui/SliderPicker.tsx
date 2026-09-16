import { FIELD_LABEL_CLASS } from './TextField';

export interface SliderPickerOption {
  value: string;
  label: string;
}

interface SliderPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SliderPickerOption[];
  compact?: boolean;
}

/** A single-row, horizontally-scrollable strip of choices — a more compact
 *  alternative to a wrapping chip grid when there are several option pickers
 *  stacked in the same form (see StickerDesignEditor). */
export function SliderPicker({ label, value, onChange, options, compact }: SliderPickerProps) {
  return (
    <div>
      <p className={FIELD_LABEL_CLASS}>{label}</p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {options.map((opt) => {
          const selected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`shrink-0 whitespace-nowrap rounded-pill border font-medium transition-colors duration-200 ${
                compact ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm'
              } ${
                selected
                  ? 'border-accent bg-accent text-white'
                  : 'border-border bg-surface text-text-muted hover:border-accent hover:text-accent'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
