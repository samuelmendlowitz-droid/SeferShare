import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../context/LanguageContext';
import { neshamaDedicationLine } from '../../lib/neshamaFormat';
import { useNeshamaSearch } from '../../hooks/useNeshamaSearch';
import { FilterSortSheet, type SortOption } from '../layout/FilterSortSheet';
import { BubbleGrid } from '../ui/BubbleGrid';
import { Modal } from '../ui/Modal';
import { NeshamaCreateForm } from './NeshamaCreateForm';
import { FilterIcon, PlusIcon, CloseIcon } from '../ui/icons';

interface NeshamaPickerProps {
  /** Selected neshamaIds, in the order added — the first is the sticker default
   *  when the donor doesn't choose their own at checkout. */
  values: string[];
  onChange: (values: string[]) => void;
}

/** Multi-select: a campaign can carry any number of neshamas as optional add-ons. */
export function NeshamaPicker({ values, onChange }: NeshamaPickerProps) {
  const { t } = useTranslation();
  const { showBilingual } = useLanguage();
  const { neshamos, query, setQuery, sortKey, setSortKey, results, addCreated } = useNeshamaSearch();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const sortOptions: SortOption[] = [
    { value: 'recommended', label: t('filterSort.sortRecommended') },
    { value: 'az', label: t('filterSort.sortAZ') },
    { value: 'za', label: t('filterSort.sortZA') },
  ];
  const filtersActive = sortKey !== 'recommended';

  function toggle(neshamaId: string) {
    onChange(values.includes(neshamaId) ? values.filter((id) => id !== neshamaId) : [...values, neshamaId]);
  }

  const selectedNeshamas = values.map((id) => neshamos.find((n) => n.neshamaId === id)).filter((n) => n != null);

  return (
    <div className="rounded-btn border border-border">
      {selectedNeshamas.length > 0 && (
        <div className="flex flex-wrap gap-2 border-b border-border p-2">
          {selectedNeshamas.map((n, idx) => (
            <span
              key={n.neshamaId}
              className="flex items-center gap-1 rounded-pill bg-accent px-3 py-1.5 text-xs font-medium text-white"
            >
              {idx === 0 && <span className="opacity-80">{t('neshama.stickerDefault')} · </span>}
              {n.name}
              <button type="button" onClick={() => toggle(n.neshamaId)} aria-label={t('actions.delete') ?? ''}>
                <CloseIcon width={12} height={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="p-2">
        <div className="mb-2 flex items-center justify-end gap-2">
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
          isSelected={(id) => values.includes(id)}
          onToggle={toggle}
          emptyMessage={t('actions.noResults') ?? ''}
          search={{
            query,
            onQueryChange: setQuery,
            placeholder: t('neshama.searchPlaceholder') ?? '',
            label: t('neshama.searchPlaceholder') ?? '',
          }}
        />
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
            onChange([...values, created.neshamaId]);
            setModalOpen(false);
          }}
        />
      </Modal>
    </div>
  );
}
