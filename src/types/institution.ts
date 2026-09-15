import type { Address } from './common';

export type InstitutionType = 'shul' | 'yeshiva' | 'school' | 'other';

export const INSTITUTION_TYPES: InstitutionType[] = ['shul', 'yeshiva', 'school', 'other'];

export interface Institution {
  institutionId: string;
  name: string;
  hebrewName?: string;
  type: InstitutionType;
  /** Set when `type` is 'other' — the creator's own free-text name for a type
   *  not in the curated list. */
  customType?: string;
  address: Address;
  createdByUid: string;
  /** Funded by gift card donations (see DonationGiftCard) — spendable by the
   *  institution's owner on seforim for itself. Only ever changed server-side
   *  (see functions/src/confirmDonation.ts and spendInstitutionBalance.ts). */
  giftCardBalance?: number;
  createdAt: number;
}
