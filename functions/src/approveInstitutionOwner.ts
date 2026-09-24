import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { db } from './lib/firebaseAdmin';
import { requireAdmin } from './lib/adminAuth';
import { notify } from './notify';

interface ApproveInstitutionOwnerRequest {
  uid: string;
  approve: boolean;
}

/** Admin-only: grants or denies institution-owner status — a prerequisite for
 *  creating any institution (each institution then also needs its own separate
 *  verification; see verifyInstitution.ts). Mirrors approveVendor.ts. */
export const approveInstitutionOwner = onCall<ApproveInstitutionOwnerRequest>(async (request) => {
  requireAdmin(request);

  const { uid, approve } = request.data;
  if (typeof uid !== 'string' || !uid || typeof approve !== 'boolean') {
    throw new HttpsError('invalid-argument', 'uid (string) and approve (boolean) are required');
  }

  await db.collection('users').doc(uid).update({
    isInstitutionOwner: approve,
    institutionOwnerApproved: approve,
  });

  await notify({
    recipientUid: uid,
    kind: approve ? 'institution_owner_application_approved' : 'institution_owner_application_declined',
    title: approve ? "You're approved!" : 'Institution application update',
    body: approve
      ? "Your institution owner application was approved — you can now add your institution(s)."
      : 'Your institution owner application was not approved at this time.',
  });

  return { success: true };
});
