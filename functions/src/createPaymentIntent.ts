import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from './lib/firebaseAdmin';
import { getStripe, stripeSecretKey } from './lib/stripe';
import type { DonationItem, Sefer } from './types';

interface CreatePaymentIntentRequest {
  items: DonationItem[];
  requestedInstitutionId?: string;
  requestedNeshamaId?: string;
  donorMessage?: string;
  roundedUpFee: boolean;
}

/**
 * Recomputes the charge from the canonical `sefarim` catalog server-side — the
 * client-supplied `priceEach` is never trusted (spec §8, §16, §18).
 */
async function priceItems(items: DonationItem[]): Promise<number> {
  let total = 0;
  for (const item of items) {
    const snap = await db.collection('sefarim').doc(item.seferId).get();
    if (!snap.exists) throw new HttpsError('not-found', `Sefer ${item.seferId} not found`);
    const sefer = snap.data() as Sefer;
    const listing = sefer.vendorListings.find((l) => l.vendorId === item.vendorId);
    if (!listing || !listing.inStock) {
      throw new HttpsError('failed-precondition', `Vendor listing unavailable for ${item.seferId}`);
    }
    total += listing.price * item.quantity;
  }
  return Math.round(total * 100) / 100;
}

function estimateStripeFee(amount: number): number {
  return Math.round((amount * 0.029 + 0.3) * 100) / 100;
}

export const createPaymentIntent = onCall<CreatePaymentIntentRequest>(
  { secrets: [stripeSecretKey] },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError('unauthenticated', 'Sign in required');

    const { items, requestedInstitutionId, requestedNeshamaId, donorMessage, roundedUpFee } = request.data;
    if (!items?.length) throw new HttpsError('invalid-argument', 'No items provided');

    const subtotal = await priceItems(items);
    const totalCharged = roundedUpFee ? subtotal + estimateStripeFee(subtotal) : subtotal;

    const donationRef = db.collection('donations').doc();
    await donationRef.set({
      donorUid: uid,
      stripePaymentIntentId: null,
      items,
      requestedInstitutionId: requestedInstitutionId ?? null,
      requestedNeshamaId: requestedNeshamaId ?? null,
      campaignAssignments: [],
      donorMessage: donorMessage ?? null,
      roundedUpFee,
      totalCharged,
      status: 'pending',
      createdAt: FieldValue.serverTimestamp(),
    });

    const stripe = getStripe();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalCharged * 100),
      currency: 'usd',
      metadata: { donationId: donationRef.id, donorUid: uid },
    });

    await donationRef.update({ stripePaymentIntentId: paymentIntent.id });

    return {
      clientSecret: paymentIntent.client_secret,
      donationId: donationRef.id,
      totalCharged,
    };
  },
);
