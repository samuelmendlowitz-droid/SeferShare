import { FieldValue } from 'firebase-admin/firestore';
import { db } from './lib/firebaseAdmin';
import type { DonationItem, Sefer } from './types';

/**
 * Writes items the donor marked "available for claim" into the availableStock
 * collection instead of letting the assignment algorithm route them — denormalizing
 * display fields from the sefarim catalog (never trusting client-supplied names or
 * prices) so institutions can browse them without an extra lookup. Docs are keyed by
 * `seferId_vendorId` so repeated donations of the same sefer/vendor accumulate onto
 * one entry rather than piling up duplicate rows.
 */
export async function creditAvailableStock(items: DonationItem[]): Promise<void> {
  if (items.length === 0) return;

  const seferIds = [...new Set(items.map((item) => item.seferId))];
  const snaps = await Promise.all(seferIds.map((id) => db.collection('sefarim').doc(id).get()));
  const seferById = new Map(seferIds.map((id, idx) => [id, snaps[idx]]));

  const batch = db.batch();
  for (const item of items) {
    const snap = seferById.get(item.seferId);
    if (!snap?.exists) continue;
    const sefer = snap.data() as Sefer;
    const listing = sefer.vendorListings.find((l) => l.vendorId === item.vendorId);
    if (!listing) continue;

    const stockRef = db.collection('availableStock').doc(`${item.seferId}_${item.vendorId}`);
    batch.set(
      stockRef,
      {
        seferId: item.seferId,
        vendorId: item.vendorId,
        vendorName: listing.vendorName,
        englishName: sefer.englishName,
        hebrewName: sefer.hebrewName,
        imageUrl: listing.imageUrls?.[0] ?? null,
        price: listing.price,
        quantity: FieldValue.increment(item.quantity),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  }
  await batch.commit();
}
