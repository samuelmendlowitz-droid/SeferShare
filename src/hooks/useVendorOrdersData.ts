import { useEffect, useMemo, useState } from 'react';
import type { Order, Sefer, SeferType } from '../types';
import { listVendorOrders } from '../services/orders';
import { listSefarim } from '../services/sefarim';

interface UseVendorOrdersDataResult {
  loading: boolean;
  orders: Order[];
  sefarimById: Map<string, Sefer>;
  availableSeferTypes: SeferType[];
}

/** Shared raw fetch for the Orders and Sales tabs — both read the same Order collection. */
export function useVendorOrdersData(uid: string | undefined): UseVendorOrdersDataResult {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [sefarim, setSefarim] = useState<Sefer[]>([]);

  useEffect(() => {
    if (!uid) return;
    setLoading(true);
    Promise.all([listVendorOrders(uid), listSefarim()])
      .then(([o, sef]) => {
        setOrders(o);
        setSefarim(sef);
      })
      .finally(() => setLoading(false));
  }, [uid]);

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

  return { loading, orders, sefarimById, availableSeferTypes };
}
