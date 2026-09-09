import type { SeferType } from './common';

/**
 * Client-safe vendor listing. `wholesalePrice` intentionally omitted —
 * it must never appear in any client bundle or API response (spec §5.4, §18).
 */
export const MAX_SEFER_IMAGES = 4;

/** stockQty at or below this (but above 0) counts as "low stock" for filtering. */
export const LOW_STOCK_THRESHOLD = 5;

export interface PublicVendorListing {
  vendorId: string;
  vendorName: string;
  price: number;
  stockQty: number;
  /** Up to MAX_SEFER_IMAGES photos, shown shopping-site style wherever this listing appears. */
  imageUrls?: string[];
}

export interface Sefer {
  seferId: string;
  hebrewName: string;
  englishName: string;
  phoneticName: string;
  type: SeferType;
  vendorListings: PublicVendorListing[];
}

export type StockStatus = 'in' | 'low' | 'out';

export function classifyStockStatus(stockQty: number): StockStatus {
  if (stockQty <= 0) return 'out';
  if (stockQty <= LOW_STOCK_THRESHOLD) return 'low';
  return 'in';
}
