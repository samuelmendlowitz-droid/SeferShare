import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/Button';
import { CloseIcon } from '../ui/icons';

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterGroup {
  key: string;
  label: string;
  options: FilterOption[];
  /** Shows a text box above this group's chips that narrows them client-side
   *  by label — for a group with enough options (sefer types, institutions)
   *  that scanning for one gets tedious. */
  searchable?: boolean;
  searchPlaceholder?: string;
}

export interface SortOption {
  value: string;
  label: string;
}

export interface GroupOption {
  value: string;
  label: string;
}

interface FilterSortSheetProps {
  open: boolean;
  onClose: () => void;
  filterGroups: FilterGroup[];
  selectedFilters: Record<string, string[]>;
  onToggleFilter: (groupKey: string, value: string) => void;
  groupOptions?: GroupOption[];
  groupValue?: string;
  onGroupChange?: (value: string) => void;
  sortOptions: SortOption[];
  sortValue: string;
  onSortChange: (value: string) => void;
  onReset: () => void;
}

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-pill border px-3 py-1.5 text-sm font-medium transition-colors duration-200 ${
        active
          ? 'border-accent bg-accent text-white'
          : 'border-border bg-surface text-text-muted hover:border-accent hover:text-accent'
      }`}
    >
      {label}
    </button>
  );
}

/** Bottom sheet shared by every page that offers filter/sort — schema varies per page. */
export function FilterSortSheet({
  open,
  onClose,
  filterGroups,
  selectedFilters,
  onToggleFilter,
  groupOptions,
  groupValue,
  onGroupChange,
  sortOptions,
  sortValue,
  onSortChange,
  onReset,
}: FilterSortSheetProps) {
  const { t } = useTranslation();
  const [groupSearch, setGroupSearch] = useState<Record<string, string>>({});

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-text/40" onClick={onClose} />
      <div className="relative max-h-[80vh] overflow-y-auto rounded-t-card bg-surface p-4 shadow-navbar">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold">{t('actions.filterSort')}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('actions.cancel')}
            className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted hover:bg-bg"
          >
            <CloseIcon width={16} height={16} />
          </button>
        </div>

        {filterGroups.map((group) => {
          const query = (groupSearch[group.key] ?? '').trim().toLowerCase();
          const visibleOptions =
            group.searchable && query ? group.options.filter((opt) => opt.label.toLowerCase().includes(query)) : group.options;

          return (
            <div key={group.key} className="mb-4">
              <p className="mb-2 text-sm font-semibold text-text-muted">{group.label}</p>
              {group.searchable && (
                <input
                  type="text"
                  value={groupSearch[group.key] ?? ''}
                  onChange={(e) => setGroupSearch((prev) => ({ ...prev, [group.key]: e.target.value }))}
                  placeholder={group.searchPlaceholder}
                  className="mb-2 w-full rounded-btn border border-border px-3 py-2 text-sm"
                />
              )}
              <div className="flex flex-wrap gap-2">
                {visibleOptions.map((opt) => (
                  <Chip
                    key={opt.value}
                    label={opt.label}
                    active={(selectedFilters[group.key] ?? []).includes(opt.value)}
                    onClick={() => onToggleFilter(group.key, opt.value)}
                  />
                ))}
                {group.searchable && visibleOptions.length === 0 && (
                  <p className="text-xs text-text-muted">{t('actions.noResults')}</p>
                )}
              </div>
            </div>
          );
        })}

        {groupOptions && groupOptions.length > 0 && onGroupChange && (
          <div className="mb-4">
            <p className="mb-2 text-sm font-semibold text-text-muted">{t('actions.groupBy')}</p>
            <div className="flex flex-wrap gap-2">
              {groupOptions.map((opt) => (
                <Chip key={opt.value} label={opt.label} active={groupValue === opt.value} onClick={() => onGroupChange(opt.value)} />
              ))}
            </div>
          </div>
        )}

        {sortOptions.length > 0 && (
          <div className="mb-4">
            <p className="mb-2 text-sm font-semibold text-text-muted">{t('actions.sortBy')}</p>
            <div className="flex flex-wrap gap-2">
              {sortOptions.map((opt) => (
                <Chip key={opt.value} label={opt.label} active={sortValue === opt.value} onClick={() => onSortChange(opt.value)} />
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={onReset}>
            {t('actions.reset')}
          </Button>
          <Button className="flex-1" onClick={onClose}>
            {t('actions.done')}
          </Button>
        </div>
      </div>
    </div>
  );
}
