import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'destructive';
}

const VARIANT_STYLES: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-accent text-white hover:bg-accent-soft',
  secondary: 'bg-surface text-accent border border-accent hover:bg-bg',
  destructive: 'bg-surface text-error border border-error hover:bg-error hover:text-white',
};

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  const base = 'rounded-btn px-4 py-2.5 text-sm font-medium shadow-card transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';
  return <button className={`${base} ${VARIANT_STYLES[variant]} ${className}`} {...props} />;
}
