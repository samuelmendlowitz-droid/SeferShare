import { useEffect, useMemo, useState } from 'react';
import type { PublicVendorListing, Sefer, SeferType } from '../types';
import { listSefarim } from '../services/sefarim';

export type SeforimShopSortKey = 'name-az' | 'cost-high' | 'cost-low';

export interface SeforimShopOptions {
  seferTypes?: SeferType[];
  sortKey?: SeforimShopSortKey;
}

export interface SeforimShopItem {
  sefer: Sefer;
  /** Cheapest in-stock vendor listing, or the first listing when none are in stock. */
  listing?: PublicVendorListing;
  inStock: boolean;
}

function bestListing(sefer: Sefer): PublicVendorListing | undefined {
  const inStock = sefer.vendorListings.filter((l) => l.stockQty > 0);
  if (inStock.length > 0) return [...inStock].sort((a, b) => a.price - b.price)[0];
  return sefer.vendorListings[0];
}

/** The Seforim tab: a shopping-style browse of the whole catalog, independent of campaigns. */
export function useSeforimShopFeed(searchQuery: string, options: SeforimShopOptions = {}) {
  const { seferTypes = [], sortKey = 'name-az' } = options;
  const [loading, setLoading] = useState(true);
  const [sefarim, setSefarim] = useState<Sefer[]>([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listSefarim()
      .then((s) => {
        if (!cancelled) setSefarim(s);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const items = useMemo<SeforimShopItem[]>(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = sefarim.filter((s) => s.vendorListings.length > 0);
    if (q) {
      list = list.filter(
        (s) =>
          s.englishName.toLowerCase().includes(q) ||
          s.hebrewName.includes(q) ||
          s.phoneticName.toLowerCase().includes(q),
      );
    }
    if (seferTypes.length > 0) {
      list = list.filter((s) => seferTypes.includes(s.type));
    }

    const withListing = list.map((sefer) => {
      const listing = bestListing(sefer);
      return { sefer, listing, inStock: Boolean(listing && listing.stockQty > 0) };
    });

    return [...withListing].sort((a, b) => {
      if (sortKey === 'cost-high') return (b.listing?.price ?? 0) - (a.listing?.price ?? 0);
      if (sortKey === 'cost-low') return (a.listing?.price ?? 0) - (b.listing?.price ?? 0);
      return a.sefer.englishName.localeCompare(b.sefer.englishName);
    });
  }, [sefarim, searchQuery, seferTypes, sortKey]);

  return { loading, items };
}
