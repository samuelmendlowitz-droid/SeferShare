import {
  addDoc,
  collection,
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
  return snap.docs.map((d) => d.data() as Campaign);
}

/** Fulfilled campaigns are hidden from browse but still searchable (spec §6.2). */
export async function searchCampaigns(): Promise<Campaign[]> {
  const snap = await getDocs(query(campaignsRef, orderBy('createdAt', 'desc')));
  return snap.docs.map((d) => d.data() as Campaign);
}

export async function listMyCampaigns(uid: string): Promise<Campaign[]> {
  const snap = await getDocs(query(campaignsRef, where('createdByUid', '==', uid), orderBy('createdAt', 'desc')));
  return snap.docs.map((d) => d.data() as Campaign);
}

export async function getCampaign(campaignId: string): Promise<Campaign | null> {
  const snap = await getDoc(doc(db, 'campaigns', campaignId));
  return snap.exists() ? (snap.data() as Campaign) : null;
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

export async function addItemsToCampaign(campaignId: string, newItems: Omit<CampaignItem, 'quantityFulfilled'>[]) {
  const campaign = await getCampaign(campaignId);
  if (!campaign) throw new Error('Campaign not found');
  const items = [...campaign.items, ...newItems.map((i) => ({ ...i, quantityFulfilled: 0 }))];
  const totalItemsNeeded = items.reduce((sum, i) => sum + i.quantity, 0);
  await updateDoc(doc(db, 'campaigns', campaignId), {
    items,
    totalItemsNeeded,
    status: 'active',
    updatedAt: serverTimestamp(),
  });
}
