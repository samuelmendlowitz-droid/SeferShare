import { collection, doc, getDocs, orderBy, query, updateDoc, where } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../lib/firebase';
import type { Order } from '../types';

const ordersRef = collection(db, 'orders');

export async function listVendorOrders(vendorId: string): Promise<Order[]> {
  const snap = await getDocs(query(ordersRef, where('vendorId', '==', vendorId), orderBy('createdAt', 'desc')));
  return snap.docs.map((d) => ({ ...(d.data() as Order), orderId: d.id }));
}

/** Vendors may only walk their own order through pending → shipped → delivered
 *  → back to pending (enforced in firestore.rules) — see the status button in
 *  VendorOrdersTab, which cycles through these three in that order. */
export async function markOrderShipped(orderId: string): Promise<void> {
  await updateDoc(doc(db, 'orders', orderId), { status: 'shipped' });
}

export async function markOrderFulfilled(orderId: string): Promise<void> {
  await updateDoc(doc(db, 'orders', orderId), { status: 'delivered' });
}

/** Resets an accidentally-fulfilled order back to pending — the caller should
 *  confirm with the vendor first, since this undoes real fulfillment status. */
export async function resetOrderToPending(orderId: string): Promise<void> {
  await updateDoc(doc(db, 'orders', orderId), { status: 'pending' });
}

export async function listAllOrders(): Promise<Order[]> {
  const snap = await getDocs(query(ordersRef, orderBy('createdAt', 'desc')));
  return snap.docs.map((d) => ({ ...(d.data() as Order), orderId: d.id }));
}

/** Generates a handful of sample orders against the signed-in vendor's own
 *  catalog, so they can try out the Orders tab without a real donation. */
export async function seedTestOrders(): Promise<{ ordersCreated: number }> {
  const call = httpsCallable<void, { ordersCreated: number }>(functions, 'seedTestOrders');
  const result = await call();
  return result.data;
}
