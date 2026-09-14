import { addDoc, collection, doc, getDoc, getDocs, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../lib/firebase';
import type { DonationAd, DonationDedication, DonationItem, Institution } from '../types';

const institutionsRef = collection(db, 'institutions');

export async function listInstitutions(): Promise<Institution[]> {
  const snap = await getDocs(query(institutionsRef, orderBy('name')));
  return snap.docs.map((d) => ({ ...(d.data() as Institution), institutionId: d.id }));
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
