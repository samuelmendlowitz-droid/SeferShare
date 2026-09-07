import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Sefer } from '../../types';
import { listSefarim, searchSefarim } from '../../services/sefarim';
import { Card } from '../ui/Card';

export interface PickedItem {
  seferId: string;
  vendorId: string;
  vendorName: string;
  englishName: string;
  hebrewName: string;
  price: number;
  quantity: number;
}

interface SeferPickerProps {
  picked: PickedItem[];
  onChange: (items: PickedItem[]) => void;
}

export function SeferPicker({ picked, onChange }: SeferPickerProps) {
  const { t } = useTranslation();
  const [allSefarim, setAllSefarim] = useState<Sefer[]>([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    listSefarim().then(setAllSefarim);
  }, []);

  const results = searchSefarim(allSefarim, query);

  function addSefer(sefer: Sefer) {
    const inStockListing = sefer.vendorListings.find((l) => l.inStock);
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

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t('nav.searchPlaceholder') ?? ''}
        className="mb-3 w-full rounded-btn border border-border px-3 py-2 text-sm"
      />

      <div className="mb-4 space-y-2">
        {results.map((sefer) => {
          const listing = sefer.vendorListings.find((l) => l.inStock);
          if (!listing) return null;
          return (
            <Card key={sefer.seferId} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">
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

      {picked.length > 0 && (
        <div className="space-y-2">
          {picked.map((item) => (
            <div
              key={`${item.seferId}-${item.vendorId}`}
              className="flex items-center justify-between rounded-btn border border-border px-3 py-2"
            >
              <span className="text-sm">
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
    </div>
  );
}
