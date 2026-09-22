import { HttpsError } from 'firebase-functions/v2/https';
import { db } from './lib/firebaseAdmin';
import type { DonationGiftCard, DonationItem, Sefer } from './types';

/**
 * Recomputes the charge for physical seforim from the canonical `sefarim` catalog
 * server-side — the client-supplied `priceEach` is never trusted (spec §8, §16, §18).
 */
export async function priceItems(items: DonationItem[]): Promise<number> {
  const seferIds = [...new Set(items.map((item) => item.seferId))];
  const snaps = await Promise.all(seferIds.map((id) => db.collection('sefarim').doc(id).get()));
  const snapById = new Map(seferIds.map((id, idx) => [id, snaps[idx]]));

  let total = 0;
  for (const item of items) {
    const snap = snapById.get(item.seferId)!;
    if (!snap.exists) throw new HttpsError('not-found', `Sefer ${item.seferId} not found`);
    const sefer = snap.data() as Sefer;
    const listing = sefer.vendorListings.find((l) => l.vendorId === item.vendorId);
    if (!listing || listing.stockQty <= 0) {
      throw new HttpsError('failed-precondition', `Vendor listing unavailable for ${item.seferId}`);
    }
    total += listing.price * item.quantity;
  }
  return Math.round(total * 100) / 100;
}

/** Gift card amounts are the donor's own declared figures (there's no catalog price
 *  to check them against) — just validated as sane positive dollar amounts. */
export function priceGiftCards(giftCards: DonationGiftCard[]): number {
  let total = 0;
  for (const giftCard of giftCards) {
    if (!giftCard.institutionId || !Number.isFinite(giftCard.amount) || giftCard.amount <= 0) {
      throw new HttpsError('invalid-argument', 'Invalid gift card amount');
    }
    total += giftCard.amount;
  }
  return Math.round(total * 100) / 100;
}
