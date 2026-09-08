import { onCall, HttpsError, type CallableRequest } from 'firebase-functions/v2/https';
import { auth, db } from './lib/firebaseAdmin';

function requireAdmin(request: CallableRequest<unknown>): string {
  if (request.auth?.token.isAdmin !== true) {
    throw new HttpsError('permission-denied', 'Admin only');
  }
  return request.auth.uid;
}

interface SetUserBlockedRequest {
  uid: string;
  blocked: boolean;
}

/** Disabling at the Auth level actually prevents sign-in, not just a UI flag. */
export const setUserBlocked = onCall<SetUserBlockedRequest>(async (request) => {
  const callerUid = requireAdmin(request);
  const { uid, blocked } = request.data;
  if (uid === callerUid) {
    throw new HttpsError('failed-precondition', "You can't block your own account");
  }

  await auth.updateUser(uid, { disabled: blocked });
  await db.collection('users').doc(uid).set({ blocked }, { merge: true });
  return { success: true };
});

interface DeleteUserAccountRequest {
  uid: string;
}

export const deleteUserAccount = onCall<DeleteUserAccountRequest>(async (request) => {
  const callerUid = requireAdmin(request);
  const { uid } = request.data;
  if (uid === callerUid) {
    throw new HttpsError('failed-precondition', "You can't delete your own account");
  }

  await auth.deleteUser(uid);
  await db.collection('users').doc(uid).delete();
  return { success: true };
});
