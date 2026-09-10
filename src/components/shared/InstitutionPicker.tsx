import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Address, Institution, InstitutionType } from '../../types';
import { INSTITUTION_TYPES } from '../../types';
import { createInstitution, listInstitutions } from '../../services/institutions';
import { listActiveCampaigns } from '../../services/campaigns';
import { useAuth } from '../../context/AuthContext';
import { FilterSortSheet, type FilterGroup, type SortOption } from '../layout/FilterSortSheet';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { AddressForm } from './AddressForm';
import { FilterIcon, PlusIcon } from '../ui/icons';

const EMPTY_ADDRESS: Address = { line1: '', city: '', state: '', postalCode: '', country: '' };

type SortKey = 'recommended' | 'az' | 'za';

interface InstitutionPickerProps {
  value?: string;
  onChange: (institutionId: string | undefined, institution?: Institution) => void;
}

export function InstitutionPicker({ value, onChange }: InstitutionPickerProps) {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [neediestByInstitution, setNeediestByInstitution] = useState<Map<string, number>>(new Map());
  const [query, setQuery] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<InstitutionType[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>('recommended');
  const [modalOpen, setModalOpen] = useState(false);

  const [name, setName] = useState('');
  const [hebrewName, setHebrewName] = useState('');
  const [type, setType] = useState<InstitutionType>('shul');
  const [address, setAddress] = useState<Address>(EMPTY_ADDRESS);

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

  async function handleCreate() {
    if (!profile || !name) return;
    const id = await createInstitution({
      name,
      hebrewName: hebrewName || undefined,
      type,
      address,
      createdByUid: profile.uid,
    });
    const created: Institution = { institutionId: id, name, hebrewName, type, address, createdByUid: profile.uid, createdAt: Date.now() };
    setInstitutions((prev) => [...prev, created]);
    onChange(id, created);
    setModalOpen(false);
    setName('');
    setHebrewName('');
    setAddress(EMPTY_ADDRESS);
  }

  function toggleTypeFilter(_groupKey: string, val: string) {
    setTypeFilter((prev) =>
      prev.includes(val as InstitutionType) ? prev.filter((v) => v !== val) : [...prev, val as InstitutionType],
    );
  }

  return (
    <div className="rounded-btn border border-border">
      <div className="flex items-center gap-2 border-b border-border p-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('institution.searchPlaceholder') ?? ''}
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
          aria-label={t('institution.addNew') ?? ''}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-btn bg-accent text-white"
        >
          <PlusIcon width={16} height={16} />
        </button>
      </div>

      <div className="max-h-56 overflow-y-auto p-2">
        {results.length === 0 && <p className="p-2 text-sm text-text-muted">{t('actions.noResults')}</p>}
        {results.map((inst) => {
          const selected = value === inst.institutionId;
          return (
            <button
              key={inst.institutionId}
              type="button"
              onClick={() => onChange(selected ? undefined : inst.institutionId, selected ? undefined : inst)}
              className={`mb-1 flex w-full items-center justify-between rounded-btn px-3 py-2 text-left text-sm last:mb-0 ${
                selected ? 'bg-accent text-white' : 'hover:bg-bg'
              }`}
            >
              <span className="truncate">
                {inst.name}
                {inst.hebrewName ? ` · ${inst.hebrewName}` : ''}
              </span>
              <span className={`shrink-0 text-xs ${selected ? 'text-white/80' : 'text-text-muted'}`}>
                {t(`institution.${inst.type}`)}
              </span>
            </button>
          );
        })}
      </div>

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
        <div className="space-y-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('institution.name') ?? ''}
            className="w-full rounded-btn border border-border px-3 py-2 text-sm"
          />
          <input
            value={hebrewName}
            onChange={(e) => setHebrewName(e.target.value)}
            placeholder={t('institution.hebrewName') ?? ''}
            className="w-full rounded-btn border border-border px-3 py-2 text-sm"
          />
          <select
            value={type}
            onChange={(e) => setType(e.target.value as InstitutionType)}
            className="w-full rounded-btn border border-border px-3 py-2 text-sm"
          >
            {INSTITUTION_TYPES.map((t2) => (
              <option key={t2} value={t2}>
                {t(`institution.${t2}`)}
              </option>
            ))}
          </select>
          <AddressForm value={address} onChange={setAddress} />
          <Button className="w-full" disabled={!name} onClick={handleCreate}>
            {t('actions.add')}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
