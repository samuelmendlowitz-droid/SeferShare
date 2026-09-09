export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export type CampaignStatus = 'active' | 'fulfilled' | 'paused';

export interface CampaignItem {
  seferId: string;
  vendorId: string;
  quantity: number;
  quantityFulfilled: number;
  retailPrice: number;
}

export interface Campaign {
  campaignId: string;
  createdByUid: string;
  title?: string | null;
  institutionId?: string | null;
  neshamaId?: string | null;
  items: CampaignItem[];
  shippingAddress: Address;
  status: CampaignStatus;
  totalItemsNeeded: number;
  totalItemsFulfilled: number;
  lastProgressAt: FirebaseFirestore.Timestamp;
  currentMilestone: number;
  language: 'en' | 'he' | 'both';
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

export type DonationStatus = 'pending' | 'paid' | 'fulfilled' | 'refunded';

export interface DonationItem {
  seferId: string;
  vendorId: string;
  quantity: number;
  priceEach: number;
}

export interface CampaignAssignment {
  campaignId: string;
  itemsFulfilled: number;
}

export interface Donation {
  donationId: string;
  donorUid: string;
  stripePaymentIntentId: string;
  items: DonationItem[];
  requestedInstitutionId?: string | null;
  requestedNeshamaId?: string | null;
  campaignAssignments: CampaignAssignment[];
  donorMessage?: string | null;
  roundedUpFee: boolean;
  totalCharged: number;
  status: DonationStatus;
  createdAt: FirebaseFirestore.Timestamp;
}

export type OrderStatus = 'pending' | 'shipped' | 'delivered';

export interface OrderItem {
  seferId: string;
  quantity: number;
  priceEach: number;
}

export interface Order {
  orderId: string;
  donationId: string;
  vendorId: string;
  items: OrderItem[];
  shippingAddress: Address;
  status: OrderStatus;
  createdAt: FirebaseFirestore.Timestamp;
}

export interface VendorPricing {
  seferId: string;
  vendorId: string;
  retailPrice: number;
  wholesalePrice: number;
}

export interface PublicVendorListing {
  vendorId: string;
  vendorName: string;
  price: number;
  stockQty: number;
  imageUrls?: string[];
}

export interface Sefer {
  seferId: string;
  hebrewName: string;
  englishName: string;
  phoneticName: string;
  type: string;
  vendorListings: PublicVendorListing[];
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
  isVendor: boolean;
  vendorApproved: boolean;
  vendorApplication?: VendorApplication;
  isAdmin?: boolean;
  blocked?: boolean;
  stripeCustomerId?: string;
}

export type NotificationKind =
  | 'donation_received'
  | 'campaign_fulfilled'
  | 'payment_confirmed'
  | 'order_shipped'
  | 'vendor_application_received'
  | 'vendor_application_approved'
  | 'vendor_application_declined';
