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

/** Person-level application to become a verified institution owner — a
 *  prerequisite for creating any Institution (each institution then also
 *  needs its own separate verification; see Institution.verified). */
export interface InstitutionOwnerApplication {
  institutionName: string;
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
  isInstitutionOwner: boolean;
  institutionOwnerApproved: boolean;
  institutionOwnerApplication?: InstitutionOwnerApplication;
  isAdmin?: boolean;
  blocked?: boolean;
  stripeCustomerId?: string;
  savedPaymentMethods: PaymentMethod[];
  createdAt: number;
}
