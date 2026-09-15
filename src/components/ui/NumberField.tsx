import { useEffect, useState } from 'react';
import { FIELD_LABEL_CLASS } from './TextField';

interface NumberFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  /** Shows a $ prefix and allows decimals (cents) — set for any money amount. */
  money?: boolean;
  required?: boolean;
  disabled?: boolean;
  containerClassName?: string;
}

/**
 * A numeric text box that brings up the phone's number pad (via inputMode) and
 * strips anything but digits (and a single decimal point for money) as you type.
 *
 * Deliberately NOT `type="number"`: that invites the browser's own spinner/`e`
 * notation quirks, and — the important part — while the field is transiently
 * empty (e.g. you just backspaced the default "0"), we hold that empty string in
 * local state and skip calling `onChange` rather than immediately coercing it to
 * 0 and forcing the input's value back. Forcing a controlled value while a mobile
 * keyboard is mid-edit is exactly what makes the number pad dismiss itself; only
 * `onBlur` clamps/commits back to a real number.
 */
export function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  money = false,
  required,
  disabled,
  containerClassName,
}: NumberFieldProps) {
  const [text, setText] = useState(String(value));

  // Sync from external changes (e.g. loading a different record) — but only
  // when the value didn't just come from this field's own onChange, since
  // effect deps only track `value`, not `text`, this won't fight live typing.
  useEffect(() => {
    setText(String(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    let raw = e.target.value.replace(money ? /[^0-9.]/g : /[^0-9]/g, '');
    if (money) {
      const firstDot = raw.indexOf('.');
      if (firstDot !== -1) {
        raw = raw.slice(0, firstDot + 1) + raw.slice(firstDot + 1).replace(/\./g, '');
      }
    }
    setText(raw);
    if (raw === '' || raw === '.') return;
    const parsed = Number(raw);
    if (!Number.isNaN(parsed)) onChange(parsed);
  }

  function handleBlur() {
    let parsed = Number(text);
    if (text === '' || Number.isNaN(parsed)) parsed = min ?? 0;
    if (min !== undefined) parsed = Math.max(min, parsed);
    if (max !== undefined) parsed = Math.min(max, parsed);
    setText(String(parsed));
    if (parsed !== value) onChange(parsed);
  }

  return (
    <div className={containerClassName}>
      <label className={FIELD_LABEL_CLASS}>{label}</label>
      <div className="relative">
        {money && (
          <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-sm text-text-muted">
            $
          </span>
        )}
        <input
          type="text"
          inputMode={money ? 'decimal' : 'numeric'}
          pattern={money ? '[0-9]*\\.?[0-9]*' : '[0-9]*'}
          value={text}
          onChange={handleChange}
          onBlur={handleBlur}
          required={required}
          disabled={disabled}
          className={`w-full rounded-btn border border-border py-2 text-sm ${money ? 'ps-6 pe-3' : 'px-3'}`}
        />
      </div>
    </div>
  );
}
