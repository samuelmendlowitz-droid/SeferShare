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
  /** Each institution needs its own admin verification, separate from its
   *  owner's person-level institutionOwnerApproved — starts false at creation,
   *  only ever flipped server-side (see functions/src/verifyInstitution.ts).
   *  Only a verified institution can receive donations, claim unassigned
   *  seforim, or appear in "Campaigns for My Institution". */
  verified: boolean;
  /** Funded by gift card donations (see DonationGiftCard) — spendable by the
   *  institution's owner on seforim for itself. Only ever changed server-side
   *  (see functions/src/confirmDonation.ts and spendInstitutionBalance.ts). */
  giftCardBalance?: number;
  createdAt: number;
}
