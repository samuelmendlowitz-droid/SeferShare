import { addDoc, collection, doc, getDoc, getDocs, orderBy, query, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Conversation, ConversationContext, ConversationMessage } from '../types';

/** One conversation per admin+applicant+context triple — a deterministic id
 *  so clicking "Message" again on the same application reopens the same
 *  thread instead of starting a new one. */
export function conversationIdFor(context: ConversationContext, applicantUid: string): string {
  return `${context}_${applicantUid}`;
}

/** Creates the conversation if it doesn't exist yet (admin-only per
 *  firestore.rules); a no-op write if it's already there. */
export async function ensureConversation(
  context: ConversationContext,
  applicantUid: string,
  adminUid: string,
): Promise<string> {
  const conversationId = conversationIdFor(context, applicantUid);
  const ref = doc(db, 'conversations', conversationId);
  const existing = await getDoc(ref);
  if (!existing.exists()) {
    await setDoc(ref, {
      participants: [adminUid, applicantUid],
      context,
      applicantUid,
      createdAt: serverTimestamp(),
    });
  }
  return conversationId;
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

export async function sendMessage(conversationId: string, senderUid: string, body: string): Promise<void> {
  await addDoc(collection(db, 'conversations', conversationId, 'messages'), {
    senderUid,
    body,
    createdAt: serverTimestamp(),
  });
}
