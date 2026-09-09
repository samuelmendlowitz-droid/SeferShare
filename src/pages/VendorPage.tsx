import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { AppLayout, type VendorTab } from '../components/layout/AppLayout';
import { FilterSortSheet, type FilterGroup, type SortOption } from '../components/layout/FilterSortSheet';
import { CatalogTab, type CatalogSortKey } from '../components/vendor/CatalogTab';
import { VendorOrdersTab } from '../components/vendor/VendorOrdersTab';
import { SalesTab } from '../components/vendor/SalesTab';
import { useVendorOrdersData } from '../hooks/useVendorOrdersData';
import { filterSortOrders, type OrderSortKey } from '../lib/orderFilterSort';
import { ORDER_STATUSES, SEFER_TYPES, type OrderStatus, type SeferType, type StockStatus } from '../types';

const STOCK_STATUSES: StockStatus[] = ['in', 'low', 'out'];

export function VendorPage() {
  const { t } = useTranslation();
  const { profile, loading } = useAuth();
  const [tab, setTab] = useState<VendorTab>('catalog');
  const [searchQuery, setSearchQuery] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);

  // Catalog filter/sort
  const [catalogSeferTypes, setCatalogSeferTypes] = useState<SeferType[]>([]);
  const [catalogStockStatuses, setCatalogStockStatuses] = useState<StockStatus[]>([]);
  const [catalogSort, setCatalogSort] = useState<CatalogSortKey>('custom');

  // Orders filter/sort
  const [orderSeferTypes, setOrderSeferTypes] = useState<SeferType[]>([]);
  const [orderStatuses, setOrderStatuses] = useState<OrderStatus[]>([]);
  const [orderSort, setOrderSort] = useState<OrderSortKey>('date-new');

  // Sales filter/sort
  const [salesSeferTypes, setSalesSeferTypes] = useState<SeferType[]>([]);
  const [salesSort, setSalesSort] = useState<OrderSortKey>('date-new');

  const ordersData = useVendorOrdersData(profile?.uid);

  const filteredOrders = filterSortOrders(
    ordersData.orders,
    { seferTypes: orderSeferTypes, statuses: orderStatuses },
    orderSort,
    ordersData.sefarimById,
  );
  const filteredSales = filterSortOrders(
    ordersData.orders,
    { seferTypes: salesSeferTypes },
    salesSort,
    ordersData.sefarimById,
  );

  const catalogFilterGroups: FilterGroup[] = [
    {
      key: 'seferType',
      label: t('filterSort.filterBySeferType'),
      options: SEFER_TYPES.map((type) => ({ value: type, label: t(`sefer.${type}`) })),
    },
    {
      key: 'stockStatus',
      label: t('filterSort.filterByStockStatus'),
      options: STOCK_STATUSES.map((status) => ({ value: status, label: t(`filterSort.${statusKey(status)}`) })),
    },
  ];
  const catalogSortOptions: SortOption[] = [
    { value: 'name-az', label: t('filterSort.sortNameAZ') },
    { value: 'cost-high', label: t('filterSort.sortCostHighLow') },
    { value: 'cost-low', label: t('filterSort.sortCostLowHigh') },
    { value: 'stock-high', label: t('filterSort.sortStockHighLow') },
    { value: 'stock-low', label: t('filterSort.sortStockLowHigh') },
  ];

  const orderFilterGroups: FilterGroup[] = [
    {
      key: 'seferType',
      label: t('filterSort.filterBySeferType'),
      options: ordersData.availableSeferTypes.map((type) => ({ value: type, label: t(`sefer.${type}`) })),
    },
    {
      key: 'status',
      label: t('filterSort.filterByOrderStatus'),
      options: ORDER_STATUSES.map((status) => ({ value: status, label: t(`orderStatus.${status}`) })),
    },
  ].filter((g) => g.options.length > 0);
  const orderSortOptions: SortOption[] = [
    { value: 'date-new', label: t('filterSort.sortDateNewOld') },
    { value: 'date-old', label: t('filterSort.sortDateOldNew') },
    { value: 'size-high', label: t('filterSort.sortOrderSizeHighLow') },
    { value: 'size-low', label: t('filterSort.sortOrderSizeLowHigh') },
    { value: 'sefer-az', label: t('filterSort.sortSeferNameAZ') },
  ];

  const salesFilterGroups: FilterGroup[] = [
    {
      key: 'seferType',
      label: t('filterSort.filterBySeferType'),
      options: ordersData.availableSeferTypes.map((type) => ({ value: type, label: t(`sefer.${type}`) })),
    },
  ].filter((g) => g.options.length > 0);

  function statusKey(status: StockStatus): string {
    return status === 'in' ? 'inStock' : status === 'low' ? 'lowStock' : 'outOfStock';
  }

  function toggleCatalogFilter(groupKey: string, value: string) {
    if (groupKey === 'seferType') {
      setCatalogSeferTypes((prev) =>
        prev.includes(value as SeferType) ? prev.filter((v) => v !== value) : [...prev, value as SeferType],
      );
    } else if (groupKey === 'stockStatus') {
      setCatalogStockStatuses((prev) =>
        prev.includes(value as StockStatus) ? prev.filter((v) => v !== value) : [...prev, value as StockStatus],
      );
    }
  }

  function resetCatalogFilters() {
    setCatalogSeferTypes([]);
    setCatalogStockStatuses([]);
    setCatalogSort('custom');
  }

  function toggleOrderFilter(groupKey: string, value: string) {
    if (groupKey === 'seferType') {
      setOrderSeferTypes((prev) =>
        prev.includes(value as SeferType) ? prev.filter((v) => v !== value) : [...prev, value as SeferType],
      );
    } else if (groupKey === 'status') {
      setOrderStatuses((prev) =>
        prev.includes(value as OrderStatus) ? prev.filter((v) => v !== value) : [...prev, value as OrderStatus],
      );
    }
  }

  function resetOrderFilters() {
    setOrderSeferTypes([]);
    setOrderStatuses([]);
    setOrderSort('date-new');
  }

  function toggleSalesFilter(_groupKey: string, value: string) {
    setSalesSeferTypes((prev) =>
      prev.includes(value as SeferType) ? prev.filter((v) => v !== value) : [...prev, value as SeferType],
    );
  }

  function resetSalesFilters() {
    setSalesSeferTypes([]);
    setSalesSort('date-new');
  }

  if (loading) return null;

  if (!profile?.isVendor || !profile.vendorApproved) {
    return (
      <div className="mx-auto max-w-2xl px-4 pt-6">
        <p className="text-text-muted">Not authorized.</p>
      </div>
    );
  }

  const catalogFiltersActive =
    catalogSeferTypes.length > 0 || catalogStockStatuses.length > 0 || catalogSort !== 'custom';
  const orderFiltersActive = orderSeferTypes.length > 0 || orderStatuses.length > 0 || orderSort !== 'date-new';
  const salesFiltersActive = salesSeferTypes.length > 0 || salesSort !== 'date-new';

  const filterSort =
    tab === 'catalog'
      ? { active: catalogFiltersActive, onClick: () => setSheetOpen(true) }
      : tab === 'orders'
        ? { active: orderFiltersActive, onClick: () => setSheetOpen(true) }
        : { active: salesFiltersActive, onClick: () => setSheetOpen(true) };

  return (
    <>
      <AppLayout variant="vendor" tab={tab} onTabChange={setTab} onSearch={setSearchQuery} filterSort={filterSort}>
        <h1 className="mb-4 text-xl font-bold">{t(`vendor.${tab}`)}</h1>

        {tab === 'catalog' && (
          <CatalogTab filters={{ seferTypes: catalogSeferTypes, stockStatuses: catalogStockStatuses }} sortKey={catalogSort} />
        )}
        {tab === 'orders' && <VendorOrdersTab loading={ordersData.loading} orders={filteredOrders} />}
        {tab === 'sales' && <SalesTab loading={ordersData.loading} orders={filteredSales} />}
      </AppLayout>

      {tab === 'catalog' && (
        <FilterSortSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          filterGroups={catalogFilterGroups}
          selectedFilters={{ seferType: catalogSeferTypes, stockStatus: catalogStockStatuses }}
          onToggleFilter={toggleCatalogFilter}
          sortOptions={catalogSortOptions}
          sortValue={catalogSort}
          onSortChange={(v) => setCatalogSort(v as CatalogSortKey)}
          onReset={resetCatalogFilters}
        />
      )}

      {tab === 'orders' && (
        <FilterSortSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          filterGroups={orderFilterGroups}
          selectedFilters={{ seferType: orderSeferTypes, status: orderStatuses }}
          onToggleFilter={toggleOrderFilter}
          sortOptions={orderSortOptions}
          sortValue={orderSort}
          onSortChange={(v) => setOrderSort(v as OrderSortKey)}
          onReset={resetOrderFilters}
        />
      )}

      {tab === 'sales' && (
        <FilterSortSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          filterGroups={salesFilterGroups}
          selectedFilters={{ seferType: salesSeferTypes }}
          onToggleFilter={toggleSalesFilter}
          sortOptions={orderSortOptions}
          sortValue={salesSort}
          onSortChange={(v) => setSalesSort(v as OrderSortKey)}
          onReset={resetSalesFilters}
        />
      )}
    </>
  );
}
