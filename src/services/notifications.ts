import { collection, doc, getDocs, orderBy, query, updateDoc, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Notification } from '../types';

const notificationsRef = collection(db, 'notifications');

export async function listMyNotifications(uid: string): Promise<Notification[]> {
  const snap = await getDocs(
    query(notificationsRef, where('recipientUid', '==', uid), orderBy('createdAt', 'desc')),
  );
  return snap.docs.map((d) => d.data() as Notification);
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  await updateDoc(doc(db, 'notifications', notificationId), { read: true });
}
