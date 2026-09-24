import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { listInstitutions, listInstitutionsByOwner } from '../services/institutions';
import { AppLayout, type SeforimTab } from '../components/layout/AppLayout';
import { FilterSortSheet, type FilterGroup, type SortOption } from '../components/layout/FilterSortSheet';
import { SeforimShopList } from '../components/home/SeforimShopList';
import { CatalogTab, type CatalogGroupKey, type CatalogSortKey } from '../components/vendor/CatalogTab';
import { InstitutionSpendForm } from '../components/shared/InstitutionSpendForm';
import { BubbleGrid } from '../components/ui/BubbleGrid';
import { Card } from '../components/ui/Card';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Modal } from '../components/ui/Modal';
import { BookIcon } from '../components/ui/icons';
import { useSeforimShopFeed, type SeforimShopSortKey } from '../hooks/useSeforimShopFeed';
import { INSTITUTION_TYPES, SEFER_TYPES, type Institution, type SeferType, type StockStatus } from '../types';

const STOCK_STATUSES: StockStatus[] = ['in', 'low', 'out'];

function toggleValue<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

/** Seforim: Gallery (buy, and — via the institution switcher — spend a
 *  verified institution's gift card balance), Demand (what's needed most),
 *  Available to Claim (donated-without-location seforim; visible to all,
 *  actionable by institutions once the claim feature itself ships), and My
 *  Gallery (vendor-only catalog management, replacing the old standalone
 *  Vendor page's Catalog tab — Orders/Sales are admin-only now). */
