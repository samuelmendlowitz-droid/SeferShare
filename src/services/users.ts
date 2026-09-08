import { collection, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../lib/firebase';
import type { CatalogLayoutEntry, Language, User, VendorApplication } from '../types';

export async function updatePreferredLanguage(uid: string, language: Language) {
  await updateDoc(doc(db, 'users', uid), { preferredLanguage: language });
}

export async function getUser(uid: string): Promise<User | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? (snap.data() as User) : null;
}

/**
 * Submits the vendor questionnaire; requires manual admin approval (spec §4.3).
 * A Cloud Function trigger on this write notifies every admin.
 */
export async function applyToBeVendor(uid: string, application: VendorApplication) {
  await updateDoc(doc(db, 'users', uid), {
    isVendor: true,
    vendorApproved: false,
    vendorApplication: application,
  });
}

export async function updateCatalogLayout(uid: string, layout: CatalogLayoutEntry[]): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { catalogLayout: layout });
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

export async function listAllUsers(): Promise<User[]> {
  const snap = await getDocs(collection(db, 'users'));
  return snap.docs.map((d) => d.data() as User);
}

export async function setUserBlocked(uid: string, blocked: boolean): Promise<void> {
  const call = httpsCallable<{ uid: string; blocked: boolean }, { success: boolean }>(
    functions,
    'setUserBlocked',
  );
  await call({ uid, blocked });
}

export async function deleteUserAccount(uid: string): Promise<void> {
  const call = httpsCallable<{ uid: string }, { success: boolean }>(functions, 'deleteUserAccount');
  await call({ uid });
}
