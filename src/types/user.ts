import type { Language } from './common';

export interface PaymentMethod {
  id: string;
  stripePaymentMethodId: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
}

export interface User {
  uid: string;
  displayName: string;
  email: string;
  phone?: string;
  preferredLanguage: Language;
  isVendor: boolean;
  vendorApproved: boolean;
  isAdmin?: boolean;
  stripeCustomerId?: string;
  savedPaymentMethods: PaymentMethod[];
  createdAt: number;
}
