import type { Campaign } from '../types';

/** Dollar total is always secondary/display-only — item counts drive campaign progress (spec §18). */
export function campaignDollarTotal(campaign: Campaign): number {
  return campaign.items.reduce((sum, item) => sum + item.retailPrice * item.quantity, 0);
}

export function campaignDollarFulfilled(campaign: Campaign): number {
  return campaign.items.reduce((sum, item) => sum + item.retailPrice * item.quantityFulfilled, 0);
}