export function SeforimPage() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [tab, setTab] = useState<SeforimTab>('gallery');
  const [searchQuery, setSearchQuery] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);

  // Gallery filter/sort + institution-switcher (gift card spend)
  const [gallerySeferTypes, setGallerySeferTypes] = useState<SeferType[]>([]);
  const [galleryInstitutionIds, setGalleryInstitutionIds] = useState<string[]>([]);
  const [gallerySort, setGallerySort] = useState<SeforimShopSortKey>('most-requested');
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [myVerifiedInstitutions, setMyVerifiedInstitutions] = useState<Institution[]>([]);
  const [spendingInstitution, setSpendingInstitution] = useState<Institution | null>(null);
  const galleryFeed = useSeforimShopFeed(searchQuery, {
    seferTypes: gallerySeferTypes,
    institutionIds: galleryInstitutionIds,
    sortKey: gallerySort,
    translateSeferType: (type) => t(`sefer.${type}`),
  });

  // Demand: the same underlying feed, always sorted by need, with a lighter filter set.
  const [demandSeferTypes, setDemandSeferTypes] = useState<SeferType[]>([]);
  const demandFeed = useSeforimShopFeed(searchQuery, {
    seferTypes: demandSeferTypes,
    sortKey: 'most-requested',
  });

  // My Gallery (vendor catalog) filter/sort/group
  const [catalogSeferTypes, setCatalogSeferTypes] = useState<SeferType[]>([]);
  const [catalogStockStatuses, setCatalogStockStatuses] = useState<StockStatus[]>([]);
  const [catalogSort, setCatalogSort] = useState<CatalogSortKey>('name-az');
  const [catalogGroup, setCatalogGroup] = useState<CatalogGroupKey>('seferType');

  const isApprovedVendor = Boolean(profile?.isVendor && profile.vendorApproved);

  useEffect(() => {
    listInstitutions().then(setInstitutions);
  }, []);

  useEffect(() => {
    if (!profile?.uid) return;
    listInstitutionsByOwner(profile.uid).then((owned) => setMyVerifiedInstitutions(owned.filter((i) => i.verified)));
  }, [profile?.uid]);

  const galleryFilterGroups: FilterGroup[] = [
    {
      key: 'seferType',
      label: t('filterSort.filterBySeferType'),
      options: SEFER_TYPES.map((type) => ({ value: type, label: t(`sefer.${type}`) })),
      searchable: true,
      searchPlaceholder: t('filterSort.searchSeferTypes') ?? undefined,
    },
    {
      key: 'institution',
      label: t('filterSort.filterByInstitution'),
      options: institutions.map((inst) => ({ value: inst.institutionId, label: inst.name })),
      searchable: true,
      searchPlaceholder: t('filterSort.searchInstitutions') ?? undefined,
    },
  ];
  const gallerySortOptions: SortOption[] = [
    { value: 'most-requested', label: t('filterSort.sortMostRequested') },
    { value: 'price-high', label: t('filterSort.sortPriceHighLow') },
    { value: 'price-low', label: t('filterSort.sortPriceLowHigh') },
    { value: 'type-az', label: t('filterSort.sortTypeAZ') },
    { value: 'name-az', label: t('filterSort.sortNameAZ') },
  ];

  const demandFilterGroups: FilterGroup[] = [
    {
      key: 'seferType',
      label: t('filterSort.filterBySeferType'),
      options: SEFER_TYPES.map((type) => ({ value: type, label: t(`sefer.${type}`) })),
      searchable: true,
      searchPlaceholder: t('filterSort.searchSeferTypes') ?? undefined,
    },
  ];

  const catalogFilterGroups: FilterGroup[] = [
    {
      key: 'seferType',
      label: t('filterSort.filterBySeferType'),
      options: SEFER_TYPES.map((type) => ({ value: type, label: t(`sefer.${type}`) })),
    },
    {
      key: 'stockStatus',
      label: t('filterSort.filterByStockStatus'),
      options: STOCK_STATUSES.map((status) => ({
        value: status,
        label: t(`filterSort.${status === 'in' ? 'inStock' : status === 'low' ? 'lowStock' : 'outOfStock'}`),
      })),
    },
  ];
  const catalogSortOptions: SortOption[] = [
    { value: 'name-az', label: t('filterSort.sortNameAZ') },
    { value: 'cost-high', label: t('filterSort.sortCostHighLow') },
    { value: 'cost-low', label: t('filterSort.sortCostLowHigh') },
    { value: 'stock-high', label: t('filterSort.sortStockHighLow') },
    { value: 'stock-low', label: t('filterSort.sortStockLowHigh') },
  ];
  const catalogGroupOptions = [
    { value: 'seferType', label: t('filterSort.groupBySeferType') },
    { value: 'stock', label: t('filterSort.groupByStock') },
    { value: 'none', label: t('filterSort.groupByNone') },
  ];

  function toggleGalleryFilter(groupKey: string, value: string) {
    if (groupKey === 'seferType') setGallerySeferTypes((prev) => toggleValue(prev, value as SeferType));
    else if (groupKey === 'institution') setGalleryInstitutionIds((prev) => toggleValue(prev, value));
  }
  function resetGalleryFilters() {
    setGallerySeferTypes([]);
    setGalleryInstitutionIds([]);
    setGallerySort('most-requested');
  }

  function toggleDemandFilter(_groupKey: string, value: string) {
    setDemandSeferTypes((prev) => toggleValue(prev, value as SeferType));
  }
  function resetDemandFilters() {
    setDemandSeferTypes([]);
  }

  function toggleCatalogFilter(groupKey: string, value: string) {
    if (groupKey === 'seferType') setCatalogSeferTypes((prev) => toggleValue(prev, value as SeferType));
    else if (groupKey === 'stockStatus') setCatalogStockStatuses((prev) => toggleValue(prev, value as StockStatus));
  }
  function resetCatalogFilters() {
    setCatalogSeferTypes([]);
    setCatalogStockStatuses([]);
    setCatalogSort('name-az');
    setCatalogGroup('seferType');
  }

  const galleryFiltersActive =
    gallerySeferTypes.length > 0 || galleryInstitutionIds.length > 0 || gallerySort !== 'most-requested';
  const demandFiltersActive = demandSeferTypes.length > 0;
  const catalogFiltersActive =
    catalogSeferTypes.length > 0 ||
    catalogStockStatuses.length > 0 ||
    catalogSort !== 'name-az' ||
    catalogGroup !== 'seferType';

  const filterSort =
    tab === 'gallery'
      ? { active: galleryFiltersActive, onClick: () => setSheetOpen(true) }
      : tab === 'demand'
        ? { active: demandFiltersActive, onClick: () => setSheetOpen(true) }
        : tab === 'myGallery' && isApprovedVendor
          ? { active: catalogFiltersActive, onClick: () => setSheetOpen(true) }
          : undefined;

  return (
    <>
      <AppLayout variant="seforim" tab={tab} onTabChange={setTab} onSearch={setSearchQuery} filterSort={filterSort}>
        {tab === 'gallery' && (
          <>
            {myVerifiedInstitutions.length > 0 && (
              <div className="mb-3">
                <p className="mb-1 text-xs font-semibold text-text-muted">{t('institution.spendSwitcherLabel')}</p>
                <BubbleGrid
                  rows={1}
                  options={myVerifiedInstitutions.map((inst) => ({
                    value: inst.institutionId,
                    label: t('institution.spendFor', { name: inst.name }),
                  }))}
                  isSelected={() => false}
                  onToggle={(value) => {
                    const inst = myVerifiedInstitutions.find((i) => i.institutionId === value);
                    if (inst) setSpendingInstitution(inst);
                  }}
                />
              </div>
            )}
            {galleryFeed.loading ? (
              <LoadingSpinner />
            ) : (
              <>
                <SeforimShopList items={galleryFeed.items} />
                {galleryFeed.items.length === 0 && <p className="text-text-muted">{t('home.seforimEmpty')}</p>}
              </>
            )}
          </>
        )}

        {tab === 'demand' &&
          (demandFeed.loading ? (
            <LoadingSpinner />
          ) : (
            <>
              <SeforimShopList items={demandFeed.items} showDemand />
              {demandFeed.items.length === 0 && <p className="text-text-muted">{t('home.seforimEmpty')}</p>}
            </>
          ))}

        {tab === 'claim' && (
          <Card className="flex flex-col items-center gap-2 py-8 text-center">
            <BookIcon className="text-accent" width={32} height={32} />
            <h2 className="text-sm font-semibold">{t('seforim.claimComingSoonTitle')}</h2>
            <p className="max-w-xs text-xs text-text-muted">{t('seforim.claimComingSoonBody')}</p>
          </Card>
        )}

        {tab === 'myGallery' &&
          (isApprovedVendor ? (
            <CatalogTab
              filters={{ seferTypes: catalogSeferTypes, stockStatuses: catalogStockStatuses }}
              sortKey={catalogSort}
              groupKey={catalogGroup}
            />
          ) : (
            <p className="text-text-muted">{t('actions.notAuthorized')}</p>
          ))}
      </AppLayout>

      {tab === 'gallery' && (
        <FilterSortSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          filterGroups={galleryFilterGroups}
          selectedFilters={{ seferType: gallerySeferTypes, institution: galleryInstitutionIds }}
          onToggleFilter={toggleGalleryFilter}
          sortOptions={gallerySortOptions}
          sortValue={gallerySort}
          onSortChange={(v) => setGallerySort(v as SeforimShopSortKey)}
          onReset={resetGalleryFilters}
        />
      )}

      {tab === 'demand' && (
        <FilterSortSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          filterGroups={demandFilterGroups}
          selectedFilters={{ seferType: demandSeferTypes }}
          onToggleFilter={toggleDemandFilter}
          sortOptions={[]}
          sortValue=""
          onSortChange={() => {}}
          onReset={resetDemandFilters}
        />
      )}

      {tab === 'myGallery' && isApprovedVendor && (
        <FilterSortSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          filterGroups={catalogFilterGroups}
          selectedFilters={{ seferType: catalogSeferTypes, stockStatus: catalogStockStatuses }}
          onToggleFilter={toggleCatalogFilter}
          groupOptions={catalogGroupOptions}
          groupValue={catalogGroup}
          onGroupChange={(v) => setCatalogGroup(v as CatalogGroupKey)}
          sortOptions={catalogSortOptions}
          sortValue={catalogSort}
          onSortChange={(v) => setCatalogSort(v as CatalogSortKey)}
          onReset={resetCatalogFilters}
        />
      )}

      <Modal
        open={spendingInstitution !== null}
        onClose={() => setSpendingInstitution(null)}
        title={spendingInstitution ? t('institution.spendFor', { name: spendingInstitution.name }) : ''}
      >
        {spendingInstitution && (
          <InstitutionSpendForm
            institution={spendingInstitution}
            onSpent={(newBalance) => {
              setSpendingInstitution((prev) => (prev ? { ...prev, giftCardBalance: newBalance } : prev));
              setMyVerifiedInstitutions((prev) =>
                prev.map((i) => (i.institutionId === spendingInstitution.institutionId ? { ...i, giftCardBalance: newBalance } : i)),
              );
            }}
          />
        )}
      </Modal>
    </>
  );
}
