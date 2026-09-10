import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Neshama } from '../../types';
import { createNeshama, listNeshamos } from '../../services/neshamos';
import { FilterSortSheet, type SortOption } from '../layout/FilterSortSheet';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { FilterIcon, PlusIcon } from '../ui/icons';

type SortKey = 'recommended' | 'az' | 'za';

interface NeshamaPickerProps {
  value?: string;
  onChange: (neshamaId: string | undefined, neshama?: Neshama) => void;
}

export function NeshamaPicker({ value, onChange }: NeshamaPickerProps) {
  const { t } = useTranslation();
  const [neshamos, setNeshamos] = useState<Neshama[]>([]);
  const [query, setQuery] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('recommended');
  const [modalOpen, setModalOpen] = useState(false);

  const [name, setName] = useState('');
  const [hebrewName, setHebrewName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    listNeshamos().then(setNeshamos);
  }, []);

  const sortOptions: SortOption[] = [
    { value: 'recommended', label: t('filterSort.sortRecommended') },
    { value: 'az', label: t('filterSort.sortAZ') },
    { value: 'za', label: t('filterSort.sortZA') },
  ];

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = neshamos;
    if (q) {
      list = list.filter((n) => n.name.toLowerCase().includes(q) || n.hebrewName?.includes(q));
    }
    return [...list].sort((a, b) => {
      if (sortKey === 'az') return a.name.localeCompare(b.name);
      if (sortKey === 'za') return b.name.localeCompare(a.name);
      // recommended (default): least-dedicated-to neshamos surface first.
      return a.campaignCount - b.campaignCount;
    });
  }, [neshamos, query, sortKey]);

  const filtersActive = sortKey !== 'recommended';

  async function handleCreate() {
    if (!name) return;
    const id = await createNeshama({
      name,
      hebrewName: hebrewName || undefined,
      relationship: relationship || undefined,
      message: message || undefined,
    });
    const created: Neshama = { neshamaId: id, name, hebrewName, relationship, message, campaignCount: 0, createdAt: Date.now() };
    setNeshamos((prev) => [...prev, created]);
    onChange(id, created);
    setModalOpen(false);
    setName('');
    setHebrewName('');
    setRelationship('');
    setMessage('');
  }

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
          return (
            <button
              key={n.neshamaId}
              type="button"
              onClick={() => onChange(selected ? undefined : n.neshamaId, selected ? undefined : n)}
              className={`mb-1 flex w-full items-center justify-between rounded-btn px-3 py-2 text-left text-sm last:mb-0 ${
                selected ? 'bg-accent text-white' : 'hover:bg-bg'
              }`}
            >
              <span className="truncate">
                {n.name}
                {n.hebrewName ? ` · ${n.hebrewName}` : ''}
              </span>
            </button>
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
        onSortChange={(v) => setSortKey(v as SortKey)}
        onReset={() => setSortKey('recommended')}
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={t('neshama.addNew')}>
        <div className="space-y-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('neshama.name') ?? ''}
            className="w-full rounded-btn border border-border px-3 py-2 text-sm"
          />
          <input
            value={hebrewName}
            onChange={(e) => setHebrewName(e.target.value)}
            placeholder={t('neshama.hebrewName') ?? ''}
            className="w-full rounded-btn border border-border px-3 py-2 text-sm"
          />
          <input
            value={relationship}
            onChange={(e) => setRelationship(e.target.value)}
            placeholder={t('neshama.relationship') ?? ''}
            className="w-full rounded-btn border border-border px-3 py-2 text-sm"
          />
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t('neshama.message') ?? ''}
            className="w-full rounded-btn border border-border px-3 py-2 text-sm"
          />
          <Button className="w-full" disabled={!name} onClick={handleCreate}>
            {t('actions.add')}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
