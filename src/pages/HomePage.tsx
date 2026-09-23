import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { listInstitutions } from '../services/institutions';
import { AppLayout, type HomeFilter } from '../components/layout/AppLayout';
import { FilterSortSheet, type FilterGroup, type SortOption } from '../components/layout/FilterSortSheet';
import { CampaignCard } from '../components/campaign/CampaignCard';
import { InstitutionSummaryCard } from '../components/home/InstitutionSummaryCard';
import { NeshamaSummaryCard } from '../components/home/NeshamaSummaryCard';
import { SeforimShopList } from '../components/home/SeforimShopList';
import { CampaignCreateForm } from '../components/shared/CampaignCreateForm';
import { InstitutionCreateForm } from '../components/shared/InstitutionCreateForm';
import { NeshamaCreateForm } from '../components/shared/NeshamaCreateForm';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Modal } from '../components/ui/Modal';
import { useCampaignFeed, type HomeSortKey } from '../hooks/useCampaignFeed';
import { useMekomosFeed, type MekomosSortKey } from '../hooks/useMekomosFeed';
import { useNeshamosFeed, type NeshamosSortKey } from '../hooks/useNeshamosFeed';
import { useSeforimShopFeed, type SeforimShopSortKey } from '../hooks/useSeforimShopFeed';
import { INSTITUTION_TYPES, SEFER_TYPES, type Institution, type InstitutionType, type SeferType } from '../types';

