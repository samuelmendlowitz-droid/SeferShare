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

export interface CreateCampaignInput {
  createdByUid: string;
  title?: string;
  description?: string;
  institutionId?: string;
  neshamaId?: string;
  items: Omit<CampaignItem, 'quantityFulfilled'>[];
  shippingAddress: Campaign['shippingAddress'];
  language: Campaign['language'];
}

export async function createCampaign(input: CreateCampaignInput): Promise<string> {
  if (!input.institutionId && !input.neshamaId) {
    throw new Error('A campaign must have at least an institution or a neshama');
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
    institutionId: input.institutionId ?? null,
    neshamaId: input.neshamaId ?? null,
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

/** Admin-only per Firestore rules — used to remove any campaign, not just your own. */
export async function deleteCampaign(campaignId: string): Promise<void> {
  await deleteDoc(doc(db, 'campaigns', campaignId));
}

export interface UpdateCampaignInput {
  title?: string;
  description?: string;
  institutionId?: string;
  neshamaId?: string;
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
  if (!input.institutionId && !input.neshamaId) {
    throw new Error('A campaign must have at least an institution or a neshama');
  }
  if (input.items.length === 0) {
    throw new Error('A campaign must have at least one item');
  }

  const totalItemsNeeded = input.items.reduce((sum, i) => sum + i.quantity, 0);
  const totalItemsFulfilled = input.items.reduce((sum, i) => sum + i.quantityFulfilled, 0);

  await updateDoc(doc(db, 'campaigns', campaignId), {
    title: input.title ?? null,
    description: input.description ?? null,
    institutionId: input.institutionId ?? null,
    neshamaId: input.neshamaId ?? null,
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
