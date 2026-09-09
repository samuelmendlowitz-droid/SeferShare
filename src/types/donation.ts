export type DonationStatus = 'pending' | 'paid' | 'fulfilled' | 'refunded';

export const DONATION_STATUSES: DonationStatus[] = ['pending', 'paid', 'fulfilled', 'refunded'];

export interface DonationItem {
  seferId: string;
  vendorId: string;
  quantity: number;
  priceEach: number;
}

export interface CampaignAssignment {
  campaignId: string;
  itemsFulfilled: number;
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
  roundedUpFee: boolean;
  totalCharged: number;

  status: DonationStatus;
  createdAt: number;
}
