export type NotificationKind =
  | 'donation_received'
  | 'campaign_fulfilled'
  | 'payment_confirmed'
  | 'order_shipped';

export interface Notification {
  notificationId: string;
  recipientUid: string;
  kind: NotificationKind;
  title: string;
  body: string;
  read: boolean;
  relatedCampaignId?: string;
  relatedDonationId?: string;
  createdAt: number;
}
