import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { db } from './lib/firebaseAdmin';
import type { Campaign, CampaignAssignment, DonationItem } from './types';

interface MutableCampaign extends Campaign {
  id: string;
}

const MAX_MILESTONE = 10;

function remainingForMilestone(campaign: MutableCampaign): number {
  const milestoneTarget = Math.ceil(campaign.totalItemsNeeded * (campaign.currentMilestone / MAX_MILESTONE));
  return Math.max(0, milestoneTarget - campaign.totalItemsFulfilled);
}

/**
 * Applies as much of `available` (grouped by seferId+vendorId) as the campaign's
 * items still need, capped by `cap` (the current 10% milestone allowance, or
 * Infinity when the donor targeted this campaign directly — spec §7).
 */
function applyToCampaign(
  campaign: MutableCampaign,
  available: Map<string, number>,
  cap: number,
): number {
  let assigned = 0;
  for (const item of campaign.items) {
    if (assigned >= cap) break;
    const key = `${item.seferId}::${item.vendorId}`;
    const have = available.get(key) ?? 0;
    const need = item.quantity - item.quantityFulfilled;
    if (have <= 0 || need <= 0) continue;

    const take = Math.min(have, need, cap - assigned);
    if (take <= 0) continue;

    item.quantityFulfilled += take;
    assigned += take;
    available.set(key, have - take);
  }

  if (assigned > 0) {
    campaign.totalItemsFulfilled += assigned;
    if (campaign.totalItemsFulfilled >= campaign.totalItemsNeeded) {
      campaign.status = 'fulfilled';
    }
    // Advance past every 10% band the donation just crossed, resetting the clock each time (§7.2).
    while (
      campaign.currentMilestone < MAX_MILESTONE &&
      campaign.totalItemsFulfilled >=
        Math.ceil(campaign.totalItemsNeeded * (campaign.currentMilestone / MAX_MILESTONE))
    ) {
      campaign.currentMilestone += 1;
    }
    campaign.lastProgressAt = Timestamp.now();
  }

  return assigned;
}

function keyFor(seferId: string, vendorId: string) {
  return `${seferId}::${vendorId}`;
}

export interface AssignDonationInput {
  items: DonationItem[];
  requestedInstitutionId?: string;
  requestedNeshamaId?: string;
}

export async function assignDonationToCampaigns(
  input: AssignDonationInput,
): Promise<CampaignAssignment[]> {
  const available = new Map<string, number>();
  for (const item of input.items) {
    const key = keyFor(item.seferId, item.vendorId);
    available.set(key, (available.get(key) ?? 0) + item.quantity);
  }

  const activeSnap = await db
    .collection('campaigns')
    .where('status', '==', 'active')
    .orderBy('lastProgressAt', 'asc')
    .get();

  const campaigns: MutableCampaign[] = activeSnap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Campaign),
  }));

  const assignedByCampaign = new Map<string, number>();

  function totalRemaining(): number {
    let sum = 0;
    for (const v of available.values()) sum += v;
    return sum;
  }

  // Pass 1: honor an explicit donor-chosen institution/neshama with no milestone cap.
  if (input.requestedInstitutionId || input.requestedNeshamaId) {
    const targeted = campaigns.filter(
      (c) =>
        (input.requestedInstitutionId && c.institutionId === input.requestedInstitutionId) ||
        (input.requestedNeshamaId && c.neshamaId === input.requestedNeshamaId),
    );
    for (const campaign of targeted) {
      if (totalRemaining() <= 0) break;
      const assigned = applyToCampaign(campaign, available, Infinity);
      if (assigned > 0) {
        assignedByCampaign.set(campaign.id, (assignedByCampaign.get(campaign.id) ?? 0) + assigned);
      }
    }
  }

  // Pass 2: general round-robin milestone algorithm for whatever remains (spec §7.1).
  for (const campaign of campaigns) {
    if (totalRemaining() <= 0) break;
    if (campaign.status === 'fulfilled') continue;
    const cap = remainingForMilestone(campaign);
    if (cap <= 0) continue;
    const assigned = applyToCampaign(campaign, available, cap);
    if (assigned > 0) {
      assignedByCampaign.set(campaign.id, (assignedByCampaign.get(campaign.id) ?? 0) + assigned);
    }
  }

  if (assignedByCampaign.size > 0) {
    const batch = db.batch();
    for (const campaign of campaigns) {
      if (!assignedByCampaign.has(campaign.id)) continue;
      batch.update(db.collection('campaigns').doc(campaign.id), {
        items: campaign.items,
        totalItemsFulfilled: campaign.totalItemsFulfilled,
        status: campaign.status,
        currentMilestone: campaign.currentMilestone,
        lastProgressAt: campaign.lastProgressAt,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
    await batch.commit();
  }

  return Array.from(assignedByCampaign.entries()).map(([campaignId, itemsFulfilled]) => ({
    campaignId,
    itemsFulfilled,
  }));
}
