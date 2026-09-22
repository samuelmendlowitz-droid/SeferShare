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
  /** Omit for a plain two-row bubble grid with no search bubble — for small,
   *  fixed option sets (e.g. a 3-value status filter, sort-by, group-by) where
   *  searching wouldn't help. Given, the grid grows to three rows to make room
   *  for the frozen search bubble. */
  search?: BubbleGridSearch;
  emptyMessage?: string;
  disabledValues?: Set<string>;
}

/** Every bubble — the search pill and every option pill alike — shares this
 *  sizing so none of them stretch to fill a grid column wider than their own
 *  content (CSS Grid's default is to stretch items to the column's width). */
const BUBBLE_CLASS = 'shrink-0 justify-self-start whitespace-nowrap rounded-pill px-3 py-1.5 text-sm font-medium';

/**
 * Rows of bubbles that scroll side to side — the shared layout for every
 * campaign/mokom/neshama/sefer picker in the app (and the Filter & Sort menu's
 * chip groups, including small ones like sort-by). A horizontal grid instead
 * of a wrapping list means the picker scrolls on its own axis, so it never
 * nests one scroll area inside another.
 *
 * When `search` is given, the top-start cell is a visually distinct pill
 * (search icon + "Search", same size as every other bubble) that expands
 * into a text filter in place; it stays pinned there (sticky) as the rest of
 * the grid keeps scrolling underneath it while you type. Groups small enough
 * that searching wouldn't help omit `search` and get two rows instead of three.
 */
export function BubbleGrid({ options, isSelected, onToggle, search, emptyMessage, disabledValues }: BubbleGridProps) {
  const { t } = useTranslation();
  const [searchExpanded, setSearchExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function collapseSearch() {
    search?.onQueryChange('');
    setSearchExpanded(false);
  }

  return (
    <div className={`grid grid-flow-col ${search ? 'grid-rows-3' : 'grid-rows-2'} gap-2 overflow-x-auto pb-1`}>
      {search &&
        (searchExpanded ? (
          <div
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
        ))}

      {options.length === 0 && <p className="self-center px-2 text-sm text-text-muted">{emptyMessage}</p>}

      {options.map((opt) => {
        const selected = isSelected(opt.value);
        const disabled = disabledValues?.has(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            disabled={disabled}
            onClick={() => onToggle(opt.value)}
            className={`${BUBBLE_CLASS} border transition-colors duration-200 disabled:opacity-40 ${
              selected
                ? 'border-accent bg-accent text-white'
                : 'border-border bg-surface text-text-muted hover:border-accent hover:text-accent'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
