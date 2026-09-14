import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore';
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
  createdByUid: string;
  name: string;
  hebrewName?: string;
  parentGender: ParentGender;
  fatherHebrewName: string;
  seferTypes?: SeferType[];
  seferIds?: string[];
}

export async function createNeshama(input: CreateNeshamaInput): Promise<string> {
  const docRef = await addDoc(neshamosRef, {
    createdByUid: input.createdByUid,
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

export interface UpdateNeshamaInput {
  name: string;
  hebrewName?: string;
  parentGender: ParentGender;
  fatherHebrewName: string;
  seferTypes?: SeferType[];
  seferIds?: string[];
}

/** Full edit of a neshama's own details by its creator — never touches
 *  lastDedicatedAt, which is server/algorithm-owned (the Firestore rule for
 *  neshamos rejects an owner update that changes it). */
export async function updateNeshama(neshamaId: string, input: UpdateNeshamaInput): Promise<void> {
  await updateDoc(doc(db, 'neshamos', neshamaId), {
    name: input.name,
    hebrewName: input.hebrewName ?? null,
    parentGender: input.parentGender,
    fatherHebrewName: input.fatherHebrewName,
    seferTypes: input.seferTypes ?? [],
    seferIds: input.seferIds ?? [],
  });
}

export async function deleteNeshama(neshamaId: string): Promise<void> {
  await deleteDoc(doc(db, 'neshamos', neshamaId));
}
