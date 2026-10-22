import type { Address, ColorTheme, Language } from './common';

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

/** Campaign-specific alias of the shared ColorTheme (see common.ts) — kept so
 *  existing imports of `CampaignColorTheme` don't need to change. */
export type CampaignColorTheme = ColorTheme;

/** Most photos a campaign's gallery wheel shows — same cap philosophy as
 *  MAX_INSTITUTION_IMAGES. */
export const MAX_CAMPAIGN_IMAGES = 6;

export interface Campaign {
  campaignId: string;
  createdByUid: string;
  title?: string;
  description?: string;
  /** @deprecated superseded by `images` (images[0] is the primary/card photo) —
   *  kept for campaigns saved before that field existed. */
  headerImageUrl?: string;
  /** Shown on the card/detail page as a swipeable gallery wheel; the first
   *  photo is the one that appears on the info card — see ImageUploadField's
   *  primary-photo selection. */
  images?: string[];
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
