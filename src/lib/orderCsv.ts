import type { Order, Sefer } from '../types';

function escapeCsvValue(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/** One row per line item (not per order) — the shape a vendor packing an order
 *  actually wants to check items off against. */
export function ordersToCsv(orders: Order[], sefarimById: Map<string, Sefer>): string {
  const header = [
    'Order ID',
    'Date',
    'Status',
    'Sefer (English)',
    'Sefer (Hebrew)',
    'Quantity',
    'Price Each',
    'Line Total',
    'Address Line 1',
    'Address Line 2',
    'City',
    'State',
    'Postal Code',
    'Country',
  ];

  const rows = orders.flatMap((order) => {
    const dateStr = new Date(order.createdAt).toLocaleDateString();
    const addr = order.shippingAddress;
    return order.items.map((item) => {
      const sefer = sefarimById.get(item.seferId);
      return [
        order.orderId,
        dateStr,
        order.status,
        sefer?.englishName ?? item.seferId,
        sefer?.hebrewName ?? '',
        String(item.quantity),
        item.priceEach.toFixed(2),
        (item.priceEach * item.quantity).toFixed(2),
        addr?.line1 ?? '',
        addr?.line2 ?? '',
        addr?.city ?? '',
        addr?.state ?? '',
        addr?.postalCode ?? '',
        addr?.country ?? '',
      ];
    });
  });

  return [header, ...rows].map((row) => row.map(escapeCsvValue).join(',')).join('\n');
}

/** Triggers a browser download of the given CSV text as a file. */
export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
