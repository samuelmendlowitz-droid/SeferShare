import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Conversation, ConversationMessage } from '../types';

/** Every conversation the given user is a participant in, most-recently-active
 *  first — the "Messages" list. Conversations are only ever created by Cloud
 *  Functions (see firestore.rules); the client never starts one directly. */
export async function listMyConversations(uid: string): Promise<Conversation[]> {
  const snap = await getDocs(
    query(collection(db, 'conversations'), where('participants', 'array-contains', uid), orderBy('lastMessageAt', 'desc')),
  );
  return snap.docs.map((d) => ({ ...(d.data() as Conversation), conversationId: d.id }));
}

export async function getConversation(conversationId: string): Promise<Conversation | null> {
  const snap = await getDoc(doc(db, 'conversations', conversationId));
  return snap.exists() ? { ...(snap.data() as Conversation), conversationId: snap.id } : null;
}

export async function listMessages(conversationId: string): Promise<ConversationMessage[]> {
  const snap = await getDocs(
    query(collection(db, 'conversations', conversationId, 'messages'), orderBy('createdAt', 'asc')),
  );
  return snap.docs.map((d) => ({ ...(d.data() as ConversationMessage), messageId: d.id }));
}

/** Posts a plain reply and refreshes the thread's preview so the list sorts
 *  by recency — the system messages (application submitted/approved/declined)
 *  are only ever posted server-side (see functions/src/conversations.ts). */
export async function sendMessage(conversationId: string, senderUid: string, body: string): Promise<void> {
  await addDoc(collection(db, 'conversations', conversationId, 'messages'), {
    senderUid,
    kind: 'text',
    body,
    createdAt: serverTimestamp(),
  });
  await updateDoc(doc(db, 'conversations', conversationId), {
    lastMessageAt: serverTimestamp(),
    lastMessageBody: body,
    lastMessageSenderUid: senderUid,
  });
}

/** Marks everything in this conversation as read for `uid` — call when they
 *  open the thread, so its unread dot clears on their own list. */
export async function markConversationRead(conversationId: string, uid: string): Promise<void> {
  await updateDoc(doc(db, 'conversations', conversationId), {
    [`lastRead.${uid}`]: serverTimestamp(),
  });
}
