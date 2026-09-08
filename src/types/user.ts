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

/** A vendor's catalog display order: sefer listings interleaved with named group dividers. */
export type CatalogLayoutEntry = { kind: 'sefer'; seferId: string } | { kind: 'divider'; id: string; label: string };

export interface User {
  uid: string;
  displayName: string;
  email: string;
  phone?: string;
  preferredLanguage: Language;
  isVendor: boolean;
  vendorApproved: boolean;
  vendorApplication?: VendorApplication;
  catalogLayout?: CatalogLayoutEntry[];
  isAdmin?: boolean;
  blocked?: boolean;
  stripeCustomerId?: string;
  savedPaymentMethods: PaymentMethod[];
  createdAt: number;
}
