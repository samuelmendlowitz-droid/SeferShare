export type NotificationKind =
  | 'donation_received'
  | 'campaign_fulfilled'
  | 'payment_confirmed'
  | 'order_shipped'
  | 'vendor_application_received'
  | 'vendor_application_approved'
  | 'vendor_application_declined';

export interface Notification {
  notificationId: string;
  recipientUid: string;
  kind: NotificationKind;
  title: string;
  body: string;
  read: boolean;
  relatedCampaignId?: string;
  relatedDonationId?: string;
  /** Set on vendor_application_* notifications — the applicant's uid. */
  relatedVendorUid?: string;
  createdAt: number;
}
