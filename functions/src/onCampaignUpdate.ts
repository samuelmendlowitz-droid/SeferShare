import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import type { Campaign } from './types';

const MAX_MILESTONE = 10;

function correctMilestone(totalItemsFulfilled: number, totalItemsNeeded: number): number {
  for (let m = 1; m < MAX_MILESTONE; m += 1) {
    if (totalItemsFulfilled < Math.ceil(totalItemsNeeded * (m / MAX_MILESTONE))) return m;
  }
  return MAX_MILESTONE;
}

/**
 * Safety net for edits that bypass the donation algorithm (e.g. a campaigner adding
 * items via addItemsToCampaign): recomputes the 10% milestone band and resets the
 * progress clock if it's out of date (spec §7.2, §16).
 */
export const onCampaignUpdate = onDocumentUpdated('campaigns/{campaignId}', async (event) => {
  const before = event.data?.before.data() as Campaign | undefined;
  const after = event.data?.after.data() as Campaign | undefined;
  if (!before || !after) return;

  const correct = correctMilestone(after.totalItemsFulfilled, after.totalItemsNeeded);
  if (correct === after.currentMilestone) return;

  await event.data!.after.ref.update({
    currentMilestone: correct,
    lastProgressAt: Timestamp.now(),
    updatedAt: FieldValue.serverTimestamp(),
  });
});
