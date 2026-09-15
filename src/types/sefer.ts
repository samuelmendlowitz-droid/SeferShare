import type { SeferLanguage, SeferType } from './common';

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
  /** Set when `type` is 'other' — the vendor's own free-text name for a type not
   *  in the curated list. */
  customType?: string;
  /** Which specific work/volume this is within its type (e.g. type "gemara",
   *  subType "succah") — see src/lib/seferTaxonomy.ts for the full list per type.
   *  The sentinel value 'other' means "see customSubType" instead. */
  subType?: string;
  /** Set when `subType` is 'other' — the vendor's own free-text name for a
   *  specific volume not in the curated list (or when the type has none at all). */
  customSubType?: string;
  /** The language(s) this edition's text is printed in. */
  languages?: SeferLanguage[];
  vendorListings: PublicVendorListing[];
}

export type StockStatus = 'in' | 'low' | 'out';

export function classifyStockStatus(stockQty: number): StockStatus {
  if (stockQty <= 0) return 'out';
  if (stockQty <= LOW_STOCK_THRESHOLD) return 'low';
  return 'in';
}
