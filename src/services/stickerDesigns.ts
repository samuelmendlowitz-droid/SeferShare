import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, updateDoc, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { SavedStickerDesign, StickerDesign } from '../types';

const designsRef = collection(db, 'stickerDesigns');

export async function listMyStickerDesigns(uid: string): Promise<SavedStickerDesign[]> {
  const snap = await getDocs(query(designsRef, where('createdByUid', '==', uid), orderBy('updatedAt', 'desc')));
  return snap.docs.map((d) => ({ ...(d.data() as SavedStickerDesign), designId: d.id }));
}

export async function createStickerDesign(uid: string, design: StickerDesign, name: string): Promise<string> {
  const now = Date.now();
  const ref = await addDoc(designsRef, { createdByUid: uid, name, design, createdAt: now, updatedAt: now });
  return ref.id;
}

/** Updates a saved design's visual choices in place (auto-save while editing). */
export async function updateStickerDesignContent(designId: string, design: StickerDesign): Promise<void> {
  await updateDoc(doc(db, 'stickerDesigns', designId), { design, updatedAt: Date.now() });
}

export async function renameStickerDesign(designId: string, name: string): Promise<void> {
  await updateDoc(doc(db, 'stickerDesigns', designId), { name });
}

export async function deleteStickerDesign(designId: string): Promise<void> {
  await deleteDoc(doc(db, 'stickerDesigns', designId));
}
