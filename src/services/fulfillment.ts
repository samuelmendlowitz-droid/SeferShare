import { collection, doc, getDocs, orderBy, query, runTransaction, serverTimestamp, where } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../lib/firebase';
import type {
  Address,
  FulfillmentNeed,
  Shipment,
  StockEntry,
  VendorPurchaseOrder,
  VendorPurchaseOrderFulfillmentStatus,
} from '../types';

const fulfillmentNeedsRef = collection(db, 'fulfillmentNeeds');
const stockRef = collection(db, 'stock');
const vendorPurchaseOrdersRef = collection(db, 'vendorPurchaseOrders');
const shipmentsRef = collection(db, 'shipments');

/** The only fulfillmentStatus values a vendor is ever allowed to read — see
 *  firestore.rules (vendorPurchaseOrders.read: vendorId == uid && != 'draft'). */
const VENDOR_VISIBLE_PO_STATUSES: VendorPurchaseOrderFulfillmentStatus[] = [
  'sent',
  'acknowledged',
  'shipped',
  'received',
];

export async function listFulfillmentNeedsAdmin(): Promise<FulfillmentNeed[]> {
  const snap = await getDocs(query(fulfillmentNeedsRef, orderBy('createdAt', 'desc')));
  return snap.docs.map((d) => ({ ...(d.data() as FulfillmentNeed), fulfillmentNeedId: d.id }));
}

export async function listStock(): Promise<StockEntry[]> {
  const snap = await getDocs(stockRef);
  return snap.docs.map((d) => d.data() as StockEntry);
}

/** Admin manually fulfills one need from on-hand stock — debits stock and marks
 *  the need fulfilled, atomically so concurrent admins can't double-spend a unit.
 *  Always a deliberate per-item choice (never automatic), per how this is meant
 *  to be used. */
export async function fulfillNeedFromStock(need: FulfillmentNeed): Promise<void> {
  await runTransaction(db, async (tx) => {
    const stockDocRef = doc(db, 'stock', need.seferId);
    const stockSnap = await tx.get(stockDocRef);
    const onHand = stockSnap.exists() ? (stockSnap.data() as StockEntry).quantity : 0;
    if (onHand < 1) throw new Error('No stock on hand for this sefer');
    tx.update(stockDocRef, { quantity: onHand - 1, updatedAt: serverTimestamp() });
    tx.update(doc(db, 'fulfillmentNeeds', need.fulfillmentNeedId), { status: 'fulfilledFromStock' });
  });
}

/** Admin manually adds to on-hand stock — speculative restocking ahead of
 *  demand, or correcting a count. Not tied to any vendor purchase order;
 *  receiving one (see Phase 4) credits stock the same way. */
export async function addStock(seferId: string, quantity: number): Promise<void> {
  await runTransaction(db, async (tx) => {
    const stockDocRef = doc(db, 'stock', seferId);
    const snap = await tx.get(stockDocRef);
    const onHand = snap.exists() ? (snap.data() as StockEntry).quantity : 0;
    tx.set(stockDocRef, { seferId, quantity: onHand + quantity, updatedAt: serverTimestamp() });
  });
}

export async function listVendorPurchaseOrdersAdmin(): Promise<VendorPurchaseOrder[]> {
  const snap = await getDocs(query(vendorPurchaseOrdersRef, orderBy('createdAt', 'desc')));
  return snap.docs.map((d) => ({ ...(d.data() as VendorPurchaseOrder), vendorPurchaseOrderId: d.id }));
}

/** A vendor's own purchase orders — drafts are excluded by the query itself
 *  (not just the security rule) so Firestore can statically verify the read
 *  is allowed. */
export async function listMyVendorPurchaseOrders(vendorId: string): Promise<VendorPurchaseOrder[]> {
  const snap = await getDocs(
    query(
      vendorPurchaseOrdersRef,
      where('vendorId', '==', vendorId),
      where('fulfillmentStatus', 'in', VENDOR_VISIBLE_PO_STATUSES),
      orderBy('createdAt', 'desc'),
    ),
  );
  return snap.docs.map((d) => ({ ...(d.data() as VendorPurchaseOrder), vendorPurchaseOrderId: d.id }));
}

export interface CreateVendorPurchaseOrderInput {
  vendorId: string;
  fulfillmentNeedIds: string[];
  wholesalePricesBySeferId?: Record<string, number>;
}

export async function createVendorPurchaseOrder(input: CreateVendorPurchaseOrderInput): Promise<{ vendorPurchaseOrderId: string }> {
  const call = httpsCallable<CreateVendorPurchaseOrderInput, { vendorPurchaseOrderId: string }>(
    functions,
    'createVendorPurchaseOrder',
  );
  const result = await call(input);
  return result.data;
}

async function callWithPoId(functionName: string, vendorPurchaseOrderId: string): Promise<void> {
  const call = httpsCallable<{ vendorPurchaseOrderId: string }, { success: boolean }>(functions, functionName);
  await call({ vendorPurchaseOrderId });
}

