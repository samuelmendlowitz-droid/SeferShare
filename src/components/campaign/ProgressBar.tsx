interface ProgressBarProps {
  fulfilled: number;
  needed: number;
  /** Overrides the fill color — a campaign's chosen color theme (see
   *  lib/campaignTheme.ts). Omitted, it falls back to the default accent class. */
  colorHex?: string;
}

export function ProgressBar({ fulfilled, needed, colorHex }: ProgressBarProps) {
  const pct = needed > 0 ? Math.min(100, Math.round((fulfilled / needed) * 100)) : 0;
  return (
    <div className="h-2 w-full overflow-hidden rounded-pill bg-bg">
      <div
        className={`h-full rounded-pill transition-all duration-250 ${colorHex ? '' : 'bg-accent'}`}
        style={{ width: `${pct}%`, ...(colorHex ? { backgroundColor: colorHex } : {}) }}
      />
    </div>
  );
}
