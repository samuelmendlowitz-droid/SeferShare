import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, orderBy, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../lib/firebase';
import type { Address, DonationAd, DonationDedication, DonationItem, Institution, InstitutionType } from '../types';

const institutionsRef = collection(db, 'institutions');

export async function listInstitutions(): Promise<Institution[]> {
  const snap = await getDocs(query(institutionsRef, orderBy('name')));
  return snap.docs.map((d) => ({ ...(d.data() as Institution), institutionId: d.id }));
}

/** The institutions a specific user owns — used by Profile's "My Institution" tab. */
export async function listInstitutionsByOwner(uid: string): Promise<Institution[]> {
  const snap = await getDocs(query(institutionsRef, where('createdByUid', '==', uid)));
  return snap.docs
    .map((d) => ({ ...(d.data() as Institution), institutionId: d.id }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getInstitution(institutionId: string): Promise<Institution | null> {
  const snap = await getDoc(doc(db, 'institutions', institutionId));
  return snap.exists() ? { ...(snap.data() as Institution), institutionId: snap.id } : null;
}

export async function createInstitution(
  input: Omit<Institution, 'institutionId' | 'createdAt'>,
): Promise<string> {
  const docRef = await addDoc(institutionsRef, { ...input, createdAt: serverTimestamp() });
  return docRef.id;
}

export interface UpdateInstitutionInput {
  name: string;
  hebrewName?: string;
  type: InstitutionType;
  customType?: string;
  address: Address;
}

/** Full edit of an institution's own details by its creator — never touches
 *  giftCardBalance, which is server-owned (the Firestore rule rejects an owner
 *  update that changes it). */
export async function updateInstitution(institutionId: string, input: UpdateInstitutionInput): Promise<void> {
  await updateDoc(doc(db, 'institutions', institutionId), {
    name: input.name,
    hebrewName: input.hebrewName ?? null,
    type: input.type,
    customType: input.type === 'other' ? input.customType ?? null : null,
    address: input.address,
  });
}

export async function deleteInstitution(institutionId: string): Promise<void> {
  await deleteDoc(doc(db, 'institutions', institutionId));
}

interface VerifyInstitutionInput {
  institutionId: string;
  verify: boolean;
}

/** Admin-only: verifies (or unverifies) one specific institution — a separate
 *  step from its owner's person-level institution-owner approval. */
export async function verifyInstitution(input: VerifyInstitutionInput): Promise<void> {
  const call = httpsCallable<VerifyInstitutionInput, { success: boolean }>(functions, 'verifyInstitution');
  await call(input);
}

export interface SpendInstitutionBalanceInput {
  institutionId: string;
  items: DonationItem[];
  donorMessage?: string;
  donorDedication?: DonationDedication;
  ad?: DonationAd;
}

export interface SpendInstitutionBalanceResult {
  donationId: string;
  totalSpent: number;
}

/** Lets the institution's owner spend its gift card balance on seforim for itself —
 *  no Stripe payment involved, so this runs entirely server-side against the balance. */
export async function spendInstitutionBalance(
  input: SpendInstitutionBalanceInput,
): Promise<SpendInstitutionBalanceResult> {
  const call = httpsCallable<SpendInstitutionBalanceInput, SpendInstitutionBalanceResult>(
    functions,
    'spendInstitutionBalance',
  );
  const result = await call(input);
  return result.data;
}
