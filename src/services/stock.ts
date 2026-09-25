import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../lib/firebase';
import type { AvailableStockEntry } from '../types';

const stockRef = collection(db, 'availableStock');

/** Seforim donated without a destination, sitting as free stock any verified
 *  institution can claim — see claimAvailableStock. */
export async function listAvailableStock(): Promise<AvailableStockEntry[]> {
  const snap = await getDocs(query(stockRef, orderBy('updatedAt', 'desc')));
  return snap.docs.map((d) => ({ ...(d.data() as AvailableStockEntry), id: d.id }));
}

export interface ClaimAvailableStockInput {
  institutionId: string;
  claims: { seferId: string; vendorId: string; quantity: number }[];
}

export interface ClaimAvailableStockResult {
  claimedCount: number;
}

/** Claims some quantity of one or more available-stock entries for a verified
 *  institution the caller owns — runs entirely server-side (stock decrement +
 *  crediting the institution's own active campaigns is all transactional). */
export async function claimAvailableStock(input: ClaimAvailableStockInput): Promise<ClaimAvailableStockResult> {
  const call = httpsCallable<ClaimAvailableStockInput, ClaimAvailableStockResult>(functions, 'claimAvailableStock');
  const result = await call(input);
  return result.data;
}
