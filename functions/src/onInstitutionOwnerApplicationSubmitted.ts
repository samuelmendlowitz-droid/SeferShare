import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from './lib/firebaseAdmin';
import { notify } from './notify';
import type { User } from './types';

// TODO: replace with the real management inbox, or make this configurable per-admin.
const MANAGEMENT_EMAIL = 'samuelmendlowitz@gmail.com';

/**
 * Fires when a user's document is updated. We only care about the specific
 * transition a fresh institution-owner application makes: isInstitutionOwner
 * flips to true while institutionOwnerApproved is (still) false. Notifies
 * every admin in-app and queues an email to management. Mirrors
 * onVendorApplicationSubmitted.ts.
 */
export const onInstitutionOwnerApplicationSubmitted = onDocumentUpdated('users/{uid}', async (event) => {
  const before = event.data?.before.data() as User | undefined;
  const after = event.data?.after.data() as User | undefined;
  if (!before || !after) return;

  const justApplied = !before.isInstitutionOwner && after.isInstitutionOwner && after.institutionOwnerApproved === false;
  if (!justApplied) return;

  const uid = event.params.uid;
  const application = after.institutionOwnerApplication;

  const adminsSnap = await db.collection('users').where('isAdmin', '==', true).get();
  const batch = db.batch();
  for (const adminDoc of adminsSnap.docs) {
    const notifRef = db.collection('notifications').doc();
    batch.set(notifRef, {
      recipientUid: adminDoc.id,
      kind: 'institution_owner_application_received',
      title: 'New institution owner application',
      body: application
        ? `${application.institutionName} (${application.contactName}) wants to become a verified institution owner.`
        : `${after.displayName} wants to become a verified institution owner.`,
      relatedInstitutionOwnerUid: uid,
      read: false,
      createdAt: FieldValue.serverTimestamp(),
    });
  }
  await batch.commit();

  // Formatted for the Firebase "Trigger Email" extension (firestore-send-email):
  // installing it against this `mail` collection turns this into a real email with
  // no further code changes. Until then this write is inert.
  await db.collection('mail').add({
    to: [MANAGEMENT_EMAIL],
    message: {
      subject: `New institution owner application: ${application?.institutionName ?? after.displayName}`,
      text: application
        ? [
            `Institution: ${application.institutionName}`,
            `Contact: ${application.contactName}`,
            `Email: ${application.email}`,
            `Phone: ${application.phone}`,
            `Address: ${application.address.line1}, ${application.address.city}, ${application.address.state} ${application.address.postalCode}`,
            application.notes ? `Notes: ${application.notes}` : null,
          ]
            .filter(Boolean)
            .join('\n')
        : `${after.displayName} (${after.email}) applied to become a verified institution owner.`,
    },
    createdAt: FieldValue.serverTimestamp(),
  });

  await notify({
    recipientUid: uid,
    kind: 'institution_owner_application_received',
    title: 'Application submitted',
    body: "We've received your institution owner application and will be in touch soon.",
  });
});
