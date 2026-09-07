import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Order } from '../types';

const ordersRef = collection(db, 'orders');

export async function listVendorOrders(vendorId: string): Promise<Order[]> {
  const snap = await getDocs(query(ordersRef, where('vendorId', '==', vendorId), orderBy('createdAt', 'desc')));
  return snap.docs.map((d) => d.data() as Order);
}

export async function listAllOrders(): Promise<Order[]> {
  const snap = await getDocs(query(ordersRef, orderBy('createdAt', 'desc')));
  return snap.docs.map((d) => d.data() as Order);
}
