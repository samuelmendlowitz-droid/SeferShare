import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { db } from './lib/firebaseAdmin';
import { requireAdmin } from './lib/adminAuth';
import { ensureConversation, postMessage } from './conversations';

interface ApproveVendorRequest {
  uid: string;
  approve: boolean;
}

/** Admin-only: grants or denies vendor status (spec §4.3, §15, §16). Posts the
 *  decision into the same conversation the application itself arrived in. */
export const approveVendor = onCall<ApproveVendorRequest>(async (request) => {
  const adminUid = requireAdmin(request);

  const { uid, approve } = request.data;
  if (typeof uid !== 'string' || !uid || typeof approve !== 'boolean') {
    throw new HttpsError('invalid-argument', 'uid (string) and approve (boolean) are required');
  }

  await db.collection('users').doc(uid).update({
    isVendor: approve,
    vendorApproved: approve,
  });

  const conversationId = await ensureConversation('vendor', uid, adminUid);
  await postMessage(
    conversationId,
    adminUid,
    approve ? 'application_approved' : 'application_declined',
    approve
      ? 'Your vendor application was approved — you can now manage your sefer catalog.'
      : 'Your vendor application was not approved at this time.',
  );

  return { success: true };
});
