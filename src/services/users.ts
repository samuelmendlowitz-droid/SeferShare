import { collection, doc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../lib/firebase';
import type { Language, User } from '../types';

export async function updatePreferredLanguage(uid: string, language: Language) {
  await updateDoc(doc(db, 'users', uid), { preferredLanguage: language });
}

/** Marks a user as wanting to become a vendor; requires manual admin approval (spec §4.3). */
export async function applyToBeVendor(uid: string) {
  await updateDoc(doc(db, 'users', uid), { isVendor: true, vendorApproved: false });
}

export async function listPendingVendorApplications(): Promise<User[]> {
  const snap = await getDocs(
    query(collection(db, 'users'), where('isVendor', '==', true), where('vendorApproved', '==', false)),
  );
  return snap.docs.map((d) => d.data() as User);
}

interface ApproveVendorInput {
  uid: string;
  approve: boolean;
}

export async function approveVendor(input: ApproveVendorInput): Promise<void> {
  const call = httpsCallable<ApproveVendorInput, { success: boolean }>(functions, 'approveVendor');
  await call(input);
}
