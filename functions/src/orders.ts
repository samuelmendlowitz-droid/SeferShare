import type { DonationItem } from './types';

/** Groups a donation's items by vendor so each vendor gets its own dropship order (spec §2, §6). */
export function splitOrdersByVendor(items: DonationItem[]): Map<string, DonationItem[]> {
  const byVendor = new Map<string, DonationItem[]>();
  for (const item of items) {
    const list = byVendor.get(item.vendorId) ?? [];
    list.push(item);
    byVendor.set(item.vendorId, list);
  }
  return byVendor;
}
