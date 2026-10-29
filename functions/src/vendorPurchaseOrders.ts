import { onCall, HttpsError, type CallableRequest } from 'firebase-functions/v2/https';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from './lib/firebaseAdmin';
import { requireAdmin } from './lib/adminAuth';
import { notify } from './notify';
import type { FulfillmentNeed, VendorPurchaseOrder, VendorPurchaseOrderItem } from './types';

function requireVendorOwnership(request: CallableRequest<{ vendorPurchaseOrderId?: string }>, po: VendorPurchaseOrder): string {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in required');
  if (po.vendorId !== uid) throw new HttpsError('permission-denied', 'Not your purchase order');
  return uid;
}

interface CreateVendorPurchaseOrderRequest {
  vendorId: string;
  fulfillmentNeedIds: string[];
  wholesalePricesBySeferId?: Record<string, number>;
}

/**
 * Admin-only: batches a vendor's still-unfulfilled needs into one purchase
 * order, created as 'draft' — invisible to the vendor (see firestore.rules)
 * until sendVendorPurchaseOrder marks it 'sent'. Every linked need is
 * re-checked against a fresh read inside the transaction (not just trusted
 * from whatever the admin UI last loaded) so a concurrent admin action
 * can't double-book one onto two purchase orders.
 */
export const createVendorPurchaseOrder = onCall<CreateVendorPurchaseOrderRequest>(async (request) => {
  const uid = requireAdmin(request);
  const { vendorId, fulfillmentNeedIds, wholesalePricesBySeferId } = request.data;
  if (!vendorId || !fulfillmentNeedIds?.length) {
    throw new HttpsError('invalid-argument', 'vendorId and fulfillmentNeedIds are required');
  }

  const poRef = db.collection('vendorPurchaseOrders').doc();
  const needRefs = fulfillmentNeedIds.map((id) => db.collection('fulfillmentNeeds').doc(id));

  await db.runTransaction(async (tx) => {
    const needSnaps = await Promise.all(needRefs.map((ref) => tx.get(ref)));
    const itemsBySefer = new Map<string, number>();
    needSnaps.forEach((snap) => {
      if (!snap.exists) throw new HttpsError('not-found', `Fulfillment need ${snap.id} not found`);
      const need = snap.data() as FulfillmentNeed;
      if (need.vendorId !== vendorId) {
        throw new HttpsError('invalid-argument', `Need ${snap.id} belongs to a different vendor`);
      }
      if (need.status !== 'needsFulfillment') {
        throw new HttpsError('failed-precondition', `Need ${snap.id} is no longer awaiting fulfillment`);
      }
      itemsBySefer.set(need.seferId, (itemsBySefer.get(need.seferId) ?? 0) + 1);
    });

    const items: VendorPurchaseOrderItem[] = [...itemsBySefer].map(([seferId, quantity]) => ({
      seferId,
      quantity,
      wholesalePriceEach: wholesalePricesBySeferId?.[seferId] ?? 0,
    }));

    tx.set(poRef, {
      vendorId,
      items,
      linkedFulfillmentNeedIds: fulfillmentNeedIds,
      fulfillmentStatus: 'draft',
      paymentStatus: 'unpaid',
      createdByUid: uid,
      createdAt: FieldValue.serverTimestamp(),
    });
    needRefs.forEach((ref) => {
      tx.update(ref, { status: 'onOrder', vendorPurchaseOrderId: poRef.id });
    });
  });

  return { vendorPurchaseOrderId: poRef.id };
});

interface VendorPurchaseOrderIdRequest {
  vendorPurchaseOrderId: string;
}

/** Admin-only: a draft becomes visible to the vendor the moment it's sent. */
export const sendVendorPurchaseOrder = onCall<VendorPurchaseOrderIdRequest>(async (request) => {
  requireAdmin(request);
  const { vendorPurchaseOrderId } = request.data;
  if (!vendorPurchaseOrderId) throw new HttpsError('invalid-argument', 'vendorPurchaseOrderId is required');

  const ref = db.collection('vendorPurchaseOrders').doc(vendorPurchaseOrderId);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError('not-found', 'Purchase order not found');
  const po = snap.data() as VendorPurchaseOrder;
  if (po.fulfillmentStatus !== 'draft') {
    throw new HttpsError('failed-precondition', 'Only a draft purchase order can be sent');
  }

  await ref.update({ fulfillmentStatus: 'sent', sentAt: FieldValue.serverTimestamp() });

  await notify({
    recipientUid: po.vendorId,
    kind: 'vendor_po_update',
    title: 'New purchase order',
    body: `You have a new purchase order with ${po.items.length} sefer line item(s).`,
    relatedVendorPurchaseOrderId: vendorPurchaseOrderId,
  });

  return { success: true };
});

