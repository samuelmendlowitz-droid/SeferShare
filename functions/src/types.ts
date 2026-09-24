export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export type CampaignStatus = 'active' | 'fulfilled' | 'paused';

export interface CampaignItem {
  seferId: string;
  vendorId: string;
  quantity: number;
  quantityFulfilled: number;
  retailPrice: number;
}

export interface Campaign {
  campaignId: string;
  createdByUid: string;
  title?: string | null;
  institutionId: string;
  neshamaIds?: string[];
  items: CampaignItem[];
  shippingAddress: Address;
  status: CampaignStatus;
  totalItemsNeeded: number;
  totalItemsFulfilled: number;
  lastProgressAt: FirebaseFirestore.Timestamp;
  currentMilestone: number;
  language: 'en' | 'he' | 'both';
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

export type DonationStatus = 'pending' | 'paid' | 'fulfilled' | 'refunded' | 'failed';

export interface DonationItem {
  seferId: string;
  vendorId: string;
  quantity: number;
  priceEach: number;
  /** Set when added to the pushka straight from a campaign's page — credited to
   *  that exact campaign first, uncapped by the milestone algorithm (see algorithm.ts). */
  campaignId?: string;
  /** Set when the donor picked a specific institution for this sefer at checkout
   *  (items added generically from the Seforim shopping tab, not tied to a campaign) —
   *  honored uncapped against that institution's active campaigns (see algorithm.ts). */
  requestedInstitutionId?: string;
}

export interface CampaignAssignment {
  campaignId: string;
  itemsFulfilled: number;
}

/** A monetary gift card given to an institution instead of specific seforim — adds
 *  straight to that institution's giftCardBalance (see confirmDonation.ts and
 *  spendInstitutionBalance.ts). Never carries a dedication of its own. */
export interface DonationGiftCard {
  institutionId: string;
  institutionName?: string;
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
  parentGender?: 'son' | 'daughter';
  fatherHebrewName?: string;
  message?: string;
}

export interface Neshama {
  neshamaId: string;
  createdByUid: string;
  namePrefix?: string;
  customNamePrefix?: string;
  name: string;
  hebrewName?: string;
  parentGender: 'son' | 'daughter';
  fatherHebrewName: string;
  seferTypes?: string[];
  seferIds?: string[];
  lastDedicatedAt?: number;
  createdAt: FirebaseFirestore.Timestamp;
}

/** A small ad sticker for the donor's own business, included alongside the dedication. */
export interface DonationAd {
  businessName: string;
  message?: string;
}

export type StickerElementKey = 'label' | 'dedication' | 'donor';

export interface StickerColorSet {
  background: string;
  frame: string;
  divider: string;
  flourish: string;
  label: string;
  dedication: string;
  donor: string;
}

/** The dedication sticker's editable design, chosen in the cart — see
 *  src/lib/stickerDesign.ts on the client for the curated option lists this
 *  references. Opaque here: the server just stores and echoes it back. */
export interface StickerDesign {
  layout: string;
  frame: 'none' | 'thin' | 'double' | 'dashed' | 'dotted' | 'rounded' | 'ornate';
  divider: 'none' | 'line' | 'dots' | 'starLine' | 'diamondLine' | 'doubleLine';
  flourish: 'none' | 'star' | 'leaf' | 'menorah' | 'pomegranate' | 'crown';
  dedicationPhrase: string;
  fonts: Record<StickerElementKey, 'sans' | 'serif' | 'script'>;
  colors: StickerColorSet;
}

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
  stripePaymentIntentId: string | null;
  /** 'giftCardBalance' when an institution paid out of its own balance rather than
   *  a donor paying by card — see spendInstitutionBalance.ts. */
  paymentMethod?: 'stripe' | 'giftCardBalance';
  items: DonationItem[];
  giftCards?: DonationGiftCard[];
  requestedInstitutionId?: string | null;
  requestedNeshamaId?: string | null;
  campaignAssignments: CampaignAssignment[];
  donorMessage?: string | null;
  // One dedication for the whole cart — printed on every sticker when set; falls
  // back per-item to that campaign's first neshama, or an algorithm pick, otherwise.
  donorDedication?: DonationDedication | null;
  // Per-physical-copy dedication, resolved at confirmDonation time (see dedication.ts).
  stickers?: DonationSticker[];
  stickerDesign?: StickerDesign | null;
  ad?: DonationAd | null;
  roundedUpFee: boolean;
  totalCharged: number;
  status: DonationStatus;
  createdAt: FirebaseFirestore.Timestamp;
}

export interface Institution {
  institutionId: string;
  name: string;
  hebrewName?: string;
  type: string;
  customType?: string;
  address: Address;
  createdByUid: string;
  verified: boolean;
  giftCardBalance?: number;
  createdAt: FirebaseFirestore.Timestamp;
}

export type OrderStatus = 'pending' | 'shipped' | 'delivered';

export interface OrderItem {
  seferId: string;
  quantity: number;
  priceEach: number;
}

export interface Order {
  orderId: string;
  donationId: string;
  vendorId: string;
  items: OrderItem[];
  shippingAddress: Address;
  status: OrderStatus;
  createdAt: FirebaseFirestore.Timestamp;
}

export interface VendorPricing {
  seferId: string;
  vendorId: string;
  retailPrice: number;
  wholesalePrice: number;
}

export interface PublicVendorListing {
  vendorId: string;
  vendorName: string;
  price: number;
  stockQty: number;
  imageUrls?: string[];
}

export interface Sefer {
  seferId: string;
  hebrewName: string;
  englishName: string;
  phoneticName: string;
  type: string;
  customType?: string;
  subType?: string;
  customSubType?: string;
  languages?: string[];
  vendorListings: PublicVendorListing[];
}

export interface VendorApplication {
  companyName: string;
  contactName: string;
  address: Address;
  phone: string;
  email: string;
  notes?: string;
  submittedAt: number;
}

export interface InstitutionOwnerApplication {
  institutionName: string;
  contactName: string;
  address: Address;
  phone: string;
  email: string;
  notes?: string;
  submittedAt: number;
}

export interface User {
  uid: string;
  displayName: string;
  email: string;
  isVendor: boolean;
  vendorApproved: boolean;
  vendorApplication?: VendorApplication;
  isInstitutionOwner: boolean;
  institutionOwnerApproved: boolean;
  institutionOwnerApplication?: InstitutionOwnerApplication;
  isAdmin?: boolean;
  blocked?: boolean;
  stripeCustomerId?: string;
}

export type NotificationKind =
  | 'donation_received'
  | 'campaign_fulfilled'
  | 'payment_confirmed'
  | 'vendor_application_received'
  | 'vendor_application_approved'
  | 'vendor_application_declined'
  | 'institution_owner_application_received'
  | 'institution_owner_application_approved'
  | 'institution_owner_application_declined'
  | 'institution_verified';
