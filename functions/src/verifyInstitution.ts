import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { db } from './lib/firebaseAdmin';
import { requireAdmin } from './lib/adminAuth';
import { notify } from './notify';
import type { Institution } from './types';

interface VerifyInstitutionRequest {
  institutionId: string;
  verify: boolean;
}

/** Admin-only: verifies (or unverifies) one specific institution — separate
 *  from its owner's person-level institutionOwnerApproved. Only a verified
 *  institution can receive donations, claim unassigned seforim, or appear in
 *  "Campaigns for My Institution" (spec). */
export const verifyInstitution = onCall<VerifyInstitutionRequest>(async (request) => {
  requireAdmin(request);

  const { institutionId, verify } = request.data;
  if (typeof institutionId !== 'string' || !institutionId || typeof verify !== 'boolean') {
    throw new HttpsError('invalid-argument', 'institutionId (string) and verify (boolean) are required');
  }

  const ref = db.collection('institutions').doc(institutionId);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new HttpsError('not-found', 'Institution not found');
  }
  const institution = snap.data() as Institution;

  await ref.update({ verified: verify });

  await notify({
    recipientUid: institution.createdByUid,
    kind: 'institution_verified',
    title: verify ? 'Your institution is verified!' : 'Institution verification update',
    body: verify
      ? `${institution.name} is now verified — it can receive donations and appear in campaigns.`
      : `${institution.name}'s verification was removed.`,
    relatedInstitutionId: institutionId,
  });

  return { success: true };
});
