# Sefer Share

> ⚠️ "Sefer Share" is a placeholder name — every occurrence in code, UI copy, and config is flagged with `// TODO: replace "Sefer Share" with final platform name`.

A mobile-first web app where people donate seforim (Jewish books) to institutions (shuls, schools, yeshivos) and/or dedicate the donation to a person's memory (l'iluy nishmat). Every campaign is built from three pieces: **Where** (institution), **What** (specific seforim), and **Who** (neshama).

## Stack

- **Frontend**: React + TypeScript + Vite, Tailwind CSS, react-router-dom, react-i18next (English/Hebrew with global RTL/LTR switching)
- **Backend**: Firebase (Firestore, Auth, Storage, Cloud Functions)
- **Payments**: Stripe (PaymentIntents, created server-side only)
- **Hosting**: currently deployed to Firebase Hosting (https://sefershare.web.app) for early testing; the spec calls for Cloudflare Pages long-term (see `public/_redirects` for that SPA fallback)

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in your Firebase + Stripe keys
npm run dev
```

```bash
cd functions
npm install
npm run build
```

### Firebase setup

1. Create a Firebase project, enable Firestore, Auth (Google, Email/Password, Phone), Storage, and Functions.
2. **Set `VITE_FIREBASE_AUTH_DOMAIN` to your Firebase Hosting domain** (e.g. `<project>.web.app`), not the default `<project>.firebaseapp.com`. Google sign-in stores pending auth state keyed to this origin; browsers with storage partitioning (Chrome, Safari ITP, Brave) treat `.web.app` and `.firebaseapp.com` as different sites, which breaks both `signInWithPopup` and `signInWithRedirect` with a "missing initial state" error if they don't match where the app is served.
3. `firebase deploy --only firestore:rules,firestore:indexes,storage`
4. `firebase deploy --only hosting` (after `npm run build`) to serve the frontend from Firebase Hosting.
5. Set Cloud Functions secrets: `firebase functions:secrets:set STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`. Until these are set, `createPaymentIntent` and `confirmDonation` stay commented out in `functions/src/index.ts` (see the TODO there) — Firebase's function analyzer resolves secret bindings for every exported function up front, so deploying anything else fails if those two are present without the secrets existing.
6. `firebase deploy --only functions`
7. Point your Stripe webhook at the deployed `confirmDonation` URL, subscribed to `payment_intent.succeeded`.
8. Bootstrap your first admin (there is no self-service admin signup by design):
   ```bash
   GOOGLE_APPLICATION_CREDENTIALS=./service-account.json node scripts/set-admin-claim.mjs <uid>
   ```
   This also flips their Firestore `users/{uid}.isAdmin` field manually (used for UI gating) — the custom claim is what Firestore/Functions security actually checks.

### Cloudflare Pages

Build command: `npm run build`. Output directory: `dist`. `public/_redirects` is copied into `dist` automatically so client-side routes resolve.

## Architecture notes

- **`wholesalePrice` never reaches the client.** It lives in a separate `vendorPricing/{seferId}_{vendorId}` document, readable only by the owning vendor and admins. The public `sefarim` catalog only ever carries the client-safe `PublicVendorListing` shape (see `src/types/sefer.ts`).
- **The 10% milestone auto-assignment algorithm** (spec §7) runs entirely server-side in `functions/src/algorithm.ts`, invoked from the `confirmDonation` Stripe webhook — never on the client.
- **Campaign progress is tracked in item counts**, not dollars; the dollar total is derived and shown as secondary/smaller text everywhere (`src/lib/campaignMath.ts`).
- **Bilingual fields** (sefer/neshama/institution names) always store both `hebrewName` and an English name; `LanguageContext` drives global `dir="rtl"|"ltr"` plus `i18next` locale switching.

## Known v1 limitations (flagged with TODOs in code)

- Orders don't yet carry a per-campaign shipping address when a single donation spans multiple campaigns — see the TODO in `functions/src/confirmDonation.ts`.
- Merging duplicate `sefarim` entries (admin panel) doesn't rewrite existing campaign/donation item references to the deleted id.
- Push notifications (PWA) and email notifications are not wired up — only in-app notifications exist.

## Out of scope for v1 (per spec §17)

Physical dedication cards, native mobile apps, recurring donations, social sharing beyond the virtual card, and vendor-owned warehousing.
