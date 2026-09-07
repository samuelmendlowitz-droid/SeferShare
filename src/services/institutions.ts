import { addDoc, collection, doc, getDoc, getDocs, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Institution } from '../types';

const institutionsRef = collection(db, 'institutions');

export async function listInstitutions(): Promise<Institution[]> {
  const snap = await getDocs(query(institutionsRef, orderBy('name')));
  return snap.docs.map((d) => d.data() as Institution);
}

export async function getInstitution(institutionId: string): Promise<Institution | null> {
  const snap = await getDoc(doc(db, 'institutions', institutionId));
  return snap.exists() ? (snap.data() as Institution) : null;
}

export async function createInstitution(
  input: Omit<Institution, 'institutionId' | 'createdAt'>,
): Promise<string> {
  const docRef = await addDoc(institutionsRef, { ...input, createdAt: serverTimestamp() });
  return docRef.id;
}
