/** What an admin↔applicant conversation is about. */
export type ConversationContext = 'vendor' | 'institutionOwner';

/** 'text' is an ordinary back-and-forth message; the other three are system
 *  events posted into the same thread so the whole history — application,
 *  decision, and any follow-up questions — reads as one conversation. */
export type MessageKind = 'text' | 'application_submitted' | 'application_approved' | 'application_declined';

/**
 * A single admin↔applicant message thread — created automatically the
 * moment someone applies to be a vendor or institution owner (see
 * functions/src/conversations.ts), not by anyone clicking a "start"
 * button. One per admin+applicant+context triple (see conversationIdFor),
 * so every future notification between these two people — the decision,
 * any questions — lands in this same thread.
 */
export interface Conversation {
  conversationId: string;
  participants: [string, string];
  context: ConversationContext;
  /** Which participant is the applicant — the other one is the admin. */
  applicantUid: string;
  createdAt: number;
  lastMessageAt?: number;
  lastMessageBody?: string;
  lastMessageSenderUid?: string;
  /** Per-participant "I've seen up to this point" marker — a conversation is
   *  unread for uid when (lastRead[uid] ?? 0) < lastMessageAt. */
  lastRead?: Record<string, number>;
}

export interface ConversationMessage {
  messageId: string;
  senderUid: string;
  kind: MessageKind;
  body: string;
  createdAt: number;
}
