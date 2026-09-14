import { useMemo } from 'react';
import type { Campaign, Institution, InstitutionType, SeferType } from '../types';
import { useCampaignFeedData } from './useCampaignFeed';

export type MekomosSortKey = 'name-az' | 'size';

export interface MekomosFeedOptions {
  institutionTypes?: InstitutionType[];
  sortKey?: MekomosSortKey;
}

export interface InstitutionSummary {
  institution: Institution;
  totalNeeded: number;
  totalFulfilled: number;
  seferTypes: SeferType[];
}

/** The Mekomos tab: institutions currently running at least one campaign, with
 *  their aggregate seforim need across all of them. */
export function useMekomosFeed(searchQuery: string, options: MekomosFeedOptions = {}) {
  const { institutionTypes = [], sortKey = 'name-az' } = options;
  const { loading, campaigns, institutionsById, sefarimById } = useCampaignFeedData(searchQuery);

  const institutions = useMemo<InstitutionSummary[]>(() => {
    const byInstitution = new Map<string, Campaign[]>();
    for (const c of campaigns) {
      if (!c.institutionId) continue;
      const list = byInstitution.get(c.institutionId) ?? [];
      list.push(c);
      byInstitution.set(c.institutionId, list);
    }

    let result: InstitutionSummary[] = [];
    for (const [institutionId, campaignsForInstitution] of byInstitution) {
      const institution = institutionsById.get(institutionId);
      if (!institution) continue;
      let totalNeeded = 0;
      let totalFulfilled = 0;
      const types = new Set<SeferType>();
      for (const c of campaignsForInstitution) {
        totalNeeded += c.totalItemsNeeded;
        totalFulfilled += c.totalItemsFulfilled;
        for (const item of c.items) {
          const sefer = sefarimById.get(item.seferId);
          if (sefer) types.add(sefer.type);
        }
      }
      result.push({ institution, totalNeeded, totalFulfilled, seferTypes: [...types] });
    }

    if (institutionTypes.length > 0) {
      result = result.filter((r) => institutionTypes.includes(r.institution.type));
    }

    result.sort((a, b) => {
      if (sortKey === 'size') return b.totalNeeded - a.totalNeeded;
      return a.institution.name.localeCompare(b.institution.name);
    });

    return result;
  }, [campaigns, institutionsById, sefarimById, institutionTypes, sortKey]);

  return { loading, institutions };
}
