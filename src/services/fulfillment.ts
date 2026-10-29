import { collection, doc, getDocs, orderBy, query, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { FulfillmentNeed, StockEntry } from '../types';

const fulfillmentNeedsRef = collection(db, 'fulfillmentNeeds');
const stockRef = collection(db, 'stock');

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
