import { FieldValue } from 'firebase-admin/firestore';
import { db } from './lib/firebaseAdmin';
import type { Campaign, CampaignAssignment, NotificationKind } from './types';

interface NotifyInput {
  recipientUid: string;
  kind: NotificationKind;
  title: string;
  body: string;
  relatedCampaignId?: string;
  relatedDonationId?: string;
  relatedVendorUid?: string;
}

export async function notify(input: NotifyInput): Promise<void> {
  await db.collection('notifications').add({
    ...input,
    read: false,
    createdAt: FieldValue.serverTimestamp(),
  });
}

/** Notifies each campaign's creator that a donation (and optional message) landed on it (spec §12).
 *  `campaignsById` is the same in-memory campaign data assignDonationToCampaigns already
 *  loaded to compute `assignments` — passed through so this doesn't refetch every campaign. */
export async function notifyCampaigners(
  assignments: CampaignAssignment[],
  campaignsById: Map<string, Campaign>,
  donorMessage: string | undefined,
  donationId: string,
): Promise<void> {
  for (const assignment of assignments) {
    const campaign = campaignsById.get(assignment.campaignId);
    if (!campaign) continue;

    await notify({
      recipientUid: campaign.createdByUid,
      kind: 'donation_received',
      title: 'A donation was made toward your campaign',
      body: donorMessage
        ? `${assignment.itemsFulfilled} sefer(s) donated. Message: "${donorMessage}"`
        : `${assignment.itemsFulfilled} sefer(s) donated.`,
      relatedCampaignId: assignment.campaignId,
      relatedDonationId: donationId,
    });

    if (campaign.status === 'fulfilled') {
      await notify({
        recipientUid: campaign.createdByUid,
        kind: 'campaign_fulfilled',
        title: 'Your campaign is fully fulfilled!',
        body: 'Every sefer on your campaign has been donated.',
        relatedCampaignId: assignment.campaignId,
      });
    }
  }
}
