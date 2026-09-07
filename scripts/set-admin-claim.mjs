// One-time bootstrap: grants the `isAdmin` custom claim to a user by UID.
// Usage: GOOGLE_APPLICATION_CREDENTIALS=./service-account.json node scripts/set-admin-claim.mjs <uid>
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const uid = process.argv[2];
if (!uid) {
  console.error('Usage: node scripts/set-admin-claim.mjs <uid>');
  process.exit(1);
}

initializeApp({ credential: applicationDefault() });

await getAuth().setCustomUserClaims(uid, { isAdmin: true });
console.log(`Granted isAdmin claim to ${uid}. They must sign out/in for it to take effect.`);
