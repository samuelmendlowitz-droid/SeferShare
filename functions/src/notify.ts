import { FieldValue } from 'firebase-admin/firestore';
import { db } from './lib/firebaseAdmin';
import type { CampaignAssignment, NotificationKind } from './types';

interface NotifyInput {
  recipientUid: string;
  kind: NotificationKind;
  title: string;
  body: string;
  relatedCampaignId?: string;
  relatedDonationId?: string;
}

export async function notify(input: NotifyInput): Promise<void> {
  await db.collection('notifications').add({
    ...input,
    read: false,
    createdAt: FieldValue.serverTimestamp(),
  });
}

/** Notifies each campaign's creator that a donation (and optional message) landed on it (spec §12). */
export async function notifyCampaigners(
  assignments: CampaignAssignment[],
  donorMessage: string | undefined,
  donationId: string,
): Promise<void> {
  for (const assignment of assignments) {
    const campaignSnap = await db.collection('campaigns').doc(assignment.campaignId).get();
    if (!campaignSnap.exists) continue;
    const campaign = campaignSnap.data()!;

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
