import { onRequest } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from './lib/firebaseAdmin';
import { getStripe, stripeSecretKey, stripeWebhookSecret } from './lib/stripe';
import { assignDonationToCampaigns } from './algorithm';
import { assignStickerDedications } from './dedication';
import { buildFulfillmentNeeds, resolveCampaignDestinations } from './fulfillment';
import { notify, notifyCampaigners } from './notify';
import { creditAvailableStock } from './availableStock';
import type { Donation } from './types';

export const confirmDonation = onRequest(
  { secrets: [stripeSecretKey, stripeWebhookSecret] },
  async (req, res) => {
    const stripe = getStripe();
    const signature = req.headers['stripe-signature'];

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.rawBody, signature as string, stripeWebhookSecret.value());
    } catch (err) {
      logger.error('Stripe webhook signature verification failed', err);
      res.status(400).send('Invalid signature');
      return;
    }

    if (event.type === 'payment_intent.payment_failed') {
      const failedIntent = event.data.object as { id: string; metadata: { donationId?: string } };
      const failedDonationId = failedIntent.metadata.donationId;
      if (failedDonationId) {
        const failedRef = db.collection('donations').doc(failedDonationId);
        // Only a still-pending donation can be marked failed — a late/duplicate failure
        // event must never clobber a donation some other event already confirmed paid.
        await db.runTransaction(async (tx) => {
          const snap = await tx.get(failedRef);
          if (snap.exists && (snap.data() as Donation).status === 'pending') {
            tx.update(failedRef, { status: 'failed' });
          }
        });
      }
      res.status(200).send('payment failed recorded');
      return;
    }

    if (event.type !== 'payment_intent.succeeded') {
      res.status(200).send('ignored');
      return;
    }

    const paymentIntent = event.data.object as { id: string; metadata: { donationId?: string } };
    const donationId = paymentIntent.metadata.donationId;
    if (!donationId) {
      res.status(200).send('no donationId in metadata');
      return;
    }

    const donationRef = db.collection('donations').doc(donationId);
    // Claim the donation atomically: a duplicate/retried webhook delivery for the same
    // payment intent must only run the assignment/notification side effects once.
    const donation = await db.runTransaction(async (tx) => {
      const snap = await tx.get(donationRef);
      if (!snap.exists) return null;
      const data = snap.data() as Donation;
      if (data.status !== 'pending') return null;
      tx.update(donationRef, { status: 'paid' });
      return data;
    });
    if (!donation) {
      res.status(200).send('donation not found or already processed');
      return;
    }

    // Items the donor explicitly left with no destination sit as free stock for
    // any verified institution to claim instead of being auto-assigned — see
    // availableStock.ts. They never reach the algorithm or get a dedication
    // sticker here; a claiming institution's own campaign resolves both later.
    const claimItems = donation.items.filter((item) => item.availableForClaim);
    const routedItems = donation.items.filter((item) => !item.availableForClaim);

    const { assignments: campaignAssignments, campaignsById, itemAssignments } = await assignDonationToCampaigns({
      items: routedItems,
      requestedInstitutionId: donation.requestedInstitutionId ?? undefined,
      requestedNeshamaId: donation.requestedNeshamaId ?? undefined,
    });

    const stickers = await assignStickerDedications(routedItems, donation.donorDedication);

    const campaignDestinations = await resolveCampaignDestinations(
      [...new Set(itemAssignments.map((a) => a.campaignId))],
      campaignsById,
    );
    const { needs, leftoverItems } = buildFulfillmentNeeds({
      donationId,
      stickers,
      stickerDesign: donation.stickerDesign,
      itemAssignments,
      campaignDestinations,
    });

    // Quantity that never resolved to any campaign (every active campaign's
    // milestone cap was already full) has no real destination yet — it joins
    // the same free-for-claim pool as a donor-marked "no destination" item,
    // same reasoning, different trigger.
    await creditAvailableStock([...claimItems, ...leftoverItems]);

    // Chunked rather than one batch: a large donation can produce one
    // FulfillmentNeed per physical copy, which can exceed Firestore's 500-write
    // batch limit in a way the old one-doc-per-vendor Order never approached.
    const NEEDS_BATCH_SIZE = 450;
    for (let i = 0; i < needs.length; i += NEEDS_BATCH_SIZE) {
      const chunk = needs.slice(i, i + NEEDS_BATCH_SIZE);
      const needsBatch = db.batch();
      for (const need of chunk) {
        needsBatch.set(db.collection('fulfillmentNeeds').doc(), need);
      }
      await needsBatch.commit();
    }

    await donationRef.update({
      status: 'paid',
      campaignAssignments,
      stickers,
    });

    if (donation.giftCards?.length) {
      const balanceByInstitution = new Map<string, number>();
      for (const giftCard of donation.giftCards) {
        balanceByInstitution.set(giftCard.institutionId, (balanceByInstitution.get(giftCard.institutionId) ?? 0) + giftCard.amount);
      }
      const balanceBatch = db.batch();
      for (const [institutionId, amount] of balanceByInstitution) {
        balanceBatch.update(db.collection('institutions').doc(institutionId), {
          giftCardBalance: FieldValue.increment(amount),
        });
      }
      await balanceBatch.commit();
    }

    await notifyCampaigners(campaignAssignments, campaignsById, donation.donorMessage ?? undefined, donationId);
    await notify({
      recipientUid: donation.donorUid,
      kind: 'payment_confirmed',
      title: 'Payment confirmed',
      body: 'Thank you — your donation has been confirmed.',
      relatedDonationId: donationId,
    });

    res.status(200).send('ok');
  },
);
