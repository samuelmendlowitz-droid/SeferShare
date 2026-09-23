import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../context/LanguageContext';
import { neshamaDedicationLine } from '../../lib/neshamaFormat';
import { useNeshamaSearch } from '../../hooks/useNeshamaSearch';
import type { Neshama } from '../../types';
import { FilterSortSheet, type SortOption } from '../layout/FilterSortSheet';
import { BubbleGrid } from '../ui/BubbleGrid';
import { Modal } from '../ui/Modal';
import { NeshamaCreateForm } from '../shared/NeshamaCreateForm';
import { FilterIcon, PlusIcon } from '../ui/icons';

interface CartDedicationPickerProps {
  value?: string;
  onChange: (neshamaId: string | undefined, neshama?: Neshama) => void;
}

/** Single-select neshama picker for the pushka's one cart-wide dedication. */
export function CartDedicationPicker({ value, onChange }: CartDedicationPickerProps) {
  const { t } = useTranslation();
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
    <div className="rounded-btn border border-border p-2">
      <div className="mb-2 flex items-center gap-2">
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

      <BubbleGrid
        options={results.map((n) => ({ value: n.neshamaId, label: neshamaDedicationLine(n, showBilingual) }))}
        isSelected={(id) => value === id}
        onToggle={(id) => {
          const n = results.find((r) => r.neshamaId === id);
          onChange(value === id ? undefined : id, value === id ? undefined : n);
        }}
        emptyMessage={t('actions.noResults') ?? ''}
      />

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
