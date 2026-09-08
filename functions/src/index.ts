// TODO: re-enable once Stripe secrets (STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET) are
// set via `firebase functions:secrets:set` — until then, deploying these fails
// because Firebase's function analyzer resolves their secret bindings up front,
// which requires the Secret Manager API to be enabled on the project.
// export { createPaymentIntent } from './createPaymentIntent';
// export { confirmDonation } from './confirmDonation';
export { onCampaignUpdate } from './onCampaignUpdate';
export { approveVendor } from './approveVendor';
export { onVendorApplicationSubmitted } from './onVendorApplicationSubmitted';
export { setUserBlocked, deleteUserAccount } from './manageUsers';
