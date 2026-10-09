import type { Address, Language } from './common';

export type CampaignStatus = 'active' | 'fulfilled' | 'paused';

export interface CampaignItem {
  seferId: string;
  vendorId: string;
  quantity: number;
  quantityFulfilled: number;
  retailPrice: number; // snapshot at time of campaign creation
}

/** What a campaign is primarily for — decides which of institution/neshama
 *  shows on its card and detail page, and the destination donors are
 *  prompted to choose at checkout when the campaign has no institution of
 *  its own (see CampaignCard, CampaignDetailPage, PushkaPage). Both an
 *  institution and neshama(s) can still be attached to either objective —
 *  this only picks which one is "the point." */
export type CampaignObjective = 'institution' | 'neshama';

/** The three hex colors a campaign's creator can pick to personalize its
 *  card/detail page — background (the card/header surface), primary (the
 *  progress bar and headline number), and accent (link-style text, e.g. the
 *  institution/neshama name). See lib/campaignTheme.ts for the defaults every
 *  campaign created before this field existed falls back to. */
export interface CampaignColorTheme {
  background: string;
  primary: string;
  accent: string;
}

export interface Campaign {
  campaignId: string;
  createdByUid: string;
  title?: string;
  description?: string;
  headerImageUrl?: string;
  colorTheme?: CampaignColorTheme;
  /** Informational date range (YYYY-MM-DD, like Neshama's dateOfBirth/dateOfDeath) —
   *  shown on the card/detail page. Purely descriptive: reaching endDate doesn't
   *  pause or hide the campaign (status is still owner/algorithm controlled). */
  startDate?: string;
  endDate?: string;

  objective: CampaignObjective;
  // Where — required when objective is 'institution'; optional when it's
  // 'neshama' (an institution can still be attached, but doesn't have to
  // be — see PushkaPage's "available to claim" cart flow for that case).
  institutionId?: string;
  // Neshamas are optional add-ons on an 'institution' campaign, but the point
  // of a 'neshama' campaign; the first one is the sticker default when the
  // donor doesn't choose their own (see algorithm.ts for the no-neshama fallback).
  neshamaIds?: string[]; // Who

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
