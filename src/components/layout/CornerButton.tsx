import type { ReactNode } from 'react';

interface CornerButtonProps {
  icon: ReactNode;
  onClick: () => void;
  label: string;
  badge?: number;
  /** Small text shown under the button (in addition to the aria-label) — for a
   *  button whose action changes with context (e.g. the Home page's create
   *  button), so it's clear what tapping it will do. */
  caption?: string;
}

/** Positioning is owned by the parent layout row — this is just the round button itself. */
export function CornerButton({ icon, onClick, label, badge, caption }: CornerButtonProps) {
  return (
    <div className="flex shrink-0 flex-col items-center gap-1">
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
      {caption && <span className="text-xs font-medium text-text-muted">{caption}</span>}
    </div>
  );
}
