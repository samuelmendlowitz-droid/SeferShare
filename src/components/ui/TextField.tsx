import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';

/** Shared "faded dark blue" label style — sits above the field, never inside it,
 *  so the descriptor doesn't disappear once the donor starts typing. */
export const FIELD_LABEL_CLASS = 'mb-1 block text-xs font-medium text-accent/70';

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className' | 'value' | 'onChange'> {
  label: string;
  value: string;
  onChange: (value: string) => void;
  containerClassName?: string;
}

export function TextField({ label, value, onChange, containerClassName, ...rest }: TextFieldProps) {
  return (
    <div className={containerClassName}>
      <label className={FIELD_LABEL_CLASS}>{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-btn border border-border px-3 py-2 text-sm"
        {...rest}
      />
    </div>
  );
}

interface TextAreaFieldProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className' | 'value' | 'onChange'> {
  label: string;
  value: string;
  onChange: (value: string) => void;
  containerClassName?: string;
}

export function TextAreaField({ label, value, onChange, containerClassName, ...rest }: TextAreaFieldProps) {
  return (
    <div className={containerClassName}>
      <label className={FIELD_LABEL_CLASS}>{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-btn border border-border px-3 py-2 text-sm"
        {...rest}
      />
    </div>
  );
}

interface SelectFieldProps<T extends string> {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  containerClassName?: string;
}

export function SelectField<T extends string>({ label, value, onChange, options, containerClassName }: SelectFieldProps<T>) {
  return (
    <div className={containerClassName}>
      <label className={FIELD_LABEL_CLASS}>{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="w-full rounded-btn border border-border px-3 py-2 text-sm"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
