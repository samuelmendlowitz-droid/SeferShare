export type DonationStatus = 'pending' | 'paid' | 'fulfilled' | 'refunded';

export const DONATION_STATUSES: DonationStatus[] = ['pending', 'paid', 'fulfilled', 'refunded'];

export interface DonationItem {
  seferId: string;
  vendorId: string;
  quantity: number;
  priceEach: number;
  /** Set when added to the pushka straight from a campaign's page. */
  campaignId?: string;
}

export interface CampaignAssignment {
  campaignId: string;
  itemsFulfilled: number;
}

/** A named LI"N dedication the donor adds at checkout. */
export interface DonationDedication {
  name: string;
  hebrewName?: string;
  relationship?: string;
  message?: string;
}

/** A small ad sticker for the donor's own business, included alongside the dedication. */
export interface DonationAd {
  businessName: string;
  message?: string;
}

export interface Donation {
  donationId: string;
  donorUid: string;
  stripePaymentIntentId: string;

  items: DonationItem[];

  // Set by donor at checkout, or left blank for the algorithm to assign server-side
  requestedInstitutionId?: string;
  requestedNeshamaId?: string;

  campaignAssignments: CampaignAssignment[];

  donorMessage?: string;
  // Sticker dedication for items whose campaign has no neshama of its own (items
  // whose campaign already carries a neshama always use that one instead).
  donorDedication?: DonationDedication;
  // Extra LI"N dedications the donor wants remembered but not printed on a sticker.
  additionalDedications?: DonationDedication[];
  ad?: DonationAd;
  roundedUpFee: boolean;
  totalCharged: number;

  status: DonationStatus;
  createdAt: number;
}
