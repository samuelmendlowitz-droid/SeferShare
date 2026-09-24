import type { ReactNode } from 'react';

interface CornerButtonProps {
  icon: ReactNode;
  onClick: () => void;
  label: string;
  /** When set, the button becomes a pill with this text next to the icon
   *  (instead of a bare round icon button) — for an action whose target
   *  changes with context (e.g. "+ Campaign"), so it's clear what tapping
   *  it will do without a separate label underneath. */
  caption?: string;
}

/** A floating action button — positioning is owned by the caller. Used for
 *  the per-page create action; the main nav and cart button live in the
 *  header instead (see AppLayout). */
export function CornerButton({ icon, onClick, label, caption }: CornerButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`flex h-12 shrink-0 items-center justify-center gap-1.5 rounded-full
        bg-accent text-white shadow-corner transition-transform duration-200
        hover:scale-105 active:scale-95 ${caption ? 'px-4' : 'w-12'}`}
    >
      {icon}
      {caption && <span className="whitespace-nowrap text-sm font-medium">{caption}</span>}
    </button>
  );
}