/** Vendor-only: acknowledges receipt of a sent purchase order. */
export const acknowledgeVendorPurchaseOrder = onCall<VendorPurchaseOrderIdRequest>(async (request) => {
  const { vendorPurchaseOrderId } = request.data;
  if (!vendorPurchaseOrderId) throw new HttpsError('invalid-argument', 'vendorPurchaseOrderId is required');

  const ref = db.collection('vendorPurchaseOrders').doc(vendorPurchaseOrderId);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError('not-found', 'Purchase order not found');
  const po = snap.data() as VendorPurchaseOrder;
  requireVendorOwnership(request, po);
  if (po.fulfillmentStatus !== 'sent') {
    throw new HttpsError('failed-precondition', 'Only a sent purchase order can be acknowledged');
  }

  await ref.update({ fulfillmentStatus: 'acknowledged' });

  await notify({
    recipientUid: po.createdByUid,
    kind: 'vendor_po_update',
    title: 'Vendor acknowledged a purchase order',
    body: `Purchase order with ${po.items.length} sefer line item(s) was acknowledged.`,
    relatedVendorPurchaseOrderId: vendorPurchaseOrderId,
  });

  return { success: true };
});

/** Vendor-only: marks the goods as shipped to us. */
export const markVendorPurchaseOrderShipped = onCall<VendorPurchaseOrderIdRequest>(async (request) => {
  const { vendorPurchaseOrderId } = request.data;
  if (!vendorPurchaseOrderId) throw new HttpsError('invalid-argument', 'vendorPurchaseOrderId is required');

  const ref = db.collection('vendorPurchaseOrders').doc(vendorPurchaseOrderId);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError('not-found', 'Purchase order not found');
  const po = snap.data() as VendorPurchaseOrder;
  requireVendorOwnership(request, po);
  if (po.fulfillmentStatus !== 'acknowledged') {
    throw new HttpsError('failed-precondition', 'Only an acknowledged purchase order can be marked shipped');
  }

  await ref.update({ fulfillmentStatus: 'shipped' });

  await notify({
    recipientUid: po.createdByUid,
    kind: 'vendor_po_update',
    title: 'Vendor shipped a purchase order',
    body: `Purchase order with ${po.items.length} sefer line item(s) is on its way to us.`,
    relatedVendorPurchaseOrderId: vendorPurchaseOrderId,
  });

  return { success: true };
});

/**
 * Admin-only: marks a shipped purchase order received. The needs linked to
 * it go straight from 'onOrder' to 'received' — they were already earmarked
 * for these exact copies when the PO was created, so unlike a manual
 * fulfill-from-stock action (see fulfillment.ts), nothing here touches the
 * general Stock ledger.
 */
export const receiveVendorPurchaseOrder = onCall<VendorPurchaseOrderIdRequest>(async (request) => {
  requireAdmin(request);
  const { vendorPurchaseOrderId } = request.data;
  if (!vendorPurchaseOrderId) throw new HttpsError('invalid-argument', 'vendorPurchaseOrderId is required');

  const ref = db.collection('vendorPurchaseOrders').doc(vendorPurchaseOrderId);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new HttpsError('not-found', 'Purchase order not found');
    const po = snap.data() as VendorPurchaseOrder;
    if (po.fulfillmentStatus !== 'shipped') {
      throw new HttpsError('failed-precondition', 'Only a shipped purchase order can be marked received');
    }

    po.linkedFulfillmentNeedIds.forEach((needId) => {
      tx.update(db.collection('fulfillmentNeeds').doc(needId), { status: 'received' });
    });
    tx.update(ref, { fulfillmentStatus: 'received', receivedAt: FieldValue.serverTimestamp() });
  });

  return { success: true };
});

interface SetVendorPurchaseOrderPaymentRequest {
  vendorPurchaseOrderId: string;
  paymentStatus: 'paid' | 'unpaid';
  paidAmount?: number;
  paymentNote?: string;
}

/** Admin-only bookkeeping: tracks what we actually paid the vendor, entirely
 *  independent of the donation side (no Stripe or payout wiring involved). */
export const setVendorPurchaseOrderPayment = onCall<SetVendorPurchaseOrderPaymentRequest>(async (request) => {
  requireAdmin(request);
  const { vendorPurchaseOrderId, paymentStatus, paidAmount, paymentNote } = request.data;
  if (!vendorPurchaseOrderId || (paymentStatus !== 'paid' && paymentStatus !== 'unpaid')) {
    throw new HttpsError('invalid-argument', 'vendorPurchaseOrderId and a valid paymentStatus are required');
  }

  const ref = db.collection('vendorPurchaseOrders').doc(vendorPurchaseOrderId);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError('not-found', 'Purchase order not found');

  if (paymentStatus === 'paid') {
    await ref.update({
      paymentStatus: 'paid',
      paidAt: Date.now(),
      paidAmount: paidAmount ?? null,
      paymentNote: paymentNote ?? null,
    });
  } else {
    await ref.update({
      paymentStatus: 'unpaid',
      paidAt: FieldValue.delete(),
      paidAmount: FieldValue.delete(),
      paymentNote: paymentNote ?? null,
    });
  }

  return { success: true };
});
