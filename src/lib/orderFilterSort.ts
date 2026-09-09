import type { Order, OrderStatus, Sefer, SeferType } from '../types';

export type OrderSortKey = 'date-new' | 'date-old' | 'size-high' | 'size-low' | 'sefer-az';

export interface OrderFilters {
  seferTypes: SeferType[];
  statuses?: OrderStatus[];
}

function orderSize(order: Order): number {
  return order.items.reduce((sum, i) => sum + i.quantity, 0);
}

function orderFirstSeferName(order: Order, sefarimById: Map<string, Sefer>): string {
  const names = order.items
    .map((i) => sefarimById.get(i.seferId)?.englishName)
    .filter((n): n is string => Boolean(n));
  return names.sort()[0] ?? '';
}

export function filterSortOrders(
  orders: Order[],
  filters: OrderFilters,
  sortKey: OrderSortKey,
  sefarimById: Map<string, Sefer>,
): Order[] {
  let result = orders;

  if (filters.seferTypes.length > 0) {
    result = result.filter((o) =>
      o.items.some((item) => {
        const sefer = sefarimById.get(item.seferId);
        return sefer && filters.seferTypes.includes(sefer.type);
      }),
    );
  }
  if (filters.statuses && filters.statuses.length > 0) {
    const statuses = filters.statuses;
    result = result.filter((o) => statuses.includes(o.status));
  }

  return [...result].sort((a, b) => {
    if (sortKey === 'date-old') return a.createdAt - b.createdAt;
    if (sortKey === 'size-high') return orderSize(b) - orderSize(a);
    if (sortKey === 'size-low') return orderSize(a) - orderSize(b);
    if (sortKey === 'sefer-az') return orderFirstSeferName(a, sefarimById).localeCompare(orderFirstSeferName(b, sefarimById));
    return b.createdAt - a.createdAt; // date-new (default)
  });
}
