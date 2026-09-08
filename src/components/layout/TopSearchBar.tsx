import { useTranslation } from 'react-i18next';
import { CloseIcon, SearchIcon } from '../ui/icons';

interface TopSearchBarProps {
  query: string;
  onQueryChange: (query: string) => void;
  onClose: () => void;
}

/** Pinned to the top (not the bottom nav's spot) so the keyboard never covers it. */
export function TopSearchBar({ query, onQueryChange, onClose }: TopSearchBarProps) {
  const { t } = useTranslation();

  return (
    <div
      className="fixed inset-x-0 z-40 mx-auto flex max-w-2xl items-center gap-2 px-4"
      style={{ top: 'max(1rem, calc(env(safe-area-inset-top) + 0.5rem))' }}
    >
      <div className="flex h-11 flex-1 items-center gap-2 rounded-pill border border-border bg-surface px-3 shadow-card">
        <SearchIcon width={18} height={18} className="shrink-0 text-text-muted" />
        <input
          autoFocus
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={t('nav.searchPlaceholder') ?? ''}
          className="h-full min-w-0 flex-1 bg-transparent text-base text-text placeholder:text-text-muted focus:outline-none"
        />
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label={t('actions.cancel')}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface text-accent shadow-card transition-transform duration-200 hover:scale-105 active:scale-95"
      >
        <CloseIcon width={18} height={18} />
      </button>
    </div>
  );
}
