/** What an admin↔applicant conversation is about — currently the only two
 *  kinds of application an admin can message an applicant about. */
export type ConversationContext = 'vendor' | 'institutionOwner';

/**
 * A single admin↔applicant message thread, opened from an application
 * notification when the admin wants to ask a follow-up question instead of
 * (or before) approving/declining outright. One per admin+applicant+context
 * triple — see conversationIdFor in services/conversations.ts — so clicking
 * "Message" twice on the same application reopens the same thread rather
 * than starting a new one.
 */
export interface Conversation {
  conversationId: string;
  participants: [string, string];
  context: ConversationContext;
  /** Which participant is the applicant — the other one is the admin. */
  applicantUid: string;
  createdAt: number;
}

export interface ConversationMessage {
  messageId: string;
  senderUid: string;
  body: string;
  createdAt: number;
}
