import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout, type ProfileTab } from '../components/layout/AppLayout';
import { FilterSortSheet, type FilterGroup, type SortOption } from '../components/layout/FilterSortSheet';
import { MyCampaignsTab } from '../components/profile/MyCampaignsTab';
import { DonationsTab } from '../components/profile/DonationsTab';
import { NotificationsTab } from '../components/profile/NotificationsTab';
import { SettingsTab } from '../components/profile/SettingsTab';
import { useAuth } from '../context/AuthContext';
import { useMyCampaignsFeed, type MyCampaignsSortKey } from '../hooks/useMyCampaignsFeed';
import { useMyDonationsFeed, type MyDonationsSortKey } from '../hooks/useMyDonationsFeed';
import { DONATION_STATUSES, type DonationStatus, type SeferType } from '../types';

export function ProfilePage() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [tab, setTab] = useState<ProfileTab>('campaigns');
  const [searchQuery, setSearchQuery] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);

  // My Campaigns filter/sort state
  const [campaignInstitutionIds, setCampaignInstitutionIds] = useState<string[]>([]);
  const [campaignNeshamaIds, setCampaignNeshamaIds] = useState<string[]>([]);
  const [campaignSeferTypes, setCampaignSeferTypes] = useState<SeferType[]>([]);
  const [campaignSort, setCampaignSort] = useState<MyCampaignsSortKey>('size');

  const campaignsFeed = useMyCampaignsFeed(
    profile?.uid,
    { institutionIds: campaignInstitutionIds, neshamaIds: campaignNeshamaIds, seferTypes: campaignSeferTypes },
    campaignSort,
  );

  // Donations filter/sort state
  const [donationSeferTypes, setDonationSeferTypes] = useState<SeferType[]>([]);
  const [donationStatuses, setDonationStatuses] = useState<DonationStatus[]>([]);
  const [donationSort, setDonationSort] = useState<MyDonationsSortKey>('date-new');

  const donationsFeed = useMyDonationsFeed(
    profile?.uid,
    { seferTypes: donationSeferTypes, statuses: donationStatuses },
    donationSort,
  );

  const campaignFilterGroups: FilterGroup[] = [
    {
      key: 'institution',
      label: t('filterSort.filterByInstitution'),
      options: campaignsFeed.availableInstitutions.map((i) => ({ value: i.institutionId, label: i.name })),
    },
    {
      key: 'neshama',
      label: t('filterSort.filterByNeshama'),
      options: campaignsFeed.availableNeshamas.map((n) => ({ value: n.neshamaId, label: n.name })),
    },
    {
      key: 'seferType',
      label: t('filterSort.filterBySeferType'),
      options: campaignsFeed.availableSeferTypes.map((type) => ({ value: type, label: t(`sefer.${type}`) })),
    },
  ].filter((g) => g.options.length > 0);

  const campaignSortOptions: SortOption[] = [
    { value: 'size', label: t('filterSort.sortCampaignSize') },
    ...(campaignsFeed.hasInstitutionCampaigns ? [{ value: 'institution-az', label: t('filterSort.sortInstitutionAZ') }] : []),
    ...(campaignsFeed.hasNeshamaCampaigns ? [{ value: 'neshama-az', label: t('filterSort.sortNeshamaAZ') }] : []),
  ];

  const donationFilterGroups: FilterGroup[] = [
    {
      key: 'seferType',
      label: t('filterSort.filterBySeferType'),
      options: donationsFeed.availableSeferTypes.map((type) => ({ value: type, label: t(`sefer.${type}`) })),
    },
    {
      key: 'status',
      label: t('filterSort.filterByDonationStatus'),
      options: DONATION_STATUSES.map((status) => ({ value: status, label: t(`donationStatus.${status}`) })),
    },
  ].filter((g) => g.options.length > 0);

  const donationSortOptions: SortOption[] = [
    { value: 'date-new', label: t('filterSort.sortDateNewOld') },
    { value: 'date-old', label: t('filterSort.sortDateOldNew') },
    { value: 'amount-high', label: t('filterSort.sortAmountHighLow') },
    { value: 'amount-low', label: t('filterSort.sortAmountLowHigh') },
  ];

  function toggleCampaignFilter(groupKey: string, value: string) {
    if (groupKey === 'institution') {
      setCampaignInstitutionIds((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
    } else if (groupKey === 'neshama') {
      setCampaignNeshamaIds((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
    } else if (groupKey === 'seferType') {
      setCampaignSeferTypes((prev) =>
        prev.includes(value as SeferType) ? prev.filter((v) => v !== value) : [...prev, value as SeferType],
      );
    }
  }

  function resetCampaignFilters() {
    setCampaignInstitutionIds([]);
    setCampaignNeshamaIds([]);
    setCampaignSeferTypes([]);
    setCampaignSort('size');
  }

  function toggleDonationFilter(groupKey: string, value: string) {
    if (groupKey === 'seferType') {
      setDonationSeferTypes((prev) =>
        prev.includes(value as SeferType) ? prev.filter((v) => v !== value) : [...prev, value as SeferType],
      );
    } else if (groupKey === 'status') {
      setDonationStatuses((prev) =>
        prev.includes(value as DonationStatus) ? prev.filter((v) => v !== value) : [...prev, value as DonationStatus],
      );
    }
  }

  function resetDonationFilters() {
    setDonationSeferTypes([]);
    setDonationStatuses([]);
    setDonationSort('date-new');
  }

  const campaignFiltersActive =
    campaignInstitutionIds.length > 0 ||
    campaignNeshamaIds.length > 0 ||
    campaignSeferTypes.length > 0 ||
    campaignSort !== 'size';
  const donationFiltersActive =
    donationSeferTypes.length > 0 || donationStatuses.length > 0 || donationSort !== 'date-new';

  const filterSort =
    tab === 'campaigns'
      ? { active: campaignFiltersActive, onClick: () => setSheetOpen(true) }
      : tab === 'donations'
        ? { active: donationFiltersActive, onClick: () => setSheetOpen(true) }
        : undefined;

  return (
    <>
      <AppLayout variant="profile" tab={tab} onTabChange={setTab} onSearch={setSearchQuery} filterSort={filterSort}>
        <h1 className="mb-4 text-xl font-bold">{t(`nav.${tab === 'campaigns' ? 'myCampaigns' : tab}`)}</h1>

        {tab === 'campaigns' && (
          <MyCampaignsTab
            loading={campaignsFeed.loading}
            campaigns={campaignsFeed.campaigns}
            institutionsById={campaignsFeed.institutionsById}
            neshamosById={campaignsFeed.neshamosById}
            sefarimById={campaignsFeed.sefarimById}
          />
        )}
        {tab === 'donations' && <DonationsTab loading={donationsFeed.loading} donations={donationsFeed.donations} />}
        {tab === 'notifications' && <NotificationsTab />}
        {tab === 'settings' && <SettingsTab />}

        {searchQuery && tab === 'campaigns' && (
          <p className="mt-2 text-xs text-text-muted">Filtering by "{searchQuery}"…</p>
        )}
      </AppLayout>

      {tab === 'campaigns' && (
        <FilterSortSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          filterGroups={campaignFilterGroups}
          selectedFilters={{
            institution: campaignInstitutionIds,
            neshama: campaignNeshamaIds,
            seferType: campaignSeferTypes,
          }}
          onToggleFilter={toggleCampaignFilter}
          sortOptions={campaignSortOptions}
          sortValue={campaignSort}
          onSortChange={(v) => setCampaignSort(v as MyCampaignsSortKey)}
          onReset={resetCampaignFilters}
        />
      )}

      {tab === 'donations' && (
        <FilterSortSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          filterGroups={donationFilterGroups}
          selectedFilters={{ seferType: donationSeferTypes, status: donationStatuses }}
          onToggleFilter={toggleDonationFilter}
          sortOptions={donationSortOptions}
          sortValue={donationSort}
          onSortChange={(v) => setDonationSort(v as MyDonationsSortKey)}
          onReset={resetDonationFilters}
        />
      )}
    </>
  );
}
