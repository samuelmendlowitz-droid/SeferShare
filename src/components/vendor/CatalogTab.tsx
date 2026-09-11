import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { deleteVendorListing, listSefarim, listVendorPricing, type VendorPricing } from '../../services/sefarim';
import { classifyStockStatus, SEFER_TYPES, type Sefer, type SeferType, type StockStatus } from '../../types';
import { SeferForm } from './SeferForm';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Modal } from '../ui/Modal';
import { SeferThumbnail } from '../ui/SeferThumbnail';

export type CatalogSortKey = 'name-az' | 'cost-high' | 'cost-low' | 'stock-high' | 'stock-low';
export type CatalogGroupKey = 'seferType' | 'stock' | 'none';

export interface CatalogFilters {
  seferTypes: SeferType[];
  stockStatuses: StockStatus[];
}

interface CatalogTabProps {
  filters: CatalogFilters;
  sortKey: CatalogSortKey;
  groupKey: CatalogGroupKey;
}

type CatalogItem = { sefer: Sefer; listing: NonNullable<Sefer['vendorListings'][number]> };

function stockLabelKey(status: StockStatus): string {
  return status === 'in' ? 'inStock' : status === 'low' ? 'lowStock' : 'outOfStock';
}

export function CatalogTab({ filters, sortKey, groupKey }: CatalogTabProps) {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [sefarim, setSefarim] = useState<Sefer[]>([]);
  const [vendorPricing, setVendorPricing] = useState<Map<string, VendorPricing>>(new Map());
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSefer, setEditingSefer] = useState<Sefer | null>(null);

  async function load() {
    if (!profile) return;
    const [all, pricing] = await Promise.all([listSefarim(), listVendorPricing(profile.uid)]);
    const mine = all.filter((s) => s.vendorListings.some((l) => l.vendorId === profile.uid));
    setSefarim(mine);
    setVendorPricing(new Map(pricing.map((p) => [p.seferId, p])));
    setLoading(false);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.uid]);

  async function removeSefer(seferId: string) {
    if (!profile) return;
    await deleteVendorListing(seferId, profile.uid);
    setSefarim((prev) => prev.filter((s) => s.seferId !== seferId));
  }

  async function handleSaved() {
    setShowAddForm(false);
    setEditingSefer(null);
    await load();
  }

  const items = useMemo<CatalogItem[]>(() => {
    let list = sefarim
      .map((sefer) => ({ sefer, listing: sefer.vendorListings.find((l) => l.vendorId === profile?.uid) }))
      .filter((x): x is CatalogItem => Boolean(x.listing));

    if (filters.seferTypes.length > 0) {
      list = list.filter((x) => filters.seferTypes.includes(x.sefer.type));
    }
    if (filters.stockStatuses.length > 0) {
      list = list.filter((x) => filters.stockStatuses.includes(classifyStockStatus(x.listing.stockQty)));
    }
    return list;
  }, [sefarim, filters, profile?.uid]);

  function sortItems(list: CatalogItem[]): CatalogItem[] {
    return [...list].sort((a, b) => {
      if (sortKey === 'cost-high') return b.listing.price - a.listing.price;
      if (sortKey === 'cost-low') return a.listing.price - b.listing.price;
      if (sortKey === 'stock-high') return b.listing.stockQty - a.listing.stockQty;
      if (sortKey === 'stock-low') return a.listing.stockQty - b.listing.stockQty;
      return a.sefer.englishName.localeCompare(b.sefer.englishName); // name-az (and fallback)
    });
  }

  const groups = useMemo<{ key: string; label: string; items: CatalogItem[] }[]>(() => {
    if (groupKey === 'none') {
      return [{ key: 'all', label: '', items: sortItems(items) }];
    }
    if (groupKey === 'stock') {
      const byStatus = new Map<StockStatus, CatalogItem[]>();
      for (const item of items) {
        const status = classifyStockStatus(item.listing.stockQty);
        byStatus.set(status, [...(byStatus.get(status) ?? []), item]);
      }
      const order: StockStatus[] = ['in', 'low', 'out'];
      return order
        .filter((status) => byStatus.has(status))
        .map((status) => ({ key: status, label: t(`filterSort.${stockLabelKey(status)}`), items: sortItems(byStatus.get(status)!) }));
    }
    const byType = new Map<SeferType, CatalogItem[]>();
    for (const item of items) {
      byType.set(item.sefer.type, [...(byType.get(item.sefer.type) ?? []), item]);
    }
    return SEFER_TYPES.filter((type) => byType.has(type)).map((type) => ({
      key: type,
      label: t(`sefer.${type}`),
      items: sortItems(byType.get(type)!),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, groupKey, sortKey, t]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-3">
      {items.length === 0 && <p className="text-text-muted">{t('home.empty')}</p>}

      {groups.map((group) => (
        <div key={group.key} className="space-y-2">
          {group.label && (
            <p className="pt-2 text-xs font-medium uppercase tracking-wide text-text-muted">{group.label}</p>
          )}
          {group.items.map(({ sefer, listing }) => (
            <Card
              key={sefer.seferId}
              role="button"
              tabIndex={0}
              onClick={() => setEditingSefer(sefer)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setEditingSefer(sefer);
              }}
              className="flex cursor-pointer items-center gap-3"
            >
              <SeferThumbnail imageUrl={listing.imageUrls?.[0]} alt={sefer.englishName} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">
                  {sefer.englishName} · {sefer.hebrewName}
                </p>
                <p className="text-sm text-text-muted">{t(`sefer.${sefer.type}`)}</p>
                <p className="text-sm">
                  ${listing.price.toFixed(2)} — {listing.stockQty} {t('vendor.stockQty')}
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  void removeSefer(sefer.seferId);
                }}
                aria-label={t('actions.delete') ?? ''}
                className="shrink-0 self-start text-xs font-medium text-error"
              >
                {t('actions.delete')}
              </button>
            </Card>
          ))}
        </div>
      ))}

      {showAddForm ? (
        <Card>
          <SeferForm onSaved={handleSaved} onCancel={() => setShowAddForm(false)} />
        </Card>
      ) : (
        <Button onClick={() => setShowAddForm(true)}>{t('vendor.addSefer')}</Button>
      )}

      <Modal open={editingSefer !== null} onClose={() => setEditingSefer(null)} title={t('vendor.editSefer')}>
        {editingSefer && (
          <SeferForm
            sefer={editingSefer}
            wholesalePrice={vendorPricing.get(editingSefer.seferId)?.wholesalePrice}
            onSaved={handleSaved}
            onCancel={() => setEditingSefer(null)}
          />
        )}
      </Modal>
    </div>
  );
}
