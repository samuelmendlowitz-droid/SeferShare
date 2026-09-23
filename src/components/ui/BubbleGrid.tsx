import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SearchIcon, CloseIcon } from './icons';

export interface BubbleOption {
  value: string;
  label: string;
}

interface BubbleGridSearch {
  query: string;
  onQueryChange: (query: string) => void;
  placeholder?: string;
  /** aria-label for the collapsed search bubble — say what it searches, e.g. "Search neshamos". */
  label: string;
}

interface BubbleGridProps {
  options: BubbleOption[];
  isSelected: (value: string) => boolean;
  onToggle: (value: string) => void;
  /** Omit for a grid with no search bubble — for option sets where searching wouldn't help. */
  search?: BubbleGridSearch;
  emptyMessage?: string;
  disabledValues?: Set<string>;
  /** Pins the row count (1-3) instead of deriving it from the option count —
   *  for a picker whose row count is a deliberate design choice rather than
   *  a function of how many options it happens to have right now. */
  rows?: 1 | 2 | 3;
}

/** Every bubble — the search pill and every option pill alike — shares this
 *  sizing. Each row is its own independent flex line (not a shared CSS Grid
 *  column), so a short pill never gets stranded in a gap left by a long one
 *  two rows down — every bubble sits right up against its neighbor. */
const BUBBLE_CLASS = 'shrink-0 whitespace-nowrap rounded-pill px-3 py-1.5 text-sm font-medium';

/** The most pills a single row holds before the grid grows another row —
 *  keeps any one row's side-to-side scroll from getting long before the rest
 *  spreads onto a second (then third, the cap) row. */
const MAX_PER_ROW = 4;
const MAX_ROWS = 3;

/** How many rows (1-3) a given number of pills gets — just enough rows that
 *  no single row needs to hold more than MAX_PER_ROW, capped at MAX_ROWS. */
function rowCountFor(pillCount: number): number {
  for (let rows = 1; rows < MAX_ROWS; rows++) {
    if (pillCount <= MAX_PER_ROW * rows) return rows;
  }
  return MAX_ROWS;
}

type Slot = { kind: 'search' } | { kind: 'option'; option: BubbleOption };

/**
 * Rows of bubbles that scroll side to side — the shared layout for every
 * campaign/mokom/neshama/sefer picker in the app (and the Filter & Sort menu's
 * chip groups, including small ones like sort-by). Scrolling on its own axis
 * means the picker never nests one scroll area inside another.
 *
 * When `search` is given, the first slot is a visually distinct pill (search
 * icon + "Search", same size as every other bubble) that expands into a text
 * filter in place; it stays pinned there (sticky) as the rest keeps scrolling
 * underneath it while you type.
 */
export function BubbleGrid({
  options,
  isSelected,
  onToggle,
  search,
  emptyMessage,
  disabledValues,
  rows: rowsOverride,
}: BubbleGridProps) {
  const { t } = useTranslation();
  const [searchExpanded, setSearchExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function collapseSearch() {
    search?.onQueryChange('');
    setSearchExpanded(false);
  }

  const slots: Slot[] = [
    ...(search ? [{ kind: 'search' as const }] : []),
    ...options.map((option) => ({ kind: 'option' as const, option })),
  ];
  const rows = rowsOverride ?? rowCountFor(slots.length);
  // Fills column-first (slot i -> row i % rows), same reading order a CSS
  // grid with grid-auto-flow:column would give, but each row lays out
  // independently so it never inherits another row's column width.
  const rowSlots: Slot[][] = Array.from({ length: rows }, () => []);
  slots.forEach((slot, i) => rowSlots[i % rows].push(slot));

  function renderSlot(slot: Slot) {
    if (slot.kind === 'search') {
      if (!search) return null;
      return searchExpanded ? (
        <div
          key="search"
          className={`${BUBBLE_CLASS} sticky start-0 z-10 flex h-9 w-44 items-center gap-1.5 border-2 border-accent bg-surface ps-2.5 pe-1.5 shadow-card`}
        >
          <SearchIcon width={14} height={14} className="shrink-0 text-accent" />
          <input
            ref={inputRef}
            value={search.query}
            onChange={(e) => search.onQueryChange(e.target.value)}
            placeholder={search.placeholder}
            className="min-w-0 flex-1 bg-transparent text-sm outline-none"
          />
          <button
            type="button"
            onClick={collapseSearch}
            aria-label={t('actions.closeSearch') ?? ''}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-text-muted hover:bg-bg"
          >
            <CloseIcon width={12} height={12} />
          </button>
        </div>
      ) : (
        <button
          key="search"
          type="button"
          onClick={() => {
            setSearchExpanded(true);
            requestAnimationFrame(() => inputRef.current?.focus());
          }}
          aria-label={search.label}
          className={`${BUBBLE_CLASS} sticky start-0 z-10 flex items-center gap-1.5 bg-accent text-white shadow-card`}
        >
          <SearchIcon width={14} height={14} />
          {t('nav.search')}
        </button>
      );
    }

    const { option } = slot;
    const selected = isSelected(option.value);
    const disabled = disabledValues?.has(option.value);
    return (
      <button
        key={option.value}
        type="button"
        disabled={disabled}
        onClick={() => onToggle(option.value)}
        className={`${BUBBLE_CLASS} border transition-colors duration-200 disabled:opacity-40 ${
          selected
            ? 'border-accent bg-accent text-white'
            : 'border-border bg-surface text-text-muted hover:border-accent hover:text-accent'
        }`}
      >
        {option.label}
      </button>
    );
  }

  return (
    <div className="overflow-x-auto pb-1">
      <div className="flex flex-col gap-2">
        {rowSlots.map((rowItems, rowIdx) => (
          <div key={rowIdx} className="flex items-center gap-2">
            {rowItems.map(renderSlot)}
            {rowIdx === 0 && options.length === 0 && (
              <p className="whitespace-nowrap px-2 text-sm text-text-muted">{emptyMessage}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
