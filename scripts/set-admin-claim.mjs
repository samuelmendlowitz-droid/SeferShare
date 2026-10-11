// One-time bootstrap: grants admin to a user by UID — both the Auth custom
// claim (what firestore.rules and Cloud Functions actually check) and the
// Firestore users/{uid}.isAdmin field (what the client reads to decide
// whether to show the Admin page and whom to notify of new applications —
// see onVendorApplicationSubmitted.ts / onInstitutionOwnerApplicationSubmitted.ts).
// Usage: GOOGLE_APPLICATION_CREDENTIALS=./service-account.json node scripts/set-admin-claim.mjs <uid>
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const uid = process.argv[2];
if (!uid) {
  console.error('Usage: node scripts/set-admin-claim.mjs <uid>');
  process.exit(1);
}

initializeApp({ credential: applicationDefault() });

await getAuth().setCustomUserClaims(uid, { isAdmin: true });
await getFirestore().collection('users').doc(uid).set({ isAdmin: true }, { merge: true });
console.log(`Granted isAdmin claim + Firestore field to ${uid}. They must sign out/in for it to take effect.`);
