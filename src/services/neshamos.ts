import { addDoc, collection, doc, getDoc, getDocs, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Neshama, ParentGender, SeferType } from '../types';

const neshamosRef = collection(db, 'neshamos');

export async function listNeshamos(): Promise<Neshama[]> {
  const snap = await getDocs(query(neshamosRef, orderBy('name')));
  return snap.docs.map((d) => ({ ...(d.data() as Neshama), neshamaId: d.id }));
}

export async function getNeshama(neshamaId: string): Promise<Neshama | null> {
  const snap = await getDoc(doc(db, 'neshamos', neshamaId));
  return snap.exists() ? { ...(snap.data() as Neshama), neshamaId: snap.id } : null;
}

export interface CreateNeshamaInput {
  name: string;
  hebrewName?: string;
  parentGender: ParentGender;
  fatherHebrewName: string;
  seferTypes?: SeferType[];
  seferIds?: string[];
}

export async function createNeshama(input: CreateNeshamaInput): Promise<string> {
  const docRef = await addDoc(neshamosRef, {
    name: input.name,
    hebrewName: input.hebrewName ?? null,
    parentGender: input.parentGender,
    fatherHebrewName: input.fatherHebrewName,
    seferTypes: input.seferTypes ?? [],
    seferIds: input.seferIds ?? [],
    lastDedicatedAt: null,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}
