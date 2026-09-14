import { db } from './lib/firebaseAdmin';
import type { DonationDedication, DonationItem, Neshama, Sefer } from './types';

export type DonationStickerSource = 'donor' | 'campaign' | 'algorithm';

export interface DonationSticker {
  seferId: string;
  vendorId: string;
  copyIndex: number;
  dedication: DonationDedication;
  source: DonationStickerSource;
}

interface Candidate {
  neshama: Neshama;
  /** Advances in-memory as picks are made, so consecutive picks within the same
   *  donation prefer a different neshama rather than repeating one (spec: "a
   *  different name on each Sefer"), while still favoring the longest-waiting
   *  neshama overall across donations. */
  virtualLastDedicatedAt: number;
}

function pickCandidate(candidates: Candidate[], seferId: string, seferType: string | undefined): Candidate | undefined {
  const eligible = candidates.filter(
    (c) => (c.neshama.seferIds ?? []).includes(seferId) || (seferType && (c.neshama.seferTypes ?? []).includes(seferType)),
  );
  const pool = eligible.length > 0 ? eligible : candidates;
  if (pool.length === 0) return undefined;
  return pool.reduce((best, c) => (c.virtualLastDedicatedAt < best.virtualLastDedicatedAt ? c : best));
}

/**
 * Decides the dedication printed on each physical Sefer copy in a donation (spec:
 * "the donators always choose the name that appears on the sticker, if they don't
 * add one it takes the first option that's on the campaign, if the campaign doesn't
 * have a neshama then it picks names from the algorithm with a different name on
 * each Sefer, based on who's gone longest without a dedication").
 *
 * Priority: the donor's cart-wide pick, when set, wins for every copy outright.
 * Otherwise each item tagged to a specific campaign (see algorithm.ts Pass 0) uses
 * that campaign's first neshama when it has one; everything else — plain items, or
 * campaign items whose campaign has no neshama — gets an algorithm pick.
 */
export async function assignStickerDedications(
  items: DonationItem[],
  donorDedication: DonationDedication | null | undefined,
): Promise<DonationSticker[]> {
  const stickers: DonationSticker[] = [];

  if (donorDedication) {
    for (const item of items) {
      for (let copyIndex = 0; copyIndex < item.quantity; copyIndex++) {
        stickers.push({ seferId: item.seferId, vendorId: item.vendorId, copyIndex, dedication: donorDedication, source: 'donor' });
      }
    }
    return stickers;
  }

  const campaignIds = [...new Set(items.map((i) => i.campaignId).filter((id): id is string => Boolean(id)))];
  const campaignNeshamaByCampaignId = new Map<string, Neshama>();
  if (campaignIds.length > 0) {
    const campaignSnaps = await Promise.all(campaignIds.map((id) => db.collection('campaigns').doc(id).get()));
    const firstNeshamaIdByCampaignId = new Map<string, string>();
    campaignSnaps.forEach((snap, idx) => {
      const neshamaId = (snap.data()?.neshamaIds as string[] | undefined)?.[0];
      if (neshamaId) firstNeshamaIdByCampaignId.set(campaignIds[idx], neshamaId);
    });
    const neshamaIds = [...new Set(firstNeshamaIdByCampaignId.values())];
    if (neshamaIds.length > 0) {
      const neshamaSnaps = await Promise.all(neshamaIds.map((id) => db.collection('neshamos').doc(id).get()));
      const neshamasById = new Map<string, Neshama>();
      neshamaSnaps.forEach((snap) => {
        if (snap.exists) neshamasById.set(snap.id, { ...(snap.data() as Neshama), neshamaId: snap.id });
      });
      for (const [campaignId, neshamaId] of firstNeshamaIdByCampaignId) {
        const neshama = neshamasById.get(neshamaId);
        if (neshama) campaignNeshamaByCampaignId.set(campaignId, neshama);
      }
    }
  }

  const needsAlgorithm: { item: DonationItem; copyIndex: number }[] = [];
  for (const item of items) {
    const campaignNeshama = item.campaignId ? campaignNeshamaByCampaignId.get(item.campaignId) : undefined;
    if (campaignNeshama) {
      for (let copyIndex = 0; copyIndex < item.quantity; copyIndex++) {
        stickers.push({
          seferId: item.seferId,
          vendorId: item.vendorId,
          copyIndex,
          dedication: {
            name: campaignNeshama.name,
            hebrewName: campaignNeshama.hebrewName,
            parentGender: campaignNeshama.parentGender,
            fatherHebrewName: campaignNeshama.fatherHebrewName,
          },
          source: 'campaign',
        });
      }
    } else {
      for (let copyIndex = 0; copyIndex < item.quantity; copyIndex++) {
        needsAlgorithm.push({ item, copyIndex });
      }
    }
  }

  if (needsAlgorithm.length === 0) return stickers;

  const seferIds = [...new Set(needsAlgorithm.map((n) => n.item.seferId))];
  const seferSnaps = await Promise.all(seferIds.map((id) => db.collection('sefarim').doc(id).get()));
  const seferTypeById = new Map<string, string>();
  seferSnaps.forEach((snap, idx) => {
    const sefer = snap.data() as Sefer | undefined;
    if (sefer) seferTypeById.set(seferIds[idx], sefer.type);
  });

  const neshamosSnap = await db.collection('neshamos').get();
  const candidates: Candidate[] = neshamosSnap.docs.map((d) => {
    const neshama = { ...(d.data() as Neshama), neshamaId: d.id };
    return { neshama, virtualLastDedicatedAt: neshama.lastDedicatedAt ?? 0 };
  });

  const usedNeshamaIds = new Set<string>();
  for (const { item, copyIndex } of needsAlgorithm) {
    const pick = pickCandidate(candidates, item.seferId, seferTypeById.get(item.seferId));
    if (!pick) continue;
    pick.virtualLastDedicatedAt = Date.now();
    usedNeshamaIds.add(pick.neshama.neshamaId);
    stickers.push({
      seferId: item.seferId,
      vendorId: item.vendorId,
      copyIndex,
      dedication: {
        name: pick.neshama.name,
        hebrewName: pick.neshama.hebrewName,
        parentGender: pick.neshama.parentGender,
        fatherHebrewName: pick.neshama.fatherHebrewName,
      },
      source: 'algorithm',
    });
  }

  if (usedNeshamaIds.size > 0) {
    const batch = db.batch();
    const now = Date.now();
    for (const id of usedNeshamaIds) {
      batch.update(db.collection('neshamos').doc(id), { lastDedicatedAt: now });
    }
    await batch.commit();
  }

  return stickers;
}
