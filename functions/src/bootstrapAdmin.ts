import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { auth, db } from './lib/firebaseAdmin';

// TODO: same as MANAGEMENT_EMAIL elsewhere — replace with something configurable
// per-admin once there's more than one.
const ADMIN_EMAIL = 'samuelmendlowitz@gmail.com';

/** One-time self-service admin bootstrap: grants the CALLER'S OWN account admin
 *  status (the Auth custom claim Firestore rules check, and the Firestore field
 *  the admin UI/notification fan-out queries check) — but only when the caller
 *  is signed in as this one hardcoded email, so it can never be used to
 *  escalate any other account. Called automatically on sign-in (see
 *  AuthContext) whenever that account isn't marked admin yet. */
export const bootstrapAdmin = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Sign in first');
  }
  if (request.auth.token.email !== ADMIN_EMAIL) {
    throw new HttpsError('permission-denied', 'Not the designated admin account');
  }

  const uid = request.auth.uid;
  await auth.setCustomUserClaims(uid, { isAdmin: true });
  await db.collection('users').doc(uid).set({ isAdmin: true }, { merge: true });
  return { success: true };
});
