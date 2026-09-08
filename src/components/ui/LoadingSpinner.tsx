interface LoadingSpinnerProps {
  /** Centers within the full viewport height — for a page with no other chrome around it yet. */
  fullScreen?: boolean;
}

export function LoadingSpinner({ fullScreen = false }: LoadingSpinnerProps) {
  return (
    <div
      className={`flex items-center justify-center ${fullScreen ? 'min-h-dvh' : 'py-12'}`}
      role="status"
      aria-label="Loading"
    >
      <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-border border-t-accent" />
    </div>
  );
}
