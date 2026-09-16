import type { ParentGender } from './neshama';

export type StickerElementKey = 'label' | 'dedication' | 'donor';
export type StickerFrameValue = 'none' | 'thin' | 'double' | 'dashed' | 'dotted' | 'rounded' | 'ornate';
export type StickerDividerValue = 'none' | 'line' | 'dots' | 'starLine' | 'diamondLine' | 'doubleLine';
export type StickerFlourishValue = 'none' | 'star' | 'leaf' | 'menorah' | 'pomegranate' | 'crown';
export type StickerFontValue = 'sans' | 'serif' | 'script';

export interface StickerColorSet {
  background: string;
  frame: string;
  divider: string;
  flourish: string;
  label: string;
  dedication: string;
  donor: string;
}

/** The dedication sticker's editable design — chosen in the cart (see
 *  StickerDesignEditor) and printed on every physical sefer this donation
 *  covers. Deliberately holds only the visual choices (layout, frame, divider,
 *  flourish, phrase, fonts, colors) — never the donation-specific text (the
 *  dedication name, donor name, etc; see StickerContent), so the same design
 *  can be reused across different donations. */
export interface StickerDesign {
  layout: string;
  frame: StickerFrameValue;
  divider: StickerDividerValue;
  flourish: StickerFlourishValue;
  /** The phrase shown before the dedication name — e.g. "L'iluy Nishmat" or
   *  "In Loving Memory of" (see STICKER_DEDICATION_PHRASES). */
  dedicationPhrase: string;
  /** Font style per text element — label, dedication name, and donor line can
   *  each use a different one. */
  fonts: Record<StickerElementKey, StickerFontValue>;
  colors: StickerColorSet;
}

/** A sticker design saved to the designer's own library — auto-saved (and
 *  assigned this designId) as soon as they start customizing one in the cart,
 *  so they can name, re-select, keep editing, or delete it later (see
 *  useStickerDesigns / StickerDesignEditor). */
export interface SavedStickerDesign {
  designId: string;
  createdByUid: string;
  name: string;
  design: StickerDesign;
  createdAt: number;
  updatedAt: number;
}

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
  namePrefix?: string;
  customNamePrefix?: string;
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
  // The visual design (layout/frame/divider/flourish/font/colors) applied to every
  // sticker this donation prints — chosen in the cart; see StickerDesignEditor.
  stickerDesign?: StickerDesign;
  ad?: DonationAd;
  roundedUpFee: boolean;
  totalCharged: number;

  status: DonationStatus;
  createdAt: number;
}
