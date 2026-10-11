import { FieldValue } from 'firebase-admin/firestore';
import { db } from './lib/firebaseAdmin';
import type { ConversationContext, MessageKind } from './types';

/** One conversation per admin+applicant+context triple — a deterministic id
 *  so every notification between these two people (the application itself,
 *  the decision, any follow-up questions) lands in the same thread instead
 *  of starting a new one each time. Mirrors the client's identical helper in
 *  src/services/conversations.ts. */
export function conversationIdFor(context: ConversationContext, applicantUid: string): string {
  return `${context}_${applicantUid}`;
}

/** Creates the conversation if it doesn't exist yet; a no-op if it's already
 *  there (e.g. the applicant re-applying, or an admin re-deciding). Only ever
 *  called from Cloud Functions — clients can't create conversations directly
 *  (see firestore.rules), so there's never a race with a client-side create. */
export async function ensureConversation(
  context: ConversationContext,
  applicantUid: string,
  adminUid: string,
): Promise<string> {
  const conversationId = conversationIdFor(context, applicantUid);
  const ref = db.collection('conversations').doc(conversationId);
  const snap = await ref.get();
  if (!snap.exists) {
    await ref.set({
      participants: [adminUid, applicantUid],
      context,
      applicantUid,
      createdAt: FieldValue.serverTimestamp(),
    });
  }
  return conversationId;
}

/** Posts one message (a real reply, or a system event like the application
 *  itself or the admin's decision) and refreshes the conversation's preview
 *  fields so the thread list sorts by recency and shows what happened last. */
export async function postMessage(
  conversationId: string,
  senderUid: string,
  kind: MessageKind,
  body: string,
): Promise<void> {
  const ref = db.collection('conversations').doc(conversationId);
  await ref.collection('messages').add({
    senderUid,
    kind,
    body,
    createdAt: FieldValue.serverTimestamp(),
  });
  await ref.update({
    lastMessageAt: FieldValue.serverTimestamp(),
    lastMessageBody: body,
    lastMessageSenderUid: senderUid,
  });
}
