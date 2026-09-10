import type { ReactNode } from 'react';

interface CornerButtonProps {
  icon: ReactNode;
  onClick: () => void;
  label: string;
  badge?: number;
}

/** Positioning is owned by the parent layout row — this is just the round button itself. */
export function CornerButton({ icon, onClick, label, badge }: CornerButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full
        bg-accent text-white shadow-corner transition-transform duration-200
        hover:scale-105 active:scale-95"
    >
      {icon}
      {Boolean(badge) && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-error px-1 text-xs font-bold text-white">
          {badge}
        </span>
      )}
    </button>
  );
}
