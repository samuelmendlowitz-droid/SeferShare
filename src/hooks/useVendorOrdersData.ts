import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Order, Sefer, SeferType } from '../types';
import { listVendorOrders } from '../services/orders';
import { listSefarim } from '../services/sefarim';

interface UseVendorOrdersDataResult {
  loading: boolean;
  orders: Order[];
  sefarimById: Map<string, Sefer>;
  availableSeferTypes: SeferType[];
  reload: () => Promise<void>;
}

/** Shared raw fetch for the Orders and Sales tabs — both read the same Order collection. */
export function useVendorOrdersData(uid: string | undefined): UseVendorOrdersDataResult {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [sefarim, setSefarim] = useState<Sefer[]>([]);

  const reload = useCallback(async () => {
    if (!uid) return;
    setLoading(true);
    try {
      const [o, sef] = await Promise.all([listVendorOrders(uid), listSefarim()]);
      setOrders(o);
      setSefarim(sef);
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const sefarimById = useMemo(() => new Map(sefarim.map((s) => [s.seferId, s])), [sefarim]);

  const availableSeferTypes = useMemo(() => {
    const types = new Set<SeferType>();
    orders.forEach((o) =>
      o.items.forEach((item) => {
        const sefer = sefarimById.get(item.seferId);
        if (sefer) types.add(sefer.type);
      }),
    );
    return [...types];
  }, [orders, sefarimById]);

  return { loading, orders, sefarimById, availableSeferTypes, reload };
}
