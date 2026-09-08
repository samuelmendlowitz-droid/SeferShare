import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '../lib/firebase';
import { MAX_SEFER_IMAGES } from '../types/sefer';

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
