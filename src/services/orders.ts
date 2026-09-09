import { collection, doc, getDocs, orderBy, query, updateDoc, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Order } from '../types';

const ordersRef = collection(db, 'orders');

export async function listVendorOrders(vendorId: string): Promise<Order[]> {
  const snap = await getDocs(query(ordersRef, where('vendorId', '==', vendorId), orderBy('createdAt', 'desc')));
  return snap.docs.map((d) => ({ ...(d.data() as Order), orderId: d.id }));
}

/** Vendors may only flip a pending order to shipped (enforced in firestore.rules). */
export async function markOrderShipped(orderId: string): Promise<void> {
  await updateDoc(doc(db, 'orders', orderId), { status: 'shipped' });
}

export async function listAllOrders(): Promise<Order[]> {
  const snap = await getDocs(query(ordersRef, orderBy('createdAt', 'desc')));
  return snap.docs.map((d) => ({ ...(d.data() as Order), orderId: d.id }));
}
