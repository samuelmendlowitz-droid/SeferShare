import { useMemo } from 'react';
import type { Campaign, Neshama, SeferType } from '../types';
import { useCampaignFeedData } from './useCampaignFeed';

export type NeshamosSortKey = 'name-az' | 'size';

export interface NeshamosFeedOptions {
  seferTypes?: SeferType[];
  sortKey?: NeshamosSortKey;
}

export interface NeshamaSummary {
  neshama: Neshama;
  totalNeeded: number;
  totalFulfilled: number;
  seferTypes: SeferType[];
}

/** The Neshamas tab: people currently dedicated to at least one campaign, with the
 *  aggregate seforim requested l'iluy nishmasam across all of them. */
export function useNeshamosFeed(searchQuery: string, options: NeshamosFeedOptions = {}) {
  const { seferTypes = [], sortKey = 'name-az' } = options;
  const { loading, campaigns, neshamosById, sefarimById } = useCampaignFeedData(searchQuery);

  const neshamas = useMemo<NeshamaSummary[]>(() => {
    const byNeshama = new Map<string, Campaign[]>();
    for (const c of campaigns) {
      if (!c.neshamaId) continue;
      const list = byNeshama.get(c.neshamaId) ?? [];
      list.push(c);
      byNeshama.set(c.neshamaId, list);
    }

    let result: NeshamaSummary[] = [];
    for (const [neshamaId, campaignsForNeshama] of byNeshama) {
      const neshama = neshamosById.get(neshamaId);
      if (!neshama) continue;
      let totalNeeded = 0;
      let totalFulfilled = 0;
      const types = new Set<SeferType>();
      for (const c of campaignsForNeshama) {
        totalNeeded += c.totalItemsNeeded;
        totalFulfilled += c.totalItemsFulfilled;
        for (const item of c.items) {
          const sefer = sefarimById.get(item.seferId);
          if (sefer) types.add(sefer.type);
        }
      }
      result.push({ neshama, totalNeeded, totalFulfilled, seferTypes: [...types] });
    }

    if (seferTypes.length > 0) {
      result = result.filter((r) => r.seferTypes.some((type) => seferTypes.includes(type)));
    }

    result.sort((a, b) => {
      if (sortKey === 'size') return b.totalNeeded - a.totalNeeded;
      return a.neshama.name.localeCompare(b.neshama.name);
    });

    return result;
  }, [campaigns, neshamosById, sefarimById, seferTypes, sortKey]);

  return { loading, neshamas };
}
