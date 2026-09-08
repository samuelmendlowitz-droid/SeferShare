import type { SeferType } from './common';

/**
 * Client-safe vendor listing. `wholesalePrice` intentionally omitted —
 * it must never appear in any client bundle or API response (spec §5.4, §18).
 */
export const MAX_SEFER_IMAGES = 4;

export interface PublicVendorListing {
  vendorId: string;
  vendorName: string;
  price: number;
  inStock: boolean;
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
