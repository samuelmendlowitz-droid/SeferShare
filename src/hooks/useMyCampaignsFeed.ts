import { useEffect, useMemo, useState } from 'react';
import type { Campaign, Institution, Neshama, Sefer, SeferType } from '../types';
import { listMyCampaigns } from '../services/campaigns';
import { listInstitutions } from '../services/institutions';
import { listNeshamos } from '../services/neshamos';
import { listSefarim } from '../services/sefarim';

export type MyCampaignsSortKey = 'size' | 'institution-az' | 'neshama-az';

export interface MyCampaignsFilters {
  institutionIds: string[];
  neshamaIds: string[];
  seferTypes: SeferType[];
}

interface UseMyCampaignsFeedResult {
  loading: boolean;
  campaigns: Campaign[];
  institutionsById: Map<string, Institution>;
  neshamosById: Map<string, Neshama>;
  sefarimById: Map<string, Sefer>;
  availableInstitutions: Institution[];
  availableNeshamas: Neshama[];
  availableSeferTypes: SeferType[];
  hasInstitutionCampaigns: boolean;
  hasNeshamaCampaigns: boolean;
}

export function useMyCampaignsFeed(
  uid: string | undefined,
  filters: MyCampaignsFilters,
  sortKey: MyCampaignsSortKey,
): UseMyCampaignsFeedResult {
  const [loading, setLoading] = useState(true);
  const [myCampaigns, setMyCampaigns] = useState<Campaign[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [neshamos, setNeshamos] = useState<Neshama[]>([]);
  const [sefarim, setSefarim] = useState<Sefer[]>([]);

  useEffect(() => {
    if (!uid) return;
    setLoading(true);
    Promise.all([listMyCampaigns(uid), listInstitutions(), listNeshamos(), listSefarim()])
      .then(([c, insts, nesh, sef]) => {
        setMyCampaigns(c);
        setInstitutions(insts);
        setNeshamos(nesh);
        setSefarim(sef);
      })
      .finally(() => setLoading(false));
  }, [uid]);

  const institutionsById = useMemo(() => new Map(institutions.map((i) => [i.institutionId, i])), [institutions]);
  const neshamosById = useMemo(() => new Map(neshamos.map((n) => [n.neshamaId, n])), [neshamos]);
  const sefarimById = useMemo(() => new Map(sefarim.map((s) => [s.seferId, s])), [sefarim]);

  const availableInstitutions = useMemo(() => {
    const ids = new Set(myCampaigns.map((c) => c.institutionId).filter((id): id is string => Boolean(id)));
    return [...ids].map((id) => institutionsById.get(id)).filter((i): i is Institution => Boolean(i));
  }, [myCampaigns, institutionsById]);

  const availableNeshamas = useMemo(() => {
    const ids = new Set(myCampaigns.map((c) => c.neshamaId).filter((id): id is string => Boolean(id)));
    return [...ids].map((id) => neshamosById.get(id)).filter((n): n is Neshama => Boolean(n));
  }, [myCampaigns, neshamosById]);

  const availableSeferTypes = useMemo(() => {
    const types = new Set<SeferType>();
    myCampaigns.forEach((c) =>
      c.items.forEach((item) => {
        const sefer = sefarimById.get(item.seferId);
        if (sefer) types.add(sefer.type);
      }),
    );
    return [...types];
  }, [myCampaigns, sefarimById]);

  const hasInstitutionCampaigns = myCampaigns.some((c) => !!c.institutionId);
  const hasNeshamaCampaigns = myCampaigns.some((c) => !!c.neshamaId);

  const campaigns = useMemo(() => {
    let result = myCampaigns;

    if (filters.institutionIds.length > 0) {
      result = result.filter((c) => c.institutionId && filters.institutionIds.includes(c.institutionId));
    }
    if (filters.neshamaIds.length > 0) {
      result = result.filter((c) => c.neshamaId && filters.neshamaIds.includes(c.neshamaId));
    }
    if (filters.seferTypes.length > 0) {
      result = result.filter((c) =>
        c.items.some((item) => {
          const sefer = sefarimById.get(item.seferId);
          return sefer && filters.seferTypes.includes(sefer.type);
        }),
      );
    }

    result = [...result].sort((a, b) => {
      if (sortKey === 'institution-az') {
        const an = a.institutionId ? institutionsById.get(a.institutionId)?.name ?? '' : '';
        const bn = b.institutionId ? institutionsById.get(b.institutionId)?.name ?? '' : '';
        if (!an && !bn) return 0;
        if (!an) return 1;
        if (!bn) return -1;
        return an.localeCompare(bn);
      }
      if (sortKey === 'neshama-az') {
        const an = a.neshamaId ? neshamosById.get(a.neshamaId)?.name ?? '' : '';
        const bn = b.neshamaId ? neshamosById.get(b.neshamaId)?.name ?? '' : '';
        if (!an && !bn) return 0;
        if (!an) return 1;
        if (!bn) return -1;
        return an.localeCompare(bn);
      }
      // "size" (default): biggest campaigns (most items needed) first.
      return b.totalItemsNeeded - a.totalItemsNeeded;
    });

    return result;
  }, [myCampaigns, filters, sortKey, institutionsById, neshamosById, sefarimById]);

  return {
    loading,
    campaigns,
    institutionsById,
    neshamosById,
    sefarimById,
    availableInstitutions,
    availableNeshamas,
    availableSeferTypes,
    hasInstitutionCampaigns,
    hasNeshamaCampaigns,
  };
}
