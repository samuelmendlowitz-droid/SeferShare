import { useEffect, useMemo, useState } from 'react';
import type { PublicVendorListing, Sefer, SeferType } from '../types';
import { listSefarim } from '../services/sefarim';
import { listActiveCampaigns } from '../services/campaigns';

export type SeforimShopSortKey = 'most-requested' | 'price-high' | 'price-low' | 'type-az' | 'name-az';

export interface SeforimShopOptions {
  seferTypes?: SeferType[];
  /** Only show seforim requested by an active campaign at one of these institutions. */
  institutionIds?: string[];
  sortKey?: SeforimShopSortKey;
  /** Needed for 'type-az' to sort by the displayed type name rather than the
   *  raw (untranslated, so locale-incorrect) enum value. */
  translateSeferType?: (type: SeferType) => string;
}

export interface SeforimShopItem {
  sefer: Sefer;
  /** Cheapest in-stock vendor listing, or the first listing when none are in stock. */
  listing?: PublicVendorListing;
  inStock: boolean;
  /** Total remaining quantity any active campaign still needs of this sefer —
   *  the same number the default "most-requested" sort uses (see the Demand tab). */
  need: number;
}

interface DemandEntry {
  /** Total remaining quantity any active campaign still needs of this sefer. */
  need: number;
  institutionIds: Set<string>;
}

function bestListing(sefer: Sefer): PublicVendorListing | undefined {
  const inStock = sefer.vendorListings.filter((l) => l.stockQty > 0);
  if (inStock.length > 0) return [...inStock].sort((a, b) => a.price - b.price)[0];
  return sefer.vendorListings[0];
}

/** The Seforim tab: a shopping-style browse of the whole catalog, independent of campaigns
 *  (every sefer with a vendor listing is shown), but campaign demand still drives the
 *  default sort and the optional institution filter — see DemandEntry. */
export function useSeforimShopFeed(searchQuery: string, options: SeforimShopOptions = {}) {
  const { seferTypes = [], institutionIds = [], sortKey = 'most-requested', translateSeferType } = options;
  const [loading, setLoading] = useState(true);
  const [sefarim, setSefarim] = useState<Sefer[]>([]);
  const [demandBySefer, setDemandBySefer] = useState<Map<string, DemandEntry>>(new Map());

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([listSefarim(), listActiveCampaigns()])
      .then(([s, campaigns]) => {
        if (cancelled) return;
        setSefarim(s);
        const demand = new Map<string, DemandEntry>();
        for (const campaign of campaigns) {
          for (const item of campaign.items) {
            const remaining = Math.max(0, item.quantity - item.quantityFulfilled);
            const entry = demand.get(item.seferId) ?? { need: 0, institutionIds: new Set<string>() };
            entry.need += remaining;
            entry.institutionIds.add(campaign.institutionId);
            demand.set(item.seferId, entry);
          }
        }
        setDemandBySefer(demand);
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
    if (institutionIds.length > 0) {
      list = list.filter((s) => {
        const wanted = demandBySefer.get(s.seferId)?.institutionIds;
        return wanted ? institutionIds.some((id) => wanted.has(id)) : false;
      });
    }

    const withListing = list.map((sefer) => {
      const listing = bestListing(sefer);
      return {
        sefer,
        listing,
        inStock: Boolean(listing && listing.stockQty > 0),
        need: demandBySefer.get(sefer.seferId)?.need ?? 0,
      };
    });

    return [...withListing].sort((a, b) => {
      if (sortKey === 'price-high') return (b.listing?.price ?? 0) - (a.listing?.price ?? 0);
      if (sortKey === 'price-low') return (a.listing?.price ?? 0) - (b.listing?.price ?? 0);
      if (sortKey === 'type-az') {
        const aType = translateSeferType ? translateSeferType(a.sefer.type) : a.sefer.type;
        const bType = translateSeferType ? translateSeferType(b.sefer.type) : b.sefer.type;
        return aType.localeCompare(bType) || a.sefer.englishName.localeCompare(b.sefer.englishName);
      }
      if (sortKey === 'name-az') return a.sefer.englishName.localeCompare(b.sefer.englishName);
      // most-requested (default)
      return b.need - a.need || a.sefer.englishName.localeCompare(b.sefer.englishName);
    });
  }, [sefarim, demandBySefer, searchQuery, seferTypes, institutionIds, sortKey, translateSeferType]);

  return { loading, items };
}
