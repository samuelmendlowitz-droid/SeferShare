import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '../lib/firebase';
import { MAX_SEFER_IMAGES } from '../types/sefer';
import { MAX_INSTITUTION_IMAGES } from '../types/institution';

export async function uploadSeferImage(vendorId: string, file: File, index = 0): Promise<string> {
  const path = `sefer-images/${vendorId}/${Date.now()}-${index}-${file.name}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

export async function uploadSeferImages(vendorId: string, files: File[]): Promise<string[]> {
  const capped = files.slice(0, MAX_SEFER_IMAGES);
  return Promise.all(capped.map((file, index) => uploadSeferImage(vendorId, file, index)));
}

/** `uid` is always the uploading owner's own auth uid (the institution's
 *  createdByUid, or the neshama creator) — mirrors uploadSeferImage's path
 *  shape so the matching storage.rules ownership check (`auth.uid == uid`) is
 *  a simple path-segment comparison, no cross-service lookup needed. */
export async function uploadInstitutionImage(uid: string, file: File, index = 0): Promise<string> {
  const path = `institution-images/${uid}/${Date.now()}-${index}-${file.name}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

export async function uploadInstitutionImages(uid: string, files: File[]): Promise<string[]> {
  const capped = files.slice(0, MAX_INSTITUTION_IMAGES);
  return Promise.all(capped.map((file, index) => uploadInstitutionImage(uid, file, index)));
}

export async function uploadNeshamaImage(uid: string, file: File): Promise<string> {
  const path = `neshama-images/${uid}/${Date.now()}-${file.name}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}
