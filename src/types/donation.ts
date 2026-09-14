import type { ParentGender } from './neshama';

export type DonationStatus = 'pending' | 'paid' | 'fulfilled' | 'refunded';

export const DONATION_STATUSES: DonationStatus[] = ['pending', 'paid', 'fulfilled', 'refunded'];

export interface DonationItem {
  seferId: string;
  vendorId: string;
  quantity: number;
  priceEach: number;
  /** Set when added to the pushka straight from a campaign's page. */
  campaignId?: string;
  /** Set when the donor picked a specific institution for this sefer at checkout
   *  (items added generically from the Seforim shopping tab, not tied to a campaign). */
  requestedInstitutionId?: string;
}

export interface CampaignAssignment {
  campaignId: string;
  itemsFulfilled: number;
}

/** A monetary gift card given to an institution instead of specific seforim — adds
 *  straight to that institution's giftCardBalance, which its owner can later spend on
 *  seforim for themselves (with their own dedication and ad; see spendInstitutionBalance).
 *  Never carries a dedication of its own — no physical sefer to print a sticker on. */
export interface DonationGiftCard {
  institutionId: string;
  institutionName?: string;
  /** Set when given through a specific campaign's page, purely for display. */
  campaignId?: string;
  campaignTitle?: string;
  amount: number;
}

/** A named LI"N dedication the donor adds at checkout. */
export interface DonationDedication {
  name: string;
  hebrewName?: string;
  parentGender?: ParentGender;
  fatherHebrewName?: string;
  message?: string;
}

/** A small ad sticker for the donor's own business, included alongside the dedication. */
export interface DonationAd {
  businessName: string;
  message?: string;
}

/** The dedication printed on one physical Sefer copy, resolved server-side at
 *  confirmDonation time (see functions/src/dedication.ts). */
export interface DonationSticker {
  seferId: string;
  vendorId: string;
  copyIndex: number;
  dedication: DonationDedication;
  source: 'donor' | 'campaign' | 'algorithm';
}

export interface Donation {
  donationId: string;
  donorUid: string;
  stripePaymentIntentId: string;
  /** 'giftCardBalance' when an institution paid for its own seforim out of its
   *  balance rather than a donor paying by card — see spendInstitutionBalance.
   *  Absent (or 'stripe') for an ordinary donation. */
  paymentMethod?: 'stripe' | 'giftCardBalance';

  items: DonationItem[];
  giftCards?: DonationGiftCard[];

  // Set by donor at checkout, or left blank for the algorithm to assign server-side
  requestedInstitutionId?: string;
  requestedNeshamaId?: string;

  campaignAssignments: CampaignAssignment[];

  donorMessage?: string;
  // One dedication for the whole cart. When set, it's printed on every sticker;
  // left blank, each item falls back to its own campaign's first neshama, or an
  // algorithm-picked one when the campaign has none (see functions/src/algorithm.ts).
  donorDedication?: DonationDedication;
  // Per-physical-copy dedication, resolved at confirmDonation time.
  stickers?: DonationSticker[];
  ad?: DonationAd;
  roundedUpFee: boolean;
  totalCharged: number;

  status: DonationStatus;
  createdAt: number;
}
