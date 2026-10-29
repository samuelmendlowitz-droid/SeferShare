import type { Address } from './common';
import type { DonationDedication, StickerDesign } from './donation';

/** Replaces the old per-donation `Order`: admin never auto-ships straight to
 *  a vendor the moment a donation is paid. Instead each physical copy a
 *  donation (or a piece of claimed availableStock) needs becomes one
 *  FulfillmentNeed, which admin works from its own dashboard — fulfilling it
 *  from Stock on hand, or batching it into a VendorPurchaseOrder, then
 *  grouping it with others bound for the same place into a Shipment. */
export type FulfillmentNeedStatus =
  | 'needsFulfillment'
  | 'fulfilledFromStock'
  | 'onOrder'
  | 'received'
  | 'packed'
  | 'shipped'
  | 'delivered';

export const FULFILLMENT_NEED_STATUSES: FulfillmentNeedStatus[] = [
  'needsFulfillment',
  'fulfilledFromStock',
  'onOrder',
  'received',
  'packed',
  'shipped',
  'delivered',
];

export interface FulfillmentNeed {
  fulfillmentNeedId: string;
  seferId: string;
  vendorId: string;
  /** Absent when sourced from claimed availableStock, which may be pooled from
   *  several different original donations rather than tracing to just one. */
  donationId?: string;
  /** Present when the destination is a known institution (most cases) — kept
   *  alongside the snapshot below so the dashboard can group/filter by it. */
  destinationInstitutionId?: string;
  /** Snapshotted at creation time (the institution's shippingAddress, falling
   *  back to its address — or a neshama-only campaign's own custom shipping
   *  address when there's no institution at all) rather than re-read live, so
   *  a later address edit can't silently move an already-fulfilled shipment. */
  destinationAddress: Address;
  dedication: DonationDedication;
  stickerDesign?: StickerDesign;
  status: FulfillmentNeedStatus;
  /** Set once an admin assigns it into a vendor purchase order. */
  vendorPurchaseOrderId?: string;
  /** Set once grouped into an outbound shipment. */
  shipmentId?: string;
  createdAt: number;
}

export type VendorPurchaseOrderFulfillmentStatus = 'draft' | 'sent' | 'acknowledged' | 'shipped' | 'received';
export type VendorPurchaseOrderPaymentStatus = 'unpaid' | 'paid';

export const VENDOR_PO_FULFILLMENT_STATUSES: VendorPurchaseOrderFulfillmentStatus[] = [
  'draft',
  'sent',
  'acknowledged',
  'shipped',
  'received',
];

export interface VendorPurchaseOrderItem {
  seferId: string;
  quantity: number;
  /** Snapshotted from vendorPricing at the moment the item was added to this
   *  PO — what we pay the vendor, never the donor-facing retail price. */
  wholesalePriceEach: number;
}

/** What admin actually buys from one vendor — batched across as many
 *  FulfillmentNeeds (or pure restocking) as admin chooses to put in it. The
 *  vendor can only ever see it once fulfillmentStatus leaves 'draft' (see
 *  firestore.rules) — that's the "only once we send it" boundary. Payment is
 *  tracked independently of fulfillment, since admin might pay upfront, on
 *  delivery, or net-30 — this is a bookkeeping record, not a payment
 *  processor integration (no connection to the donor's own payment). */
export interface VendorPurchaseOrder {
  vendorPurchaseOrderId: string;
  vendorId: string;
  items: VendorPurchaseOrderItem[];
  linkedFulfillmentNeedIds: string[];
  fulfillmentStatus: VendorPurchaseOrderFulfillmentStatus;
  paymentStatus: VendorPurchaseOrderPaymentStatus;
  paidAt?: number;
  paidAmount?: number;
  paymentNote?: string;
  createdByUid: string;
  sentAt?: number;
  receivedAt?: number;
  createdAt: number;
}

/** Admin's own on-hand inventory, per sefer — credited when a
 *  VendorPurchaseOrder is received, debited when it fulfills a
 *  FulfillmentNeed. Deliberately has no required link to any vendor or
 *  donation: this is what lets a need be filled instantly instead of waiting
 *  on a fresh vendor order, and is the seed for eventually stocking/producing
 *  seforim outside the vendor marketplace entirely. */
export interface StockEntry {
  /** Doc id is the seferId itself. */
  seferId: string;
  quantity: number;
  updatedAt: number;
}

export type ShipmentStatus = 'packed' | 'shipped' | 'delivered';

export const SHIPMENT_STATUSES: ShipmentStatus[] = ['packed', 'shipped', 'delivered'];

/** Groups FulfillmentNeeds bound for the same destination into one outbound
 *  package — the "ship together to the same place" piece. */
export interface Shipment {
  shipmentId: string;
  destinationInstitutionId?: string;
  destinationAddress: Address;
  fulfillmentNeedIds: string[];
  status: ShipmentStatus;
  carrier?: string;
  trackingNumber?: string;
  shippedAt?: number;
  deliveredAt?: number;
  createdAt: number;
}
