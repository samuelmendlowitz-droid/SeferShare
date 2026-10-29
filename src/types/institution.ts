import type { Address, ColorTheme } from './common';

export type InstitutionType = 'shul' | 'yeshiva' | 'kolel' | 'school' | 'other';

export const INSTITUTION_TYPES: InstitutionType[] = ['shul', 'yeshiva', 'kolel', 'school', 'other'];

/** Most photos an institution's gallery wheel shows — same cap philosophy as
 *  MAX_SEFER_IMAGES, just a separate constant since the two galleries are
 *  unrelated and may want to diverge later. */
export const MAX_INSTITUTION_IMAGES = 6;

export interface Institution {
  institutionId: string;
  name: string;
  hebrewName?: string;
  type: InstitutionType;
  /** Set when `type` is 'other' — the creator's own free-text name for a type
   *  not in the curated list. */
  customType?: string;
  address: Address;
  /** Where physical seforim ship — e.g. a separate storage garage — when it
   *  differs from the institution's own address above. Falls back to
   *  `address` wherever a destination is needed (fulfillment, shipments). */
  shippingAddress?: Address;
  /** Shown on the institution's info page as a swipeable gallery wheel. */
  images?: string[];
  /** A small square mark shown alongside the institution's name wherever it's
   *  referenced (its own card, a campaign's card/detail page) — separate from
   *  `images` since it's displayed uncropped (object-contain), not as a photo
   *  in the gallery. */
  logoUrl?: string;
  bio?: string;
  /** Free-text highlights (one per line) — e.g. programs run, milestones reached. */
  accomplishments?: string;
  /** Personalizes this institution's own info page — see ColorTheme in common.ts. */
  colorTheme?: ColorTheme;
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
