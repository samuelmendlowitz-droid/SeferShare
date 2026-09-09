import { useEffect, useMemo, useState } from 'react';
import type { Donation, DonationStatus, Sefer, SeferType } from '../types';
import { listMyDonations } from '../services/donations';
import { listSefarim } from '../services/sefarim';

export type MyDonationsSortKey = 'date-new' | 'date-old' | 'amount-high' | 'amount-low';

export interface MyDonationsFilters {
  seferTypes: SeferType[];
  statuses: DonationStatus[];
}

interface UseMyDonationsFeedResult {
  loading: boolean;
  donations: Donation[];
  availableSeferTypes: SeferType[];
}

export function useMyDonationsFeed(
  uid: string | undefined,
  filters: MyDonationsFilters,
  sortKey: MyDonationsSortKey,
): UseMyDonationsFeedResult {
  const [loading, setLoading] = useState(true);
  const [myDonations, setMyDonations] = useState<Donation[]>([]);
  const [sefarim, setSefarim] = useState<Sefer[]>([]);

  useEffect(() => {
    if (!uid) return;
    setLoading(true);
    Promise.all([listMyDonations(uid), listSefarim()])
      .then(([d, sef]) => {
        setMyDonations(d);
        setSefarim(sef);
      })
      .finally(() => setLoading(false));
  }, [uid]);

  const sefarimById = useMemo(() => new Map(sefarim.map((s) => [s.seferId, s])), [sefarim]);

  const availableSeferTypes = useMemo(() => {
    const types = new Set<SeferType>();
    myDonations.forEach((d) =>
      d.items.forEach((item) => {
        const sefer = sefarimById.get(item.seferId);
        if (sefer) types.add(sefer.type);
      }),
    );
    return [...types];
  }, [myDonations, sefarimById]);

  const donations = useMemo(() => {
    let result = myDonations;

    if (filters.seferTypes.length > 0) {
      result = result.filter((d) =>
        d.items.some((item) => {
          const sefer = sefarimById.get(item.seferId);
          return sefer && filters.seferTypes.includes(sefer.type);
        }),
      );
    }
    if (filters.statuses.length > 0) {
      result = result.filter((d) => filters.statuses.includes(d.status));
    }

    result = [...result].sort((a, b) => {
      if (sortKey === 'date-old') return a.createdAt - b.createdAt;
      if (sortKey === 'amount-high') return b.totalCharged - a.totalCharged;
      if (sortKey === 'amount-low') return a.totalCharged - b.totalCharged;
      return b.createdAt - a.createdAt; // date-new (default)
    });

    return result;
  }, [myDonations, filters, sortKey, sefarimById]);

  return { loading, donations, availableSeferTypes };
}
