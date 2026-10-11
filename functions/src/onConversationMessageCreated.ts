import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { db } from './lib/firebaseAdmin';
import { notify } from './notify';
import type { Conversation, ConversationMessage } from './types';

const PREVIEW_LENGTH = 120;

/**
 * Fires whenever either side of an admin↔applicant conversation (see
 * conversations/{conversationId}, started from an application notification's
 * "Message" button) posts a new message. Notifies whichever participant
 * didn't send it — the client only ever writes the message itself, never a
 * notification for someone else (that write is admin-only per firestore.rules),
 * so this fan-out has to happen here, mirroring onVendorApplicationSubmitted.ts.
 */
export const onConversationMessageCreated = onDocumentCreated(
  'conversations/{conversationId}/messages/{messageId}',
  async (event) => {
    const message = event.data?.data() as ConversationMessage | undefined;
    if (!message) return;

    const { conversationId } = event.params;
    const conversationSnap = await db.collection('conversations').doc(conversationId).get();
    const conversation = conversationSnap.data() as Conversation | undefined;
    if (!conversation) return;

    const recipientUid = conversation.participants.find((uid) => uid !== message.senderUid);
    if (!recipientUid) return;

    const preview =
      message.body.length > PREVIEW_LENGTH ? `${message.body.slice(0, PREVIEW_LENGTH)}…` : message.body;

    await notify({
      recipientUid,
      kind: 'message_received',
      title: 'New message',
      body: preview,
      relatedConversationId: conversationId,
    });
  },
);
