import type { SeferType } from './common';

/**
 * Client-safe vendor listing. `wholesalePrice` intentionally omitted —
 * it must never appear in any client bundle or API response (spec §5.4, §18).
 */
export interface PublicVendorListing {
  vendorId: string;
  vendorName: string;
  price: number;
  inStock: boolean;
  imageUrl?: string;
}

export interface Sefer {
  seferId: string;
  hebrewName: string;
  englishName: string;
  phoneticName: string;
  type: SeferType;
  vendorListings: PublicVendorListing[];
}
