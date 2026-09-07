import Stripe from 'stripe';
import { defineSecret } from 'firebase-functions/params';

export const stripeSecretKey = defineSecret('STRIPE_SECRET_KEY');
export const stripeWebhookSecret = defineSecret('STRIPE_WEBHOOK_SECRET');

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeClient) {
    stripeClient = new Stripe(stripeSecretKey.value(), { apiVersion: '2025-02-24.acacia' });
  }
  return stripeClient;
}
