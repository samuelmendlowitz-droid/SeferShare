import { onRequest } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from './lib/firebaseAdmin';
import { getStripe, stripeSecretKey, stripeWebhookSecret } from './lib/stripe';
import { assignDonationToCampaigns } from './algorithm';
import { notify, notifyCampaigners } from './notify';
import type { Donation, DonationItem, Order } from './types';

/** Groups a donation's items by vendor so each vendor gets its own dropship order (spec §2, §6). */
function splitOrdersByVendor(items: DonationItem[]): Map<string, DonationItem[]> {
  const byVendor = new Map<string, DonationItem[]>();
  for (const item of items) {
    const list = byVendor.get(item.vendorId) ?? [];
    list.push(item);
    byVendor.set(item.vendorId, list);
  }
  return byVendor;
}

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
    const donationSnap = await donationRef.get();
    if (!donationSnap.exists) {
      res.status(200).send('donation not found');
      return;
    }
    const donation = donationSnap.data() as Donation;
    if (donation.status !== 'pending') {
      res.status(200).send('already processed');
      return;
    }

    const campaignAssignments = await assignDonationToCampaigns({
      items: donation.items,
      requestedInstitutionId: donation.requestedInstitutionId ?? undefined,
      requestedNeshamaId: donation.requestedNeshamaId ?? undefined,
    });

    await donationRef.update({
      status: 'paid',
      campaignAssignments,
    });

    const ordersByVendor = splitOrdersByVendor(donation.items);
    const batch = db.batch();
    for (const [vendorId, items] of ordersByVendor) {
      const orderRef = db.collection('orders').doc();
      // TODO: attribute the shipping address of the specific campaign(s) each item
      // was assigned to — assignDonationToCampaigns currently returns per-campaign
      // totals, not a per-item breakdown, so a mixed-campaign order can't be split yet.
      const order: Omit<Order, 'orderId' | 'createdAt'> & { createdAt: FirebaseFirestore.FieldValue } = {
        donationId,
        vendorId,
        items: items.map((i) => ({ seferId: i.seferId, quantity: i.quantity })),
        shippingAddress: {
          line1: '',
          city: '',
          state: '',
          postalCode: '',
          country: '',
        },
        status: 'pending',
        createdAt: FieldValue.serverTimestamp(),
      };
      batch.set(orderRef, order);
    }
    await batch.commit();

    await notifyCampaigners(campaignAssignments, donation.donorMessage ?? undefined, donationId);
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
