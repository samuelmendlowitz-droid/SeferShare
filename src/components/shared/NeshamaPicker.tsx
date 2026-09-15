import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { neshamaDedicationLine } from '../../lib/neshamaFormat';
import { useNeshamaSearch } from '../../hooks/useNeshamaSearch';
import { FilterSortSheet, type SortOption } from '../layout/FilterSortSheet';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { NeshamaCreateForm } from './NeshamaCreateForm';
import { FilterIcon, PlusIcon, CloseIcon, EditIcon } from '../ui/icons';

interface NeshamaPickerProps {
  /** Selected neshamaIds, in the order added — the first is the sticker default
   *  when the donor doesn't choose their own at checkout. */
  values: string[];
  onChange: (values: string[]) => void;
}

/** Multi-select: a campaign can carry any number of neshamas as optional add-ons. */
export function NeshamaPicker({ values, onChange }: NeshamaPickerProps) {
  const { t } = useTranslation();
  const { profile } = useAuth();
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
          const selected = values.includes(n.neshamaId);
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
                onClick={() => toggle(n.neshamaId)}
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
            onChange([...values, created.neshamaId]);
            setModalOpen(false);
          }}
        />
      </Modal>
    </div>
  );
}
