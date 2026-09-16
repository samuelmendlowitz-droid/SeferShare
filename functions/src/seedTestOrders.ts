import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { Timestamp } from 'firebase-admin/firestore';
import { db } from './lib/firebaseAdmin';
import type { Order, OrderStatus, Sefer } from './types';

/**
 * Lets a signed-in vendor generate a handful of sample orders against their own
 * real catalog, purely so they can try out the Orders tab (status cycling, CSV
 * export) without needing a real donation to go through first. Scoped entirely
 * to request.auth.uid — there is no parameter for a target vendor, so this can
 * never create data for anyone other than whoever is calling it.
 */
export const seedTestOrders = onCall(async (request) => {
  const vendorId = request.auth?.uid;
  if (!vendorId) throw new HttpsError('unauthenticated', 'Sign in required');

  const sefarimSnap = await db.collection('sefarim').get();
  const vendorListings: { seferId: string; price: number }[] = [];
  sefarimSnap.forEach((doc) => {
    const sefer = doc.data() as Sefer;
    const listing = sefer.vendorListings?.find((l) => l.vendorId === vendorId);
    if (listing) vendorListings.push({ seferId: doc.id, price: listing.price });
  });

  if (vendorListings.length === 0) {
    throw new HttpsError('failed-precondition', 'Add at least one sefer to your catalog first');
  }

  const now = Date.now();
  const plans: { status: OrderStatus; daysAgo: number; itemCounts: number[] }[] = [
    { status: 'pending', daysAgo: 0, itemCounts: [2] },
    { status: 'pending', daysAgo: 1, itemCounts: [1, 3] },
    { status: 'shipped', daysAgo: 3, itemCounts: [1] },
    { status: 'shipped', daysAgo: 4, itemCounts: [2, 1] },
    { status: 'delivered', daysAgo: 8, itemCounts: [1] },
  ];

  const batch = db.batch();
  const createdIds: string[] = [];
  plans.forEach((plan, planIdx) => {
    const orderRef = db.collection('orders').doc();
    const items = plan.itemCounts.map((qty, idx) => {
      const listing = vendorListings[(planIdx + idx) % vendorListings.length];
      return { seferId: listing.seferId, quantity: qty, priceEach: listing.price };
    });
    const order: Omit<Order, 'orderId'> = {
      donationId: `sample-${orderRef.id}`,
      vendorId,
      items,
      shippingAddress: { line1: '', city: '', state: '', postalCode: '', country: '' },
      status: plan.status,
      createdAt: Timestamp.fromMillis(now - plan.daysAgo * 24 * 60 * 60 * 1000),
    };
    batch.set(orderRef, order);
    createdIds.push(orderRef.id);
  });
  await batch.commit();

  return { ordersCreated: createdIds.length };
});
