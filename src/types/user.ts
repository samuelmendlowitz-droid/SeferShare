import type { Address, Language } from './common';
import type { StickerDesign } from './donation';

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
  blocked?: boolean;
  stripeCustomerId?: string;
  savedPaymentMethods: PaymentMethod[];
  /** The donor's saved dedication-sticker design — pre-fills the cart's sticker
   *  editor so a repeat donor can pick up (and keep tweaking) where they left off. */
  defaultStickerDesign?: StickerDesign;
  createdAt: number;
}
