import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout, type HomeFilter } from '../components/layout/AppLayout';
import { FilterSortSheet, type FilterGroup, type SortOption } from '../components/layout/FilterSortSheet';
import { CampaignCard } from '../components/campaign/CampaignCard';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useCampaignFeed, type HomeSortKey } from '../hooks/useCampaignFeed';
import { INSTITUTION_TYPES, SEFER_TYPES, type InstitutionType, type SeferType } from '../types';

export function HomePage() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<HomeFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [institutionTypes, setInstitutionTypes] = useState<InstitutionType[]>([]);
  const [seferTypes, setSeferTypes] = useState<SeferType[]>([]);
  const [sortKey, setSortKey] = useState<HomeSortKey>('recommended');

  const { loading, campaigns, institutionsById, neshamosById } = useCampaignFeed(filter, searchQuery, {
    institutionTypes,
    seferTypes,
    sortKey,
  });

  const filterGroups: FilterGroup[] = [
    {
      key: 'institutionType',
      label: t('filterSort.filterByInstitutionType'),
      options: INSTITUTION_TYPES.map((type) => ({ value: type, label: t(`institution.${type}`) })),
    },
    {
      key: 'seferType',
      label: t('filterSort.filterBySeferType'),
      options: SEFER_TYPES.map((type) => ({ value: type, label: t(`sefer.${type}`) })),
    },
  ];

  const sortOptions: SortOption[] = [
    { value: 'recommended', label: t('filterSort.sortRecommended') },
    { value: 'institution-az', label: t('filterSort.sortInstitutionAZ') },
    { value: 'neshama-az', label: t('filterSort.sortNeshamaAZ') },
    { value: 'sefer-az', label: t('filterSort.sortSeferAZ') },
  ];

  function toggleFilter(groupKey: string, value: string) {
    if (groupKey === 'institutionType') {
      setInstitutionTypes((prev) =>
        prev.includes(value as InstitutionType) ? prev.filter((v) => v !== value) : [...prev, value as InstitutionType],
      );
    } else if (groupKey === 'seferType') {
      setSeferTypes((prev) =>
        prev.includes(value as SeferType) ? prev.filter((v) => v !== value) : [...prev, value as SeferType],
      );
    }
  }

  function resetFilters() {
    setInstitutionTypes([]);
    setSeferTypes([]);
    setSortKey('recommended');
  }

  const filtersActive = institutionTypes.length > 0 || seferTypes.length > 0 || sortKey !== 'recommended';

  return (
    <>
      <AppLayout
        variant="home"
        filter={filter}
        onFilterChange={setFilter}
        onSearch={setSearchQuery}
        filterSort={{ active: filtersActive, onClick: () => setSheetOpen(true) }}
      >
        <h1 className="mb-4 text-xl font-bold">{t('app.name')}</h1>

        {loading ? (
          <LoadingSpinner />
        ) : campaigns.length === 0 ? (
          <p className="text-text-muted">{t('home.empty')}</p>
        ) : (
          campaigns.map((campaign) => (
            <CampaignCard
              key={campaign.campaignId}
              campaign={campaign}
              institution={campaign.institutionId ? institutionsById.get(campaign.institutionId) : undefined}
              neshama={campaign.neshamaId ? neshamosById.get(campaign.neshamaId) : undefined}
            />
          ))
        )}
      </AppLayout>

      <FilterSortSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        filterGroups={filterGroups}
        selectedFilters={{ institutionType: institutionTypes, seferType: seferTypes }}
        onToggleFilter={toggleFilter}
        sortOptions={sortOptions}
        sortValue={sortKey}
        onSortChange={(v) => setSortKey(v as HomeSortKey)}
        onReset={resetFilters}
      />
    </>
  );
}
