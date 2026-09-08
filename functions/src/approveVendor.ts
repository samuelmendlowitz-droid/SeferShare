import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { db } from './lib/firebaseAdmin';
import { notify } from './notify';

interface ApproveVendorRequest {
  uid: string;
  approve: boolean;
}

/** Admin-only: grants or denies vendor status (spec §4.3, §15, §16). */
export const approveVendor = onCall<ApproveVendorRequest>(async (request) => {
  if (request.auth?.token.isAdmin !== true) {
    throw new HttpsError('permission-denied', 'Admin only');
  }

  const { uid, approve } = request.data;
  await db.collection('users').doc(uid).update({
    isVendor: approve,
    vendorApproved: approve,
  });

  await notify({
    recipientUid: uid,
    kind: approve ? 'vendor_application_approved' : 'vendor_application_declined',
    title: approve ? "You're approved!" : 'Vendor application update',
    body: approve
      ? 'Your vendor application was approved — you can now manage your sefer catalog.'
      : 'Your vendor application was not approved at this time.',
  });

  return { success: true };
});
