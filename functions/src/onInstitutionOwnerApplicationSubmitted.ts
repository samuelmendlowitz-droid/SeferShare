import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from './lib/firebaseAdmin';
import { ensureConversation, postMessage } from './conversations';
import type { User } from './types';

// TODO: replace with the real management inbox, or make this configurable per-admin.
const MANAGEMENT_EMAIL = 'samuelmendlowitz@gmail.com';

/**
 * Fires when a user's document is updated. We only care about the specific
 * transition a fresh institution-owner application makes: isInstitutionOwner
 * flips to true while institutionOwnerApproved is (still) false. Opens (or
 * reuses) a conversation with every admin and posts the application into it
 * as the first message. Mirrors onVendorApplicationSubmitted.ts.
 */
export const onInstitutionOwnerApplicationSubmitted = onDocumentUpdated('users/{uid}', async (event) => {
  const before = event.data?.before.data() as User | undefined;
  const after = event.data?.after.data() as User | undefined;
  if (!before || !after) return;

  const justApplied = !before.isInstitutionOwner && after.isInstitutionOwner && after.institutionOwnerApproved === false;
  if (!justApplied) return;

  const uid = event.params.uid;
  const application = after.institutionOwnerApplication;

  const summary = application
    ? [
        `New institution owner application`,
        `Institution: ${application.institutionName}`,
        `Contact: ${application.contactName}`,
        `Email: ${application.email}`,
        `Phone: ${application.phone}`,
        `Address: ${application.address.line1}, ${application.address.city}, ${application.address.state} ${application.address.postalCode}`,
        application.notes ? `Notes: ${application.notes}` : null,
      ]
        .filter(Boolean)
        .join('\n')
    : `${after.displayName} wants to become a verified institution owner.`;

  const adminsSnap = await db.collection('users').where('isAdmin', '==', true).get();
  for (const adminDoc of adminsSnap.docs) {
    const conversationId = await ensureConversation('institutionOwner', uid, adminDoc.id);
    await postMessage(conversationId, uid, 'application_submitted', summary);
  }

  // Formatted for the Firebase "Trigger Email" extension (firestore-send-email):
  // installing it against this `mail` collection turns this into a real email with
  // no further code changes. Until then this write is inert.
  await db.collection('mail').add({
    to: [MANAGEMENT_EMAIL],
    message: {
      subject: `New institution owner application: ${application?.institutionName ?? after.displayName}`,
      text: summary,
    },
    createdAt: FieldValue.serverTimestamp(),
  });
});