export const sendVendorPurchaseOrder = (vendorPurchaseOrderId: string) =>
  callWithPoId('sendVendorPurchaseOrder', vendorPurchaseOrderId);

export const acknowledgeVendorPurchaseOrder = (vendorPurchaseOrderId: string) =>
  callWithPoId('acknowledgeVendorPurchaseOrder', vendorPurchaseOrderId);

export const markVendorPurchaseOrderShipped = (vendorPurchaseOrderId: string) =>
  callWithPoId('markVendorPurchaseOrderShipped', vendorPurchaseOrderId);

export const receiveVendorPurchaseOrder = (vendorPurchaseOrderId: string) =>
  callWithPoId('receiveVendorPurchaseOrder', vendorPurchaseOrderId);

export interface SetVendorPurchaseOrderPaymentInput {
  vendorPurchaseOrderId: string;
  paymentStatus: 'paid' | 'unpaid';
  paidAmount?: number;
  paymentNote?: string;
}

export async function setVendorPurchaseOrderPayment(input: SetVendorPurchaseOrderPaymentInput): Promise<void> {
  const call = httpsCallable<SetVendorPurchaseOrderPaymentInput, { success: boolean }>(
    functions,
    'setVendorPurchaseOrderPayment',
  );
  await call(input);
}

export async function listShipmentsAdmin(): Promise<Shipment[]> {
  const snap = await getDocs(query(shipmentsRef, orderBy('createdAt', 'desc')));
  return snap.docs.map((d) => ({ ...(d.data() as Shipment), shipmentId: d.id }));
}

export interface CreateShipmentInput {
  fulfillmentNeedIds: string[];
  destinationInstitutionId?: string;
  destinationAddress: Address;
}

/** Groups a batch of "ready to pack" needs (received from a vendor, or
 *  fulfilled from stock) bound for the same destination into one outbound
 *  package. Re-checks each need is still unshipped and ready inside the
 *  transaction, same reasoning as createVendorPurchaseOrder's re-check. */
export async function createShipment(input: CreateShipmentInput): Promise<string> {
  const shipmentRef = doc(shipmentsRef);
  await runTransaction(db, async (tx) => {
    const needRefs = input.fulfillmentNeedIds.map((id) => doc(db, 'fulfillmentNeeds', id));
    const needSnaps = await Promise.all(needRefs.map((ref) => tx.get(ref)));
    needSnaps.forEach((snap) => {
      if (!snap.exists()) throw new Error(`Fulfillment need ${snap.id} not found`);
      const need = snap.data() as FulfillmentNeed;
      if (need.status !== 'received' && need.status !== 'fulfilledFromStock') {
        throw new Error(`Need ${snap.id} is not ready to pack`);
      }
    });

    tx.set(shipmentRef, {
      destinationInstitutionId: input.destinationInstitutionId ?? null,
      destinationAddress: input.destinationAddress,
      fulfillmentNeedIds: input.fulfillmentNeedIds,
      status: 'packed',
      createdAt: serverTimestamp(),
    });
    needRefs.forEach((ref) => {
      tx.update(ref, { status: 'packed', shipmentId: shipmentRef.id });
    });
  });
  return shipmentRef.id;
}

export interface MarkShipmentShippedInput {
  shipmentId: string;
  carrier: string;
  trackingNumber: string;
}

export async function markShipmentShipped(input: MarkShipmentShippedInput): Promise<void> {
  await runTransaction(db, async (tx) => {
    const shipmentDocRef = doc(db, 'shipments', input.shipmentId);
    const snap = await tx.get(shipmentDocRef);
    if (!snap.exists()) throw new Error('Shipment not found');
    const shipment = snap.data() as Shipment;
    if (shipment.status !== 'packed') throw new Error('Only a packed shipment can be marked shipped');

    tx.update(shipmentDocRef, {
      status: 'shipped',
      carrier: input.carrier,
      trackingNumber: input.trackingNumber,
      shippedAt: serverTimestamp(),
    });
    shipment.fulfillmentNeedIds.forEach((needId) => {
      tx.update(doc(db, 'fulfillmentNeeds', needId), { status: 'shipped' });
    });
  });
}

export async function markShipmentDelivered(shipmentId: string): Promise<void> {
  await runTransaction(db, async (tx) => {
    const shipmentDocRef = doc(db, 'shipments', shipmentId);
    const snap = await tx.get(shipmentDocRef);
    if (!snap.exists()) throw new Error('Shipment not found');
    const shipment = snap.data() as Shipment;
    if (shipment.status !== 'shipped') throw new Error('Only a shipped shipment can be marked delivered');

    tx.update(shipmentDocRef, { status: 'delivered', deliveredAt: serverTimestamp() });
    shipment.fulfillmentNeedIds.forEach((needId) => {
      tx.update(doc(db, 'fulfillmentNeeds', needId), { status: 'delivered' });
    });
  });
}
