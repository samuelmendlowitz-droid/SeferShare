import { useEffect, useMemo, useState } from 'react';
import type { Neshama, SeferType } from '../types';
import { listNeshamos } from '../services/neshamos';

export type NeshamosSortKey = 'recommended' | 'name-az';

export interface NeshamosFeedOptions {
  seferTypes?: SeferType[];
  sortKey?: NeshamosSortKey;
}

export interface NeshamaSummary {
  neshama: Neshama;
}

/** The Neshamas tab: every neshama in the system — they're independent records now,
 *  not tied to having an active campaign (a campaign is just one optional way to
 *  donate in their honor; see NeshamaDetailPage). */
export function useNeshamosFeed(searchQuery: string, options: NeshamosFeedOptions = {}) {
  const { seferTypes = [], sortKey = 'recommended' } = options;
  const [loading, setLoading] = useState(true);
  const [allNeshamos, setAllNeshamos] = useState<Neshama[]>([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listNeshamos()
      .then((n) => {
        if (!cancelled) setAllNeshamos(n);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const neshamas = useMemo<NeshamaSummary[]>(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = allNeshamos;
    if (q) {
      list = list.filter((n) => n.name.toLowerCase().includes(q) || n.hebrewName?.includes(q));
    }
    if (seferTypes.length > 0) {
      list = list.filter((n) => (n.seferTypes ?? []).some((type) => seferTypes.includes(type)));
    }

    const sorted = [...list].sort((a, b) => {
      if (sortKey === 'name-az') return a.name.localeCompare(b.name);
      // "recommended" (default): neshamas that have gone longest without an
      // algorithm-picked dedication surface first (never-dedicated first of all).
      return (a.lastDedicatedAt ?? 0) - (b.lastDedicatedAt ?? 0);
    });

    return sorted.map((neshama) => ({ neshama }));
  }, [allNeshamos, searchQuery, seferTypes, sortKey]);

  return { loading, neshamas };
}
