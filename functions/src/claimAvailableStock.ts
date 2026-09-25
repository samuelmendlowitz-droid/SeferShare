import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from './lib/firebaseAdmin';
import { applyToCampaign, keyFor, type MutableCampaign } from './algorithm';
import type { AvailableStockEntry, Campaign, Institution } from './types';

interface ClaimRequest {
  institutionId: string;
  claims: { seferId: string; vendorId: string; quantity: number }[];
}

interface ClaimResult {
  claimedCount: number;
}

/**
 * Lets a verified institution's owner claim some quantity of unassigned donated
 * stock (see confirmDonation.ts, which routes any item the donor marked
 * "available for claim" here instead of the assignment algorithm) for free.
 * Claimed quantity is credited against that institution's own active campaigns
 * still needing it, same as a directly-targeted donation — deliberately NOT
 * falling back to the general milestone pool: an institution claiming stock
 * keeps it even if none of its own campaigns need it right now.
 */
export const claimAvailableStock = onCall<ClaimRequest>(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in required');

  const { institutionId, claims } = request.data;
  if (!claims?.length) throw new HttpsError('invalid-argument', 'No claims provided');
  for (const claim of claims) {
    if (!claim.seferId || !claim.vendorId || !Number.isFinite(claim.quantity) || claim.quantity <= 0) {
      throw new HttpsError('invalid-argument', 'Invalid claim quantity');
    }
  }

  const institutionRef = db.collection('institutions').doc(institutionId);
  const institutionSnap = await institutionRef.get();
  if (!institutionSnap.exists) throw new HttpsError('not-found', 'Institution not found');
  const institution = institutionSnap.data() as Institution;

  const userSnap = await db.collection('users').doc(uid).get();
  const isAdmin = userSnap.exists && Boolean((userSnap.data() as { isAdmin?: boolean }).isAdmin);
  if (institution.createdByUid !== uid && !isAdmin) {
    throw new HttpsError('permission-denied', 'Only the institution owner can claim stock for it');
  }
  if (!institution.verified) {
    throw new HttpsError('failed-precondition', 'Only a verified institution can claim stock');
  }

  const available = new Map<string, number>();
  await db.runTransaction(async (tx) => {
    for (const claim of claims) {
      const stockRef = db.collection('availableStock').doc(`${claim.seferId}_${claim.vendorId}`);
      const snap = await tx.get(stockRef);
      const onHand = snap.exists ? (snap.data() as AvailableStockEntry).quantity : 0;
      if (onHand < claim.quantity) {
        throw new HttpsError('failed-precondition', `Not enough stock remaining for ${claim.seferId}`);
      }
      const remaining = onHand - claim.quantity;
      if (remaining <= 0) {
        tx.delete(stockRef);
      } else {
        tx.update(stockRef, { quantity: remaining, updatedAt: FieldValue.serverTimestamp() });
      }
      const key = keyFor(claim.seferId, claim.vendorId);
      available.set(key, (available.get(key) ?? 0) + claim.quantity);
    }
  });

  const activeSnap = await db.collection('campaigns').where('status', '==', 'active').get();
  const campaigns: MutableCampaign[] = activeSnap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Campaign) }))
    .filter((c) => c.institutionId === institutionId);

  const batch = db.batch();
  let anyUpdated = false;
  for (const campaign of campaigns) {
    const assigned = applyToCampaign(campaign, available, Infinity);
    if (assigned > 0) {
      anyUpdated = true;
      batch.update(db.collection('campaigns').doc(campaign.id), {
        items: campaign.items,
        totalItemsFulfilled: campaign.totalItemsFulfilled,
        status: campaign.status,
        currentMilestone: campaign.currentMilestone,
        lastProgressAt: campaign.lastProgressAt,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
  }
  if (anyUpdated) await batch.commit();

  const claimedCount = claims.reduce((sum, claim) => sum + claim.quantity, 0);
  const result: ClaimResult = { claimedCount };
  return result;
});
