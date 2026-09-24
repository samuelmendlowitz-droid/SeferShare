export type NotificationKind =
  | 'donation_received'
  | 'campaign_fulfilled'
  | 'payment_confirmed'
  | 'vendor_application_received'
  | 'vendor_application_approved'
  | 'vendor_application_declined'
  | 'institution_owner_application_received'
  | 'institution_owner_application_approved'
  | 'institution_owner_application_declined'
  | 'institution_verified';

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
  /** Set on institution_owner_application_* notifications — the applicant's uid. */
  relatedInstitutionOwnerUid?: string;
  /** Set on institution_verified — the institution that was verified. */
  relatedInstitutionId?: string;
  createdAt: number;
}
