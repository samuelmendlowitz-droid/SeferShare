import type { Address, Language } from './common';

export interface PaymentMethod {
  id: string;
  stripePaymentMethodId: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
}

export interface VendorApplication {
  companyName: string;
  contactName: string;
  address: Address;
  phone: string;
  email: string;
  notes?: string;
  submittedAt: number;
}

export interface User {
  uid: string;
  displayName: string;
  email: string;
  phone?: string;
  preferredLanguage: Language;
  isVendor: boolean;
  vendorApproved: boolean;
  vendorApplication?: VendorApplication;
  isAdmin?: boolean;
  stripeCustomerId?: string;
  savedPaymentMethods: PaymentMethod[];
  createdAt: number;
}
