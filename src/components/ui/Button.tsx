import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
}

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  const base = 'rounded-btn px-4 py-2.5 text-sm font-medium shadow-card transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';
  const styles =
    variant === 'primary'
      ? 'bg-accent text-white hover:bg-accent-soft'
      : 'bg-surface text-accent border border-accent hover:bg-bg';
  return <button className={`${base} ${styles} ${className}`} {...props} />;
}
