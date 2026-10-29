import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from './lib/firebaseAdmin';
import { priceItems } from './pricing';
import { assignDonationToCampaigns } from './algorithm';
import { assignStickerDedications } from './dedication';
import { buildFulfillmentNeedsForFixedDestination } from './fulfillment';
import { notifyCampaigners } from './notify';
import type { DonationAd, DonationDedication, DonationItem, Institution } from './types';

interface SpendInstitutionBalanceRequest {
  institutionId: string;
  items: DonationItem[];
  donorMessage?: string;
  donorDedication?: DonationDedication;
  ad?: DonationAd;
}

/**
 * Lets an institution spend its own gift-card balance (funded by donors giving gift
 * cards instead of specific seforim — see createPaymentIntent.ts / confirmDonation.ts)
 * on seforim for itself, with its own dedication and ad, no Stripe payment involved.
 */
export const spendInstitutionBalance = onCall<SpendInstitutionBalanceRequest>(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in required');

  const { institutionId, items, donorMessage, donorDedication, ad } = request.data;
  if (!items?.length) throw new HttpsError('invalid-argument', 'No items provided');

  const institutionRef = db.collection('institutions').doc(institutionId);
  const institutionSnap = await institutionRef.get();
  if (!institutionSnap.exists) throw new HttpsError('not-found', 'Institution not found');
  const institution = institutionSnap.data() as Institution;

  const userSnap = await db.collection('users').doc(uid).get();
  const isAdmin = userSnap.exists && Boolean((userSnap.data() as { isAdmin?: boolean }).isAdmin);
  if (institution.createdByUid !== uid && !isAdmin) {
    throw new HttpsError('permission-denied', 'Only the institution owner can spend its gift card balance');
  }

  const subtotal = await priceItems(items);

  const donationRef = db.collection('donations').doc();
  await db.runTransaction(async (tx) => {
    const freshSnap = await tx.get(institutionRef);
    const balance = (freshSnap.data() as Institution | undefined)?.giftCardBalance ?? 0;
    if (balance < subtotal) {
      throw new HttpsError('failed-precondition', 'Insufficient gift card balance');
    }
    tx.update(institutionRef, { giftCardBalance: FieldValue.increment(-subtotal) });
    tx.set(donationRef, {
      donorUid: uid,
      stripePaymentIntentId: null,
      paymentMethod: 'giftCardBalance',
      items,
      requestedInstitutionId: institutionId,
      requestedNeshamaId: null,
      campaignAssignments: [],
      donorMessage: donorMessage ?? null,
      donorDedication: donorDedication ?? null,
      ad: ad ?? null,
      roundedUpFee: false,
      totalCharged: subtotal,
      status: 'paid',
      createdAt: FieldValue.serverTimestamp(),
    });
  });

  const { assignments: campaignAssignments, campaignsById } = await assignDonationToCampaigns({
    items,
    requestedInstitutionId: institutionId,
  });
  const stickers = await assignStickerDedications(items, donorDedication ?? null);
  await donationRef.update({ campaignAssignments, stickers });

  // Every item here ships to this same institution regardless of which of its
  // own campaigns absorbed it (it's spending its own balance on itself) —
  // simpler than the general donor-flow case, which can scatter across many
  // institutions' campaigns.
  const needs = buildFulfillmentNeedsForFixedDestination(
    stickers,
    { destinationInstitutionId: institutionId, destinationAddress: institution.shippingAddress ?? institution.address },
    donationRef.id,
  );
  const batch = db.batch();
  for (const need of needs) {
    batch.set(db.collection('fulfillmentNeeds').doc(), need);
  }
  await batch.commit();

  await notifyCampaigners(campaignAssignments, campaignsById, donorMessage, donationRef.id);

  return { donationId: donationRef.id, totalSpent: subtotal };
});
