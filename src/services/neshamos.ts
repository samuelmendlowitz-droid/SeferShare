import { addDoc, collection, doc, getDoc, getDocs, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Neshama } from '../types';

const neshamosRef = collection(db, 'neshamos');

export async function listNeshamos(): Promise<Neshama[]> {
  const snap = await getDocs(query(neshamosRef, orderBy('name')));
  return snap.docs.map((d) => d.data() as Neshama);
}

export async function getNeshama(neshamaId: string): Promise<Neshama | null> {
  const snap = await getDoc(doc(db, 'neshamos', neshamaId));
  return snap.exists() ? (snap.data() as Neshama) : null;
}

export async function createNeshama(
  input: Omit<Neshama, 'neshamaId' | 'createdAt' | 'campaignCount'>,
): Promise<string> {
  const docRef = await addDoc(neshamosRef, { ...input, campaignCount: 0, createdAt: serverTimestamp() });
  return docRef.id;
}
