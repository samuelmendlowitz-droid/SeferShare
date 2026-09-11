import { collection, deleteDoc, doc, getDoc, getDocs, query, where, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { PublicVendorListing, Sefer, SeferType } from '../types';

const sefarimRef = collection(db, 'sefarim');

export async function listSefarim(): Promise<Sefer[]> {
  const snap = await getDocs(sefarimRef);
  return snap.docs.map((d) => ({ ...(d.data() as Sefer), seferId: d.id }));
}

/**
 * Matches an existing catalog entry by (englishName, type) so vendor submissions
 * for the same sefer merge into one master record instead of duplicating it (spec §11).
 */
async function findExistingSefer(englishName: string, type: SeferType): Promise<Sefer | null> {
  const snap = await getDocs(
    query(sefarimRef, where('englishName', '==', englishName), where('type', '==', type)),
  );
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { ...(d.data() as Sefer), seferId: d.id };
}

export interface UpsertVendorListingInput {
  seferId?: string; // pass when adding a listing to an existing catalog entry
  hebrewName: string;
  englishName: string;
  phoneticName: string;
  type: SeferType;
  vendorId: string;
  vendorName: string;
  retailPrice: number;
  wholesalePrice: number;
  stockQty: number;
  imageUrls?: string[];
}

/**
 * Writes the vendor's wholesale price to a vendor-scoped document (readable only by
 * that vendor and admins, per Firestore rules) and the public listing fields onto the
 * shared sefer catalog entry. `wholesalePrice` never enters the `sefarim` document
 * that donor clients read. (spec §5.4, §15, §18)
 */
export async function upsertVendorListing(input: UpsertVendorListingInput): Promise<string> {
  let seferId = input.seferId;
  let existing: Sefer | null = null;

  if (seferId) {
    const snap = await getDoc(doc(db, 'sefarim', seferId));
    existing = snap.exists() ? ({ ...(snap.data() as Sefer), seferId } as Sefer) : null;
  } else {
    existing = await findExistingSefer(input.englishName, input.type);
    seferId = existing?.seferId;
  }

  const publicListing: PublicVendorListing = {
    vendorId: input.vendorId,
    vendorName: input.vendorName,
    price: input.retailPrice,
    stockQty: input.stockQty,
    // Firestore rejects a literal `undefined` field value outright — always write an
    // array (possibly empty) rather than omitting it conditionally.
    imageUrls: input.imageUrls ?? [],
  };

  const batch = writeBatch(db);

  if (existing && seferId) {
    const otherListings = existing.vendorListings.filter((l) => l.vendorId !== input.vendorId);
    batch.set(
      doc(db, 'sefarim', seferId),
      {
        hebrewName: input.hebrewName,
        englishName: input.englishName,
        phoneticName: input.phoneticName,
        type: input.type,
        vendorListings: [...otherListings, publicListing],
      },
      { merge: true },
    );
  } else {
    const newRef = doc(sefarimRef);
    seferId = newRef.id;
    batch.set(newRef, {
      hebrewName: input.hebrewName,
      englishName: input.englishName,
      phoneticName: input.phoneticName,
      type: input.type,
      vendorListings: [publicListing],
    });
  }

  batch.set(doc(db, 'vendorPricing', `${seferId}_${input.vendorId}`), {
    seferId,
    vendorId: input.vendorId,
    retailPrice: input.retailPrice,
    wholesalePrice: input.wholesalePrice,
  });

  await batch.commit();
  return seferId;
}

/**
 * Removes one vendor's listing from a sefer (and their pricing doc); if that was
 * the only listing, deletes the catalog entry entirely. Admin-only per Firestore
 * rules (whole-doc delete requires isAdmin()).
 */
export async function deleteVendorListing(seferId: string, vendorId: string): Promise<void> {
  const snap = await getDoc(doc(db, 'sefarim', seferId));
  if (!snap.exists()) return;
  const sefer = snap.data() as Sefer;
  const remaining = sefer.vendorListings.filter((l) => l.vendorId !== vendorId);

  const batch = writeBatch(db);
  if (remaining.length === 0) {
    batch.delete(doc(db, 'sefarim', seferId));
  } else {
    batch.update(doc(db, 'sefarim', seferId), { vendorListings: remaining });
  }
  batch.delete(doc(db, 'vendorPricing', `${seferId}_${vendorId}`));
  await batch.commit();
}

export interface VendorPricing {
  seferId: string;
  vendorId: string;
  retailPrice: number;
  wholesalePrice: number;
}

export async function listVendorPricing(vendorId: string): Promise<VendorPricing[]> {
  const snap = await getDocs(query(collection(db, 'vendorPricing'), where('vendorId', '==', vendorId)));
  return snap.docs.map((d) => d.data() as VendorPricing);
}