function toggleValue<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function HomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const navigationState = location.state as { tab?: HomeFilter } | null;
  const [filter, setFilter] = useState<HomeFilter>(navigationState?.tab ?? 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [createInstitutionOpen, setCreateInstitutionOpen] = useState(false);
  const [createNeshamaOpen, setCreateNeshamaOpen] = useState(false);
  const [createCampaignOpen, setCreateCampaignOpen] = useState(false);

  // All Campaigns tab
  const [allInstitutionTypes, setAllInstitutionTypes] = useState<InstitutionType[]>([]);
  const [allSeferTypes, setAllSeferTypes] = useState<SeferType[]>([]);
  const [allSort, setAllSort] = useState<HomeSortKey>('recommended');
  const allFeed = useCampaignFeed(searchQuery, {
    institutionTypes: allInstitutionTypes,
    seferTypes: allSeferTypes,
    sortKey: allSort,
  });

  // Mekomos tab: institutions currently running campaigns
  const [mekomosInstitutionTypes, setMekomosInstitutionTypes] = useState<InstitutionType[]>([]);
  const [mekomosSort, setMekomosSort] = useState<MekomosSortKey>('name-az');
  const mekomosFeed = useMekomosFeed(searchQuery, {
    institutionTypes: mekomosInstitutionTypes,
    sortKey: mekomosSort,
  });

  // Neshamas tab: every neshama in the system
  const [neshamosSeferTypes, setNeshamosSeferTypes] = useState<SeferType[]>([]);
  const [neshamosSort, setNeshamosSort] = useState<NeshamosSortKey>('recommended');
  const neshamosFeed = useNeshamosFeed(searchQuery, {
    seferTypes: neshamosSeferTypes,
    sortKey: neshamosSort,
  });

  // Seforim tab: a shopping-style browse of the whole catalog
  const [seforimSeferTypes, setSeforimSeferTypes] = useState<SeferType[]>([]);
  const [seforimInstitutionIds, setSeforimInstitutionIds] = useState<string[]>([]);
  const [seforimSort, setSeforimSort] = useState<SeforimShopSortKey>('most-requested');
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const seforimFeed = useSeforimShopFeed(searchQuery, {
    seferTypes: seforimSeferTypes,
    institutionIds: seforimInstitutionIds,
    sortKey: seforimSort,
    translateSeferType: (type) => t(`sefer.${type}`),
  });

  useEffect(() => {
    listInstitutions().then(setInstitutions);
  }, []);

  const institutionTypeFilterGroup: FilterGroup = {
    key: 'institutionType',
    label: t('filterSort.filterByInstitutionType'),
    options: INSTITUTION_TYPES.map((type) => ({ value: type, label: t(`institution.${type}`) })),
  };
  const seferTypeFilterGroup: FilterGroup = {
    key: 'seferType',
    label: t('filterSort.filterBySeferType'),
    options: SEFER_TYPES.map((type) => ({ value: type, label: t(`sefer.${type}`) })),
    searchable: true,
    searchPlaceholder: t('filterSort.searchSeferTypes') ?? undefined,
  };
  const seforimInstitutionFilterGroup: FilterGroup = {
    key: 'institution',
    label: t('filterSort.filterByInstitution'),
    options: institutions.map((inst) => ({ value: inst.institutionId, label: inst.name })),
    searchable: true,
    searchPlaceholder: t('filterSort.searchInstitutions') ?? undefined,
  };
  const nameAndSizeSortOptions: SortOption[] = [
    { value: 'name-az', label: t('filterSort.sortNameAZ') },
    { value: 'size', label: t('filterSort.sortCampaignSize') },
  ];

  const sheetsByTab: Record<
    HomeFilter,
    {
      filterGroups: FilterGroup[];
      selectedFilters: Record<string, string[]>;
      onToggleFilter: (groupKey: string, value: string) => void;
      sortOptions: SortOption[];
      sortValue: string;
      onSortChange: (value: string) => void;
      onReset: () => void;
      active: boolean;
    }
  > = {
    all: {
      filterGroups: [institutionTypeFilterGroup, seferTypeFilterGroup],
      selectedFilters: { institutionType: allInstitutionTypes, seferType: allSeferTypes },
      onToggleFilter: (groupKey, value) => {
        if (groupKey === 'institutionType') setAllInstitutionTypes((prev) => toggleValue(prev, value as InstitutionType));
        else if (groupKey === 'seferType') setAllSeferTypes((prev) => toggleValue(prev, value as SeferType));
      },
      sortOptions: [
        { value: 'recommended', label: t('filterSort.sortRecommended') },
        { value: 'institution-az', label: t('filterSort.sortInstitutionAZ') },
        { value: 'neshama-az', label: t('filterSort.sortNeshamaAZ') },
        { value: 'sefer-az', label: t('filterSort.sortSeferAZ') },
      ],
      sortValue: allSort,
      onSortChange: (v) => setAllSort(v as HomeSortKey),
      onReset: () => {
        setAllInstitutionTypes([]);
        setAllSeferTypes([]);
        setAllSort('recommended');
      },
      active: allInstitutionTypes.length > 0 || allSeferTypes.length > 0 || allSort !== 'recommended',
    },
    where: {
      filterGroups: [institutionTypeFilterGroup],
      selectedFilters: { institutionType: mekomosInstitutionTypes },
      onToggleFilter: (groupKey, value) => {
        if (groupKey === 'institutionType')
          setMekomosInstitutionTypes((prev) => toggleValue(prev, value as InstitutionType));
      },
      sortOptions: nameAndSizeSortOptions,
      sortValue: mekomosSort,
      onSortChange: (v) => setMekomosSort(v as MekomosSortKey),
      onReset: () => {
        setMekomosInstitutionTypes([]);
        setMekomosSort('name-az');
      },
      active: mekomosInstitutionTypes.length > 0 || mekomosSort !== 'name-az',
    },
    who: {
      filterGroups: [seferTypeFilterGroup],
      selectedFilters: { seferType: neshamosSeferTypes },
      onToggleFilter: (groupKey, value) => {
        if (groupKey === 'seferType') setNeshamosSeferTypes((prev) => toggleValue(prev, value as SeferType));
      },
      sortOptions: [
        { value: 'recommended', label: t('filterSort.sortRecommended') },
        { value: 'name-az', label: t('filterSort.sortNameAZ') },
      ],
      sortValue: neshamosSort,
      onSortChange: (v) => setNeshamosSort(v as NeshamosSortKey),
      onReset: () => {
        setNeshamosSeferTypes([]);
        setNeshamosSort('recommended');
      },
      active: neshamosSeferTypes.length > 0 || neshamosSort !== 'recommended',
    },
    what: {
      filterGroups: [seferTypeFilterGroup, seforimInstitutionFilterGroup],
      selectedFilters: { seferType: seforimSeferTypes, institution: seforimInstitutionIds },
      onToggleFilter: (groupKey, value) => {
        if (groupKey === 'seferType') setSeforimSeferTypes((prev) => toggleValue(prev, value as SeferType));
        else if (groupKey === 'institution') setSeforimInstitutionIds((prev) => toggleValue(prev, value));
      },
      sortOptions: [
        { value: 'most-requested', label: t('filterSort.sortMostRequested') },
        { value: 'price-high', label: t('filterSort.sortPriceHighLow') },
        { value: 'price-low', label: t('filterSort.sortPriceLowHigh') },
        { value: 'type-az', label: t('filterSort.sortTypeAZ') },
        { value: 'name-az', label: t('filterSort.sortNameAZ') },
      ],
      sortValue: seforimSort,
      onSortChange: (v) => setSeforimSort(v as SeforimShopSortKey),
      onReset: () => {
        setSeforimSeferTypes([]);
        setSeforimInstitutionIds([]);
        setSeforimSort('most-requested');
      },
      active: seforimSeferTypes.length > 0 || seforimInstitutionIds.length > 0 || seforimSort !== 'most-requested',
    },
  };

  const currentSheet = sheetsByTab[filter];

  const createActionByTab: Partial<Record<HomeFilter, { caption: string; onClick: () => void }>> = {
    all: { caption: t('nav.newCampaign'), onClick: () => setCreateCampaignOpen(true) },
    where: { caption: t('nav.newMokom'), onClick: () => setCreateInstitutionOpen(true) },
    who: { caption: t('nav.newNeshama'), onClick: () => setCreateNeshamaOpen(true) },
  };

  return (
    <>
      <AppLayout
        variant="home"
        filter={filter}
        onFilterChange={setFilter}
        onSearch={setSearchQuery}
        filterSort={{ active: currentSheet.active, onClick: () => setSheetOpen(true) }}
        createAction={createActionByTab[filter]}
      >
        {filter === 'all' &&
          (allFeed.loading ? (
            <LoadingSpinner />
          ) : allFeed.campaigns.length === 0 ? (
            <p className="text-text-muted">{t('home.empty')}</p>
          ) : (
            allFeed.campaigns.map((campaign) => (
              <CampaignCard
                key={campaign.campaignId}
                campaign={campaign}
                institution={allFeed.institutionsById.get(campaign.institutionId)}
                neshamas={(campaign.neshamaIds ?? [])
                  .map((id) => allFeed.neshamosById.get(id))
                  .filter((n): n is NonNullable<typeof n> => Boolean(n))}
                sefarimById={allFeed.sefarimById}
              />
            ))
          ))}

        {filter === 'where' &&
          (mekomosFeed.loading ? (
            <LoadingSpinner />
          ) : mekomosFeed.institutions.length === 0 ? (
            <p className="text-text-muted">{t('home.mekomosEmpty')}</p>
          ) : (
            mekomosFeed.institutions.map((summary) => (
              <InstitutionSummaryCard key={summary.institution.institutionId} summary={summary} />
            ))
          ))}

        {filter === 'who' &&
          (neshamosFeed.loading ? (
            <LoadingSpinner />
          ) : neshamosFeed.neshamas.length === 0 ? (
            <p className="text-text-muted">{t('home.neshamosEmpty')}</p>
          ) : (
            neshamosFeed.neshamas.map((summary) => (
              <NeshamaSummaryCard key={summary.neshama.neshamaId} summary={summary} />
            ))
          ))}

        {filter === 'what' &&
          (seforimFeed.loading ? (
            <LoadingSpinner />
          ) : (
            <>
              <SeforimShopList items={seforimFeed.items} />
              {seforimFeed.items.length === 0 && <p className="text-text-muted">{t('home.seforimEmpty')}</p>}
            </>
          ))}
      </AppLayout>

      <FilterSortSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        filterGroups={currentSheet.filterGroups}
        selectedFilters={currentSheet.selectedFilters}
        onToggleFilter={currentSheet.onToggleFilter}
        sortOptions={currentSheet.sortOptions}
        sortValue={currentSheet.sortValue}
        onSortChange={currentSheet.onSortChange}
        onReset={currentSheet.onReset}
      />

      <Modal open={createInstitutionOpen} onClose={() => setCreateInstitutionOpen(false)} title={t('institution.addNew')}>
        <InstitutionCreateForm onCreated={() => setCreateInstitutionOpen(false)} />
      </Modal>

      <Modal open={createNeshamaOpen} onClose={() => setCreateNeshamaOpen(false)} title={t('neshama.addNew')}>
        <NeshamaCreateForm
          onCreated={(created) => {
            neshamosFeed.addCreated(created);
            setCreateNeshamaOpen(false);
          }}
        />
      </Modal>

      <Modal open={createCampaignOpen} onClose={() => setCreateCampaignOpen(false)} title={t('campaign.create')}>
        <CampaignCreateForm
          onCreated={(campaignId) => {
            setCreateCampaignOpen(false);
            navigate(`/?popup=campaign:${campaignId}`);
          }}
        />
      </Modal>
    </>
  );
}
