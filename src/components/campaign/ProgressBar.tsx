interface ProgressBarProps {
  fulfilled: number;
  needed: number;
}

export function ProgressBar({ fulfilled, needed }: ProgressBarProps) {
  const pct = needed > 0 ? Math.min(100, Math.round((fulfilled / needed) * 100)) : 0;
  return (
    <div className="h-2 w-full overflow-hidden rounded-pill bg-bg">
      <div
        className="h-full rounded-pill bg-accent transition-all duration-250"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
