import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from './lib/firebaseAdmin';
import { getStripe, stripeSecretKey } from './lib/stripe';
import { priceGiftCards, priceItems } from './pricing';
import type { DonationAd, DonationDedication, DonationGiftCard, DonationItem, StickerDesign } from './types';

interface CreatePaymentIntentRequest {
  items: DonationItem[];
  giftCards?: DonationGiftCard[];
  requestedInstitutionId?: string;
  requestedNeshamaId?: string;
  donorMessage?: string;
  donorDedication?: DonationDedication;
  stickerDesign?: StickerDesign;
  ad?: DonationAd;
  roundedUpFee: boolean;
}

function estimateStripeFee(amount: number): number {
  return Math.round((amount * 0.029 + 0.3) * 100) / 100;
}

export const createPaymentIntent = onCall<CreatePaymentIntentRequest>(
  { secrets: [stripeSecretKey] },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError('unauthenticated', 'Sign in required');

    const {
      items,
      giftCards = [],
      requestedInstitutionId,
      requestedNeshamaId,
      donorMessage,
      donorDedication,
      stickerDesign,
      ad,
      roundedUpFee,
    } = request.data;
    if (!items?.length && !giftCards.length) throw new HttpsError('invalid-argument', 'No items provided');

    const subtotal = (await priceItems(items ?? [])) + priceGiftCards(giftCards);
    const totalCharged = roundedUpFee ? subtotal + estimateStripeFee(subtotal) : subtotal;

    const donationRef = db.collection('donations').doc();
    await donationRef.set({
      donorUid: uid,
      stripePaymentIntentId: null,
      paymentMethod: 'stripe',
      items: items ?? [],
      giftCards,
      requestedInstitutionId: requestedInstitutionId ?? null,
      requestedNeshamaId: requestedNeshamaId ?? null,
      campaignAssignments: [],
      donorMessage: donorMessage ?? null,
      donorDedication: donorDedication ?? null,
      stickerDesign: stickerDesign ?? null,
      ad: ad ?? null,
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
