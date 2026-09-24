import type { ReactNode } from 'react';

interface CornerButtonProps {
  icon: ReactNode;
  onClick: () => void;
  label: string;
  badge?: number;
  /** When set, the button becomes a pill with this text next to the icon
   *  (instead of a bare round icon button) — for an action whose target
   *  changes with context (e.g. the Home page's create button), so it's
   *  clear what tapping it will do without a separate label underneath. */
  caption?: string;
  /** False renders a lighter, outlined style instead of the solid accent fill —
   *  for the main destination row, where every page shows all 4 tabs and only
   *  the current one should read as "selected." Defaults to true (the original
   *  always-solid look), so every other call site is unaffected. */
  active?: boolean;
}

/** Positioning is owned by the parent layout row — this is just the button itself,
 *  either a round icon button or (with `caption`) a same-height pill with a label. */
export function CornerButton({ icon, onClick, label, badge, caption, active = true }: CornerButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`relative flex h-12 shrink-0 items-center justify-center gap-1.5 rounded-full
        shadow-corner transition-transform duration-200
        hover:scale-105 active:scale-95 ${caption ? 'px-4' : 'w-12'} ${
          active ? 'bg-accent text-white' : 'border border-border bg-surface text-text-muted'
        }`}
    >
      {icon}
      {caption && <span className="whitespace-nowrap text-sm font-medium">{caption}</span>}
      {Boolean(badge) && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-error px-1 text-xs font-bold text-white">
          {badge}
        </span>
      )}
    </button>
  );
}
