import { FieldValue } from 'firebase-admin/firestore';
import { db } from './lib/firebaseAdmin';
import { keyFor, type ItemAssignment } from './algorithm';
import type { Address, Campaign, DonationItem, DonationSticker, FulfillmentNeed, Institution, StickerDesign } from './types';

export interface ResolvedDestination {
  destinationInstitutionId?: string;
  destinationAddress: Address;
}

/** Ships to the institution's own `shippingAddress`, falling back to `address` —
 *  snapshotted here (not re-read live later) so an address edit afterward can't
 *  silently move an already-fulfilled shipment. */
export async function resolveInstitutionDestination(institutionId: string): Promise<ResolvedDestination | null> {
  const snap = await db.collection('institutions').doc(institutionId).get();
  if (!snap.exists) return null;
  const institution = snap.data() as Institution;
  return {
    destinationInstitutionId: institutionId,
    destinationAddress: institution.shippingAddress ?? institution.address,
  };
}

/**
 * Resolves one destination per distinct campaignId — an institution-objective
 * campaign ships to its institution's own shipping address; a neshama-only
 * campaign with no institution at all falls back to its own custom
 * `shippingAddress` (set at campaign creation). Batches institution lookups
 * rather than fetching per campaign.
 */
export async function resolveCampaignDestinations(
  campaignIds: string[],
  campaignsById: Map<string, Campaign>,
): Promise<Map<string, ResolvedDestination>> {
  const institutionIdsNeeded = [
    ...new Set(
      campaignIds
        .map((id) => campaignsById.get(id)?.institutionId)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const institutionSnaps = await Promise.all(
    institutionIdsNeeded.map((id) => db.collection('institutions').doc(id).get()),
  );
  const institutionById = new Map<string, Institution>();
  institutionSnaps.forEach((snap, idx) => {
    if (snap.exists) institutionById.set(institutionIdsNeeded[idx], snap.data() as Institution);
  });

  const result = new Map<string, ResolvedDestination>();
  for (const id of campaignIds) {
    const campaign = campaignsById.get(id);
    if (!campaign) continue;
    const institution = campaign.institutionId ? institutionById.get(campaign.institutionId) : undefined;
    if (campaign.institutionId && institution) {
      result.set(id, {
        destinationInstitutionId: campaign.institutionId,
        destinationAddress: institution.shippingAddress ?? institution.address,
      });
    } else {
      result.set(id, { destinationAddress: campaign.shippingAddress });
    }
  }
  return result;
}

export interface BuildFulfillmentNeedsInput {
  donationId?: string;
  /** Every routed item's stickers, in the same order assignStickerDedications
   *  produced them — one entry per physical copy. */
  stickers: DonationSticker[];
  stickerDesign?: StickerDesign | null;
  /** Precise per-copy campaign breakdown from assignDonationToCampaigns. */
  itemAssignments: ItemAssignment[];
  /** One resolved destination per campaignId referenced in itemAssignments. */
  campaignDestinations: Map<string, ResolvedDestination>;
}

export interface BuildFulfillmentNeedsResult {
  needs: Omit<FulfillmentNeed, 'fulfillmentNeedId'>[];
  /** Quantity per (seferId, vendorId) that never resolved to any campaign —
   *  campaigns exhausted their milestone caps before absorbing it. The caller
   *  credits this to availableStock, same as a donor-marked "no destination"
   *  item, rather than creating a FulfillmentNeed with no real destination. */
  leftoverItems: DonationItem[];
}

/**
 * Zips each campaign's assigned quantity to that many stickers off the same
 * (seferId, vendorId)'s queue (both ultimately total the full routed
 * quantity for that pool), producing one FulfillmentNeed per physical copy
 * with its real destination and dedication attached.
 */
export function buildFulfillmentNeeds(input: BuildFulfillmentNeedsInput): BuildFulfillmentNeedsResult {
  const stickerQueues = new Map<string, DonationSticker[]>();
  for (const sticker of input.stickers) {
    const key = keyFor(sticker.seferId, sticker.vendorId);
    const queue = stickerQueues.get(key) ?? [];
    queue.push(sticker);
    stickerQueues.set(key, queue);
  }

  const needs: Omit<FulfillmentNeed, 'fulfillmentNeedId'>[] = [];
  for (const assignment of input.itemAssignments) {
    const key = keyFor(assignment.seferId, assignment.vendorId);
    const queue = stickerQueues.get(key) ?? [];
    const destination = input.campaignDestinations.get(assignment.campaignId);
    if (!destination) continue;
    for (let i = 0; i < assignment.quantity; i++) {
      const sticker = queue.shift();
      if (!sticker) break;
      needs.push({
        seferId: assignment.seferId,
        vendorId: assignment.vendorId,
        donationId: input.donationId,
        destinationInstitutionId: destination.destinationInstitutionId,
        destinationAddress: destination.destinationAddress,
        dedication: sticker.dedication,
        stickerDesign: input.stickerDesign ?? undefined,
        status: 'needsFulfillment',
        createdAt: FieldValue.serverTimestamp() as unknown as FirebaseFirestore.Timestamp,
      });
    }
  }

  const leftoverItems: DonationItem[] = [];
  for (const [key, queue] of stickerQueues) {
    if (queue.length === 0) continue;
    const [seferId, vendorId] = key.split('::');
    leftoverItems.push({ seferId, vendorId, quantity: queue.length, priceEach: 0 });
  }

  return { needs, leftoverItems };
}

/** Builds one FulfillmentNeed per copy, all for the same fixed destination —
 *  used where every item in the batch ships to one known institution
 *  regardless of which of its own campaigns absorbed it (an institution
 *  spending its own gift-card balance on itself, or an institution claiming
 *  availableStock for itself): simpler than the general donor-flow case,
 *  where different items can scatter across many institutions' campaigns. */
export function buildFulfillmentNeedsForFixedDestination(
  stickers: DonationSticker[],
  destination: ResolvedDestination,
  donationId: string | undefined,
  stickerDesign?: StickerDesign | null,
): Omit<FulfillmentNeed, 'fulfillmentNeedId'>[] {
  return stickers.map((sticker) => ({
    seferId: sticker.seferId,
    vendorId: sticker.vendorId,
    donationId,
    destinationInstitutionId: destination.destinationInstitutionId,
    destinationAddress: destination.destinationAddress,
    dedication: sticker.dedication,
    stickerDesign: stickerDesign ?? undefined,
    status: 'needsFulfillment',
    createdAt: FieldValue.serverTimestamp() as unknown as FirebaseFirestore.Timestamp,
  }));
}
