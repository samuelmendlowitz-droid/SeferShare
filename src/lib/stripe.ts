import { loadStripe } from '@stripe/stripe-js';

export const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

/** Stripe's standard processing fee, used to compute the optional round-up. */
export function estimateStripeFee(amount: number): number {
  return Math.round((amount * 0.029 + 0.3) * 100) / 100;
}
