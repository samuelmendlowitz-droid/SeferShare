import type { ReactNode } from 'react';

interface CornerButtonProps {
  icon: ReactNode;
  onClick: () => void;
  label: string;
  side: 'left' | 'right';
}

export function CornerButton({ icon, onClick, label, side }: CornerButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`fixed bottom-6 ${side === 'left' ? 'left-6' : 'right-6'} z-40
        flex h-12 w-12 items-center justify-center rounded-full
        bg-accent text-white shadow-corner transition-transform duration-200
        hover:scale-105 active:scale-95`}
    >
      {icon}
    </button>
  );
}
