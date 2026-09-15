import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { neshamaDedicationLine } from '../../lib/neshamaFormat';
import { useNeshamaSearch } from '../../hooks/useNeshamaSearch';
import type { Neshama } from '../../types';
import { FilterSortSheet, type SortOption } from '../layout/FilterSortSheet';
import { Modal } from '../ui/Modal';
import { NeshamaCreateForm } from '../shared/NeshamaCreateForm';
import { FilterIcon, PlusIcon, EditIcon } from '../ui/icons';

interface CartDedicationPickerProps {
  value?: string;
  onChange: (neshamaId: string | undefined, neshama?: Neshama) => void;
}

/** Single-select neshama picker for the pushka's one cart-wide dedication. */
export function CartDedicationPicker({ value, onChange }: CartDedicationPickerProps) {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { showBilingual } = useLanguage();
  const { query, setQuery, sortKey, setSortKey, results, addCreated } = useNeshamaSearch();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const sortOptions: SortOption[] = [
    { value: 'recommended', label: t('filterSort.sortRecommended') },
    { value: 'az', label: t('filterSort.sortAZ') },
    { value: 'za', label: t('filterSort.sortZA') },
  ];
  const filtersActive = sortKey !== 'recommended';

  return (
    <div className="rounded-btn border border-border">
      <div className="flex items-center gap-2 border-b border-border p-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('neshama.searchPlaceholder') ?? ''}
          className="min-w-0 flex-1 rounded-btn border border-border px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          aria-label={t('actions.filterSort') ?? ''}
          className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-btn border border-border ${
            filtersActive ? 'text-accent' : 'text-text-muted'
          }`}
        >
          <FilterIcon width={16} height={16} />
          {filtersActive && <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-accent" />}
        </button>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          aria-label={t('neshama.addNew') ?? ''}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-btn bg-accent text-white"
        >
          <PlusIcon width={16} height={16} />
        </button>
      </div>

      <div className="max-h-56 overflow-y-auto p-2">
        {results.length === 0 && <p className="p-2 text-sm text-text-muted">{t('actions.noResults')}</p>}
        {results.map((n) => {
          const selected = value === n.neshamaId;
          const isOwn = n.createdByUid === profile?.uid;
          return (
            <div
              key={n.neshamaId}
              className={`mb-1 flex w-full items-center justify-between rounded-btn text-sm last:mb-0 ${
                selected ? 'bg-accent text-white' : 'hover:bg-bg'
              }`}
            >
              <button
                type="button"
                onClick={() => onChange(selected ? undefined : n.neshamaId, selected ? undefined : n)}
                className="min-w-0 flex-1 truncate px-3 py-2 text-left"
              >
                {neshamaDedicationLine(n, showBilingual)}
              </button>
              {isOwn && (
                <a
                  href={`/neshamos/${n.neshamaId}/edit`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t('neshama.edit') ?? ''}
                  onClick={(e) => e.stopPropagation()}
                  className={`flex h-9 w-9 shrink-0 items-center justify-center ${
                    selected ? 'text-white/80' : 'text-text-muted hover:text-accent'
                  }`}
                >
                  <EditIcon width={16} height={16} />
                </a>
              )}
            </div>
          );
        })}
      </div>

      <FilterSortSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        filterGroups={[]}
        selectedFilters={{}}
        onToggleFilter={() => {}}
        sortOptions={sortOptions}
        sortValue={sortKey}
        onSortChange={(v) => setSortKey(v as typeof sortKey)}
        onReset={() => setSortKey('recommended')}
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={t('neshama.addNew')}>
        <NeshamaCreateForm
          onCreated={(created) => {
            addCreated(created);
            onChange(created.neshamaId, created);
            setModalOpen(false);
          }}
        />
      </Modal>
    </div>
  );
}
