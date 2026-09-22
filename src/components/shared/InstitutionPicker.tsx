import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Institution, InstitutionType } from '../../types';
import { INSTITUTION_TYPES } from '../../types';
import { listInstitutions } from '../../services/institutions';
import { listActiveCampaigns } from '../../services/campaigns';
import { FilterSortSheet, type FilterGroup, type SortOption } from '../layout/FilterSortSheet';
import { BubbleGrid } from '../ui/BubbleGrid';
import { Modal } from '../ui/Modal';
import { InstitutionCreateForm } from './InstitutionCreateForm';
import { FilterIcon, PlusIcon } from '../ui/icons';

type SortKey = 'recommended' | 'az' | 'za';

interface InstitutionPickerProps {
  value?: string;
  onChange: (institutionId: string | undefined, institution?: Institution) => void;
}

export function InstitutionPicker({ value, onChange }: InstitutionPickerProps) {
  const { t } = useTranslation();
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [neediestByInstitution, setNeediestByInstitution] = useState<Map<string, number>>(new Map());
  const [query, setQuery] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<InstitutionType[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>('recommended');
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    listInstitutions().then(setInstitutions);
    listActiveCampaigns().then((campaigns) => {
      const map = new Map<string, number>();
      for (const c of campaigns) {
        if (!c.institutionId) continue;
        const cur = map.get(c.institutionId);
        if (cur === undefined || c.lastProgressAt < cur) map.set(c.institutionId, c.lastProgressAt);
      }
      setNeediestByInstitution(map);
    });
  }, []);

  const filterGroups: FilterGroup[] = [
    {
      key: 'type',
      label: t('filterSort.filterByInstitutionType'),
      options: INSTITUTION_TYPES.map((t2) => ({ value: t2, label: t(`institution.${t2}`) })),
    },
  ];
  const sortOptions: SortOption[] = [
    { value: 'recommended', label: t('filterSort.sortRecommended') },
    { value: 'az', label: t('filterSort.sortAZ') },
    { value: 'za', label: t('filterSort.sortZA') },
  ];

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = institutions;
    if (q) {
      list = list.filter((i) => i.name.toLowerCase().includes(q) || i.hebrewName?.includes(q));
    }
    if (typeFilter.length > 0) {
      list = list.filter((i) => typeFilter.includes(i.type));
    }
    return [...list].sort((a, b) => {
      if (sortKey === 'az') return a.name.localeCompare(b.name);
      if (sortKey === 'za') return b.name.localeCompare(a.name);
      // recommended (default): institutions whose campaigns have gone longest without
      // progress surface first; institutions with no active campaign yet come first of all.
      const an = neediestByInstitution.get(a.institutionId) ?? 0;
      const bn = neediestByInstitution.get(b.institutionId) ?? 0;
      return an - bn;
    });
  }, [institutions, query, typeFilter, sortKey, neediestByInstitution]);

  const filtersActive = typeFilter.length > 0 || sortKey !== 'recommended';

  function handleCreate(created: Institution) {
    setInstitutions((prev) => [...prev, created]);
    onChange(created.institutionId, created);
    setModalOpen(false);
  }

  function toggleTypeFilter(_groupKey: string, val: string) {
    setTypeFilter((prev) =>
      prev.includes(val as InstitutionType) ? prev.filter((v) => v !== val) : [...prev, val as InstitutionType],
    );
  }

  return (
    <div className="rounded-btn border border-border p-2">
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
          aria-label={t('institution.addNew') ?? ''}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-btn bg-accent text-white"
        >
          <PlusIcon width={16} height={16} />
        </button>
      </div>

      <BubbleGrid
        options={results.map((inst) => ({
          value: inst.institutionId,
          label: inst.hebrewName ? `${inst.name} · ${inst.hebrewName}` : inst.name,
        }))}
        isSelected={(id) => value === id}
        onToggle={(id) => {
          const inst = results.find((i) => i.institutionId === id);
          onChange(value === id ? undefined : id, value === id ? undefined : inst);
        }}
        emptyMessage={t('actions.noResults') ?? ''}
        search={{
          query,
          onQueryChange: setQuery,
          placeholder: t('institution.searchPlaceholder') ?? '',
          label: t('institution.searchPlaceholder') ?? '',
        }}
      />

      <FilterSortSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        filterGroups={filterGroups}
        selectedFilters={{ type: typeFilter }}
        onToggleFilter={toggleTypeFilter}
        sortOptions={sortOptions}
        sortValue={sortKey}
        onSortChange={(v) => setSortKey(v as SortKey)}
        onReset={() => {
          setTypeFilter([]);
          setSortKey('recommended');
        }}
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={t('institution.addNew')}>
        <InstitutionCreateForm onCreated={handleCreate} />
      </Modal>
    </div>
  );
}
