import { collection, doc, getDoc, getDocs, query, where, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { PublicVendorListing, Sefer, SeferType } from '../types';

const sefarimRef = collection(db, 'sefarim');

export async function listSefarim(): Promise<Sefer[]> {
  const snap = await getDocs(sefarimRef);
  return snap.docs.map((d) => ({ ...(d.data() as Sefer), seferId: d.id }));
}

export function searchSefarim(all: Sefer[], queryStr: string): Sefer[] {
  const q = queryStr.trim().toLowerCase();
  if (!q) return all;
  return all.filter(
    (s) =>
      s.hebrewName.includes(q) ||
      s.englishName.toLowerCase().includes(q) ||
      s.phoneticName.toLowerCase().includes(q),
  );
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
  inStock: boolean;
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
    inStock: input.inStock,
    // Firestore rejects a literal `undefined` field value outright — always write an
    // array (possibly empty) rather than omitting it conditionally.
    imageUrls: input.imageUrls ?? [],
  };

  const batch = writeBatch(db);

  if (existing && seferId) {
    const otherListings = existing.vendorListings.filter((l) => l.vendorId !== input.vendorId);
    batch.set(
      doc(db, 'sefarim', seferId),
      { vendorListings: [...otherListings, publicListing] },
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
