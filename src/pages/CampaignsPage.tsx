import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { listInstitutions } from '../services/institutions';
import { AppLayout } from '../components/layout/AppLayout';
import { FilterSortSheet, type FilterGroup, type SortOption } from '../components/layout/FilterSortSheet';
import { CampaignCard } from '../components/campaign/CampaignCard';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useCampaignFeed, type HomeSortKey } from '../hooks/useCampaignFeed';
import { INSTITUTION_TYPES, SEFER_TYPES, type Institution, type InstitutionType, type SeferType } from '../types';

function toggleValue<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

/** The flat "All Campaigns" browse — no sub-tabs, same shape for every account
 *  type. "Campaigns for my institution" isn't a separate page: it's this same
 *  feed pre-filtered to one institution, reached via a link from Profile's My
 *  Institution tab (see `?institution=<id>`). */
export function CampaignsPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);

  const [institutionTypes, setInstitutionTypes] = useState<InstitutionType[]>([]);
  const [seferTypes, setSeferTypes] = useState<SeferType[]>([]);
  const [institutionIds, setInstitutionIds] = useState<string[]>(() => {
    const fromUrl = searchParams.get('institution');
    return fromUrl ? [fromUrl] : [];
  });
  const [sort, setSort] = useState<HomeSortKey>('recommended');
  const [institutions, setInstitutions] = useState<Institution[]>([]);

  useEffect(() => {
    listInstitutions().then(setInstitutions);
  }, []);

  // A fresh `?institution=` (e.g. clicking the link again from a different
  // institution) should re-seed the filter even after the page has mounted.
  useEffect(() => {
    const fromUrl = searchParams.get('institution');
    if (fromUrl) setInstitutionIds([fromUrl]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.get('institution')]);

  const feed = useCampaignFeed(searchQuery, { institutionTypes, institutionIds, seferTypes, sortKey: sort });

  const filterGroups: FilterGroup[] = [
    {
      key: 'institution',
      label: t('filterSort.filterByInstitution'),
      options: institutions.map((inst) => ({ value: inst.institutionId, label: inst.name })),
      searchable: true,
      searchPlaceholder: t('filterSort.searchInstitutions') ?? undefined,
    },
    {
      key: 'institutionType',
      label: t('filterSort.filterByInstitutionType'),
      options: INSTITUTION_TYPES.map((type) => ({ value: type, label: t(`institution.${type}`) })),
    },
    {
      key: 'seferType',
      label: t('filterSort.filterBySeferType'),
      options: SEFER_TYPES.map((type) => ({ value: type, label: t(`sefer.${type}`) })),
      searchable: true,
      searchPlaceholder: t('filterSort.searchSeferTypes') ?? undefined,
    },
  ];
  const sortOptions: SortOption[] = [
    { value: 'recommended', label: t('filterSort.sortRecommended') },
    { value: 'institution-az', label: t('filterSort.sortInstitutionAZ') },
    { value: 'neshama-az', label: t('filterSort.sortNeshamaAZ') },
    { value: 'sefer-az', label: t('filterSort.sortSeferAZ') },
  ];

  function toggleFilter(groupKey: string, value: string) {
    if (groupKey === 'institution') setInstitutionIds((prev) => toggleValue(prev, value));
    else if (groupKey === 'institutionType') setInstitutionTypes((prev) => toggleValue(prev, value as InstitutionType));
    else if (groupKey === 'seferType') setSeferTypes((prev) => toggleValue(prev, value as SeferType));
  }

  function resetFilters() {
    setInstitutionIds([]);
    setInstitutionTypes([]);
    setSeferTypes([]);
    setSort('recommended');
  }

  const filtersActive =
    institutionIds.length > 0 || institutionTypes.length > 0 || seferTypes.length > 0 || sort !== 'recommended';

  return (
    <>
      <AppLayout
        variant="campaigns"
        onSearch={setSearchQuery}
        filterSort={{ active: filtersActive, onClick: () => setSheetOpen(true) }}
      >
        {feed.loading ? (
          <LoadingSpinner />
        ) : feed.campaigns.length === 0 ? (
          <p className="text-text-muted">{t('home.empty')}</p>
        ) : (
          feed.campaigns.map((campaign) => (
            <CampaignCard
              key={campaign.campaignId}
              campaign={campaign}
              institution={feed.institutionsById.get(campaign.institutionId)}
              neshamas={(campaign.neshamaIds ?? [])
                .map((id) => feed.neshamosById.get(id))
                .filter((n): n is NonNullable<typeof n> => Boolean(n))}
              sefarimById={feed.sefarimById}
            />
          ))
        )}
      </AppLayout>

      <FilterSortSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        filterGroups={filterGroups}
        selectedFilters={{ institution: institutionIds, institutionType: institutionTypes, seferType: seferTypes }}
        onToggleFilter={toggleFilter}
        sortOptions={sortOptions}
        sortValue={sort}
        onSortChange={(v) => setSort(v as HomeSortKey)}
        onReset={resetFilters}
      />
    </>
  );
}
