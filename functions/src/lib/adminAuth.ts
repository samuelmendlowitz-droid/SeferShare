import { HttpsError, type CallableRequest } from 'firebase-functions/v2/https';

/** Throws unless the caller's auth token carries the admin custom claim; returns their uid otherwise. */
export function requireAdmin(request: CallableRequest<unknown>): string {
  if (request.auth?.token.isAdmin !== true) {
    throw new HttpsError('permission-denied', 'Admin only');
  }
  return request.auth.uid;
}
