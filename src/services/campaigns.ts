import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Campaign, CampaignItem } from '../types';

const campaignsRef = collection(db, 'campaigns');

export async function listActiveCampaigns(): Promise<Campaign[]> {
  const snap = await getDocs(query(campaignsRef, where('status', '==', 'active'), orderBy('createdAt', 'desc')));
  return snap.docs.map((d) => ({ ...(d.data() as Campaign), campaignId: d.id }));
}

/** Fulfilled campaigns are hidden from browse but still searchable (spec §6.2). */
export async function searchCampaigns(): Promise<Campaign[]> {
  const snap = await getDocs(query(campaignsRef, orderBy('createdAt', 'desc')));
  return snap.docs.map((d) => ({ ...(d.data() as Campaign), campaignId: d.id }));
}

export async function listMyCampaigns(uid: string): Promise<Campaign[]> {
  const snap = await getDocs(query(campaignsRef, where('createdByUid', '==', uid), orderBy('createdAt', 'desc')));
  return snap.docs.map((d) => ({ ...(d.data() as Campaign), campaignId: d.id }));
}

export async function getCampaign(campaignId: string): Promise<Campaign | null> {
  const snap = await getDoc(doc(db, 'campaigns', campaignId));
  return snap.exists() ? { ...(snap.data() as Campaign), campaignId: snap.id } : null;
}

/**
 * All of an institution's campaigns (any status) — for the institution detail page.
 * Sorted client-side (rather than an indexed `orderBy`) since this is a single-field
 * equality query that Firestore serves with no composite index required.
 */
export async function listCampaignsByInstitution(institutionId: string): Promise<Campaign[]> {
  const snap = await getDocs(query(campaignsRef, where('institutionId', '==', institutionId)));
  return snap.docs
    .map((d) => ({ ...(d.data() as Campaign), campaignId: d.id }))
    .sort((a, b) => b.createdAt - a.createdAt);
}

/** All of a neshama's campaigns (any status) — for the neshama donate chooser. See above re: sorting. */
export async function listCampaignsByNeshama(neshamaId: string): Promise<Campaign[]> {
  const snap = await getDocs(query(campaignsRef, where('neshamaIds', 'array-contains', neshamaId)));
  return snap.docs
    .map((d) => ({ ...(d.data() as Campaign), campaignId: d.id }))
    .sort((a, b) => b.createdAt - a.createdAt);
}

/**
 * Active campaigns requesting a given sefer, for the Sefer detail popup.
 * `items` holds objects (not primitive values), so Firestore can't query this
 * with `array-contains` directly — filtered in memory instead, the same
 * pattern the campaign detail view already uses to resolve sefer names from
 * the full catalog.
 */
export async function listCampaignsBySefer(seferId: string): Promise<Campaign[]> {
  const campaigns = await listActiveCampaigns();
  return campaigns.filter((c) => c.items.some((item) => item.seferId === seferId));
}

export interface CreateCampaignInput {
  createdByUid: string;
  title?: string;
  description?: string;
  institutionId: string;
  neshamaIds?: string[];
  items: Omit<CampaignItem, 'quantityFulfilled'>[];
  shippingAddress: Campaign['shippingAddress'];
  language: Campaign['language'];
}

export async function createCampaign(input: CreateCampaignInput): Promise<string> {
  if (!input.institutionId) {
    throw new Error('A campaign must have an institution');
  }
  if (input.items.length === 0) {
    throw new Error('A campaign must have at least one item');
  }

  const items: CampaignItem[] = input.items.map((item) => ({ ...item, quantityFulfilled: 0 }));
  const totalItemsNeeded = items.reduce((sum, i) => sum + i.quantity, 0);

  const docRef = await addDoc(campaignsRef, {
    createdByUid: input.createdByUid,
    title: input.title ?? null,
    description: input.description ?? null,
    institutionId: input.institutionId,
    neshamaIds: input.neshamaIds ?? [],
    items,
    shippingAddress: input.shippingAddress,
    status: 'active',
    totalItemsNeeded,
    totalItemsFulfilled: 0,
    lastProgressAt: serverTimestamp(),
    currentMilestone: 1,
    language: input.language,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

/** Usable by the campaign's own creator or an admin, per Firestore rules. */
export async function deleteCampaign(campaignId: string): Promise<void> {
  await deleteDoc(doc(db, 'campaigns', campaignId));
}

export interface UpdateCampaignInput {
  title?: string;
  description?: string;
  institutionId: string;
  neshamaIds?: string[];
  items: CampaignItem[];
  shippingAddress: Campaign['shippingAddress'];
  language: Campaign['language'];
}

/**
 * Full edit of a campaign's own details by its owner. Deliberately never touches
 * totalItemsFulfilled/currentMilestone — those are server/algorithm-owned, and the
 * Firestore rule for campaigns rejects an owner update that changes them.
 */
export async function updateCampaign(campaignId: string, input: UpdateCampaignInput): Promise<void> {
  if (!input.institutionId) {
    throw new Error('A campaign must have an institution');
  }
  if (input.items.length === 0) {
    throw new Error('A campaign must have at least one item');
  }

  const totalItemsNeeded = input.items.reduce((sum, i) => sum + i.quantity, 0);
  const totalItemsFulfilled = input.items.reduce((sum, i) => sum + i.quantityFulfilled, 0);

  await updateDoc(doc(db, 'campaigns', campaignId), {
    title: input.title ?? null,
    description: input.description ?? null,
    institutionId: input.institutionId,
    neshamaIds: input.neshamaIds ?? [],
    items: input.items,
    shippingAddress: input.shippingAddress,
    totalItemsNeeded,
    // Editing a fulfilled campaign to need more can un-hide it from browse again;
    // it can never flip the other way (an owner edit can't mark items fulfilled).
    ...(totalItemsNeeded > totalItemsFulfilled ? { status: 'active' } : {}),
    language: input.language,
    updatedAt: serverTimestamp(),
  });
}
