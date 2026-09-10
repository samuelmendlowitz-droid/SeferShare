import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SEFER_TYPES, type Sefer, type SeferType } from '../../types';
import { listSefarim } from '../../services/sefarim';
import { FilterSortSheet, type FilterGroup, type SortOption } from '../layout/FilterSortSheet';
import { Card } from '../ui/Card';
import { SeferThumbnail } from '../ui/SeferThumbnail';
import { FilterIcon } from '../ui/icons';

export interface PickedItem {
  seferId: string;
  vendorId: string;
  vendorName: string;
  englishName: string;
  hebrewName: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

type SortKey = 'recommended' | 'az' | 'za';

interface SeferPickerProps {
  picked: PickedItem[];
  onChange: (items: PickedItem[]) => void;
}

export function SeferPicker({ picked, onChange }: SeferPickerProps) {
  const { t } = useTranslation();
  const [allSefarim, setAllSefarim] = useState<Sefer[]>([]);
  const [query, setQuery] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<SeferType[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>('recommended');

  useEffect(() => {
    listSefarim().then(setAllSefarim);
  }, []);

  const filterGroups: FilterGroup[] = [
    {
      key: 'type',
      label: t('filterSort.filterBySeferType'),
      options: SEFER_TYPES.map((type) => ({ value: type, label: t(`sefer.${type}`) })),
    },
  ];
  const sortOptions: SortOption[] = [
    { value: 'recommended', label: t('filterSort.sortRecommended') },
    { value: 'az', label: t('filterSort.sortAZ') },
    { value: 'za', label: t('filterSort.sortZA') },
  ];

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = allSefarim;
    if (q) {
      list = list.filter(
        (s) =>
          s.hebrewName.includes(q) ||
          s.englishName.toLowerCase().includes(q) ||
          s.phoneticName.toLowerCase().includes(q),
      );
    }
    if (typeFilter.length > 0) {
      list = list.filter((s) => typeFilter.includes(s.type));
    }
    return [...list].sort((a, b) => {
      if (sortKey === 'az') return a.englishName.localeCompare(b.englishName);
      if (sortKey === 'za') return b.englishName.localeCompare(a.englishName);
      // recommended (default): in-stock items first, then alphabetical.
      const aInStock = a.vendorListings.some((l) => l.stockQty > 0) ? 0 : 1;
      const bInStock = b.vendorListings.some((l) => l.stockQty > 0) ? 0 : 1;
      if (aInStock !== bInStock) return aInStock - bInStock;
      return a.englishName.localeCompare(b.englishName);
    });
  }, [allSefarim, query, typeFilter, sortKey]);

  const filtersActive = typeFilter.length > 0 || sortKey !== 'recommended';

  function addSefer(sefer: Sefer) {
    const inStockListing = sefer.vendorListings.find((l) => l.stockQty > 0);
    if (!inStockListing) return;
    if (picked.some((p) => p.seferId === sefer.seferId && p.vendorId === inStockListing.vendorId)) return;
    onChange([
      ...picked,
      {
        seferId: sefer.seferId,
        vendorId: inStockListing.vendorId,
        vendorName: inStockListing.vendorName,
        englishName: sefer.englishName,
        hebrewName: sefer.hebrewName,
        price: inStockListing.price,
        quantity: 1,
        imageUrl: inStockListing.imageUrls?.[0],
      },
    ]);
  }

  function updateQuantity(seferId: string, vendorId: string, quantity: number) {
    onChange(
      picked
        .map((p) => (p.seferId === seferId && p.vendorId === vendorId ? { ...p, quantity } : p))
        .filter((p) => p.quantity > 0),
    );
  }

  function toggleTypeFilter(_groupKey: string, val: string) {
    setTypeFilter((prev) =>
      prev.includes(val as SeferType) ? prev.filter((v) => v !== val) : [...prev, val as SeferType],
    );
  }

  return (
    <div>
      <div className="rounded-btn border border-border">
        <div className="flex items-center gap-2 border-b border-border p-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('nav.searchPlaceholder') ?? ''}
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
        </div>

        <div className="max-h-64 space-y-2 overflow-y-auto p-2">
          {results.length === 0 && <p className="p-2 text-sm text-text-muted">{t('actions.noResults')}</p>}
          {results.map((sefer) => {
            const listing = sefer.vendorListings.find((l) => l.stockQty > 0);
            if (!listing) return null;
            return (
              <Card key={sefer.seferId} className="flex items-center gap-3">
                <SeferThumbnail imageUrl={listing.imageUrls?.[0]} alt={sefer.englishName} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {sefer.englishName} · {sefer.hebrewName}
                  </p>
                  <p className="text-xs text-text-muted">${listing.price.toFixed(2)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => addSefer(sefer)}
                  className="rounded-btn bg-accent px-3 py-1.5 text-xs font-medium text-white"
                >
                  {t('actions.add')}
                </button>
              </Card>
            );
          })}
        </div>
      </div>

      {picked.length > 0 && (
        <div className="mt-3 space-y-2">
          {picked.map((item) => (
            <div
              key={`${item.seferId}-${item.vendorId}`}
              className="flex items-center gap-3 rounded-btn border border-border px-3 py-2"
            >
              <SeferThumbnail imageUrl={item.imageUrl} alt={item.englishName} size={40} />
              <span className="flex-1 truncate text-sm">
                {item.englishName} · {item.hebrewName}
              </span>
              <input
                type="number"
                min={0}
                value={item.quantity}
                onChange={(e) => updateQuantity(item.seferId, item.vendorId, Number(e.target.value))}
                className="w-16 rounded-btn border border-border px-2 py-1 text-sm"
              />
            </div>
          ))}
        </div>
      )}

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
    </div>
  );
}
