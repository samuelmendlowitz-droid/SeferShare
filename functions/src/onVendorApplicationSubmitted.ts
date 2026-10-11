import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from './lib/firebaseAdmin';
import { ensureConversation, postMessage } from './conversations';
import type { User } from './types';

// TODO: replace with the real management inbox, or make this configurable per-admin.
const MANAGEMENT_EMAIL = 'samuelmendlowitz@gmail.com';

/**
 * Fires when a user's document is updated. We only care about the specific
 * transition a fresh vendor application makes: isVendor flips to true while
 * vendorApproved is (still) false. Opens (or reuses) a conversation with
 * every admin and posts the application into it as the first message — the
 * admin sees it, approves/declines/replies, and everything about this
 * applicant from here on lands in that same thread.
 */
export const onVendorApplicationSubmitted = onDocumentUpdated('users/{uid}', async (event) => {
  const before = event.data?.before.data() as User | undefined;
  const after = event.data?.after.data() as User | undefined;
  if (!before || !after) return;

  const justApplied = !before.isVendor && after.isVendor && after.vendorApproved === false;
  if (!justApplied) return;

  const uid = event.params.uid;
  const application = after.vendorApplication;

  const summary = application
    ? [
        `New vendor application`,
        `Company: ${application.companyName}`,
        `Contact: ${application.contactName}`,
        `Email: ${application.email}`,
        `Phone: ${application.phone}`,
        `Address: ${application.address.line1}, ${application.address.city}, ${application.address.state} ${application.address.postalCode}`,
        application.notes ? `Notes: ${application.notes}` : null,
      ]
        .filter(Boolean)
        .join('\n')
    : `${after.displayName} wants to become a vendor.`;

  const adminsSnap = await db.collection('users').where('isAdmin', '==', true).get();
  for (const adminDoc of adminsSnap.docs) {
    const conversationId = await ensureConversation('vendor', uid, adminDoc.id);
    await postMessage(conversationId, uid, 'application_submitted', summary);
  }

  // Formatted for the Firebase "Trigger Email" extension (firestore-send-email):
  // installing it against this `mail` collection turns this into a real email with
  // no further code changes. Until then this write is inert.
  await db.collection('mail').add({
    to: [MANAGEMENT_EMAIL],
    message: {
      subject: `New vendor application: ${application?.companyName ?? after.displayName}`,
      text: summary,
    },
    createdAt: FieldValue.serverTimestamp(),
  });
});
