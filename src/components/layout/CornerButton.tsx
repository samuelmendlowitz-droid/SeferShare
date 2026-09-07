import type { ReactNode } from 'react';

interface CornerButtonProps {
  icon: ReactNode;
  onClick: () => void;
  label: string;
}

/** Positioning is owned by the parent layout row — this is just the round button itself. */
export function CornerButton({ icon, onClick, label }: CornerButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full
        bg-accent text-white shadow-corner transition-transform duration-200
        hover:scale-105 active:scale-95"
    >
      {icon}
    </button>
  );
}
