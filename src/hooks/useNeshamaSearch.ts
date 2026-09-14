import { useEffect, useMemo, useState } from 'react';
import type { Neshama } from '../types';
import { listNeshamos } from '../services/neshamos';

export type NeshamaSearchSortKey = 'recommended' | 'az' | 'za';

/** Shared search/sort/fetch behind both neshama pickers (campaign create/edit's
 *  multi-select, and the pushka's single cart-wide dedication picker). */
export function useNeshamaSearch() {
  const [neshamos, setNeshamos] = useState<Neshama[]>([]);
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<NeshamaSearchSortKey>('recommended');

  useEffect(() => {
    listNeshamos().then(setNeshamos);
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = neshamos;
    if (q) {
      list = list.filter((n) => n.name.toLowerCase().includes(q) || n.hebrewName?.includes(q));
    }
    return [...list].sort((a, b) => {
      if (sortKey === 'az') return a.name.localeCompare(b.name);
      if (sortKey === 'za') return b.name.localeCompare(a.name);
      // recommended (default): longest-waiting-for-a-dedication surfaces first;
      // never-yet-dedicated neshamas (no lastDedicatedAt) come first of all.
      return (a.lastDedicatedAt ?? 0) - (b.lastDedicatedAt ?? 0);
    });
  }, [neshamos, query, sortKey]);

  function addCreated(neshama: Neshama) {
    setNeshamos((prev) => [...prev, neshama]);
  }

  return { neshamos, setNeshamos, addCreated, query, setQuery, sortKey, setSortKey, results };
}
