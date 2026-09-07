import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Campaign, Donation, Order, OrderStatus, Sefer } from '../types';

export async function listAllCampaignsAdmin(): Promise<Campaign[]> {
  const snap = await getDocs(query(collection(db, 'campaigns'), orderBy('createdAt', 'desc')));
  return snap.docs.map((d) => d.data() as Campaign);
}

export async function listAllDonationsAdmin(): Promise<Donation[]> {
  const snap = await getDocs(query(collection(db, 'donations'), orderBy('createdAt', 'desc')));
  return snap.docs.map((d) => d.data() as Donation);
}

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
  await updateDoc(doc(db, 'orders', orderId), { status });
}

/**
 * Merges a duplicate catalog entry into the canonical one by combining vendor
 * listings and deleting the duplicate. Existing campaign/donation item references
 * to the deleted seferId are left as-is (out of scope for v1) — spec §11, §13.
 */
export async function mergeSefarim(primarySeferId: string, duplicateSeferId: string): Promise<void> {
  const [primarySnap, dupSnap] = await Promise.all([
    getDoc(doc(db, 'sefarim', primarySeferId)),
    getDoc(doc(db, 'sefarim', duplicateSeferId)),
  ]);
  if (!primarySnap.exists() || !dupSnap.exists()) throw new Error('Sefer not found');
  const primary = primarySnap.data() as Sefer;
  const duplicate = dupSnap.data() as Sefer;

  const existingVendorIds = new Set(primary.vendorListings.map((l) => l.vendorId));
  const mergedListings = [
    ...primary.vendorListings,
    ...duplicate.vendorListings.filter((l) => !existingVendorIds.has(l.vendorId)),
  ];

  const batch = writeBatch(db);
  batch.update(doc(db, 'sefarim', primarySeferId), { vendorListings: mergedListings });
  batch.delete(doc(db, 'sefarim', duplicateSeferId));
  await batch.commit();
}

/** Reassigns campaigns pointing at the duplicate neshama, then deletes it (spec §13). */
export async function mergeNeshamos(primaryNeshamaId: string, duplicateNeshamaId: string): Promise<void> {
  const campaignsSnap = await getDocs(
    query(collection(db, 'campaigns'), where('neshamaId', '==', duplicateNeshamaId)),
  );
  const batch = writeBatch(db);
  campaignsSnap.docs.forEach((d) => {
    batch.update(d.ref, { neshamaId: primaryNeshamaId });
  });
  batch.delete(doc(db, 'neshamos', duplicateNeshamaId));
  await batch.commit();
}

export async function listAllOrdersAdmin(): Promise<Order[]> {
  const snap = await getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc')));
  return snap.docs.map((d) => d.data() as Order);
}
