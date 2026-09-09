import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../lib/firebase';
import type { Donation, DonationItem } from '../types';

const donationsRef = collection(db, 'donations');

export async function listMyDonations(uid: string): Promise<Donation[]> {
  const snap = await getDocs(query(donationsRef, where('donorUid', '==', uid), orderBy('createdAt', 'desc')));
  return snap.docs.map((d) => ({ ...(d.data() as Donation), donationId: d.id }));
}

export interface CreatePaymentIntentInput {
  items: DonationItem[];
  requestedInstitutionId?: string;
  requestedNeshamaId?: string;
  donorMessage?: string;
  roundedUpFee: boolean;
}

export interface CreatePaymentIntentResult {
  clientSecret: string;
  donationId: string;
  totalCharged: number;
}

/**
 * The PaymentIntent (and the Donation draft it seeds) is created entirely server-side
 * so pricing — including any wholesale figures used to compute totals — is never
 * trusted from the client (spec §8, §16).
 */
export async function createPaymentIntent(
  input: CreatePaymentIntentInput,
): Promise<CreatePaymentIntentResult> {
  const call = httpsCallable<CreatePaymentIntentInput, CreatePaymentIntentResult>(
    functions,
    'createPaymentIntent',
  );
  const result = await call(input);
  return result.data;
}
