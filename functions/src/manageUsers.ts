import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { auth, db } from './lib/firebaseAdmin';
import { requireAdmin } from './lib/adminAuth';

interface SetUserBlockedRequest {
  uid: string;
  blocked: boolean;
}

/** Disabling at the Auth level actually prevents sign-in, not just a UI flag. */
export const setUserBlocked = onCall<SetUserBlockedRequest>(async (request) => {
  const callerUid = requireAdmin(request);
  const { uid, blocked } = request.data;
  if (typeof uid !== 'string' || !uid || typeof blocked !== 'boolean') {
    throw new HttpsError('invalid-argument', 'uid (string) and blocked (boolean) are required');
  }
  if (uid === callerUid) {
    throw new HttpsError('failed-precondition', "You can't block your own account");
  }

  await auth.updateUser(uid, { disabled: blocked });
  if (blocked) {
    // Disabling the account doesn't invalidate tokens already issued — revoke them
    // too, so a session signed in before the block doesn't keep working until it expires.
    await auth.revokeRefreshTokens(uid);
  }
  await db.collection('users').doc(uid).set({ blocked }, { merge: true });
  return { success: true };
});

interface DeleteUserAccountRequest {
  uid: string;
}

export const deleteUserAccount = onCall<DeleteUserAccountRequest>(async (request) => {
  const callerUid = requireAdmin(request);
  const { uid } = request.data;
  if (typeof uid !== 'string' || !uid) {
    throw new HttpsError('invalid-argument', 'uid (string) is required');
  }
  if (uid === callerUid) {
    throw new HttpsError('failed-precondition', "You can't delete your own account");
  }

  await auth.deleteUser(uid);
  await db.collection('users').doc(uid).delete();
  return { success: true };
});
