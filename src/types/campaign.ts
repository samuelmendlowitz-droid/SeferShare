import type { Address, Language } from './common';

export type CampaignStatus = 'active' | 'fulfilled' | 'paused';

export interface CampaignItem {
  seferId: string;
  vendorId: string;
  quantity: number;
  quantityFulfilled: number;
  retailPrice: number; // snapshot at time of campaign creation
}

export interface Campaign {
  campaignId: string;
  createdByUid: string;
  title?: string;
  description?: string;

  // At least one of institutionId or neshamaId must be set (enforced at write time)
  institutionId?: string; // Where
  neshamaId?: string; // Who

  items: CampaignItem[]; // What
  shippingAddress: Address;

  status: CampaignStatus;
  totalItemsNeeded: number;
  totalItemsFulfilled: number;

  lastProgressAt: number;
  currentMilestone: number; // 1-10, which 10% band we're currently filling

  language: Language;
  createdAt: number;
  updatedAt: number;
}
