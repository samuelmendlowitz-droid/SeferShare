import { useEffect, useMemo, useState } from 'react';
import type { Campaign, Institution, InstitutionType, Neshama, Sefer, SeferType } from '../types';
import { listActiveCampaigns, searchCampaigns } from '../services/campaigns';
import { listInstitutions } from '../services/institutions';
import { listNeshamos } from '../services/neshamos';
import { listSefarim } from '../services/sefarim';

export type HomeSortKey = 'recommended' | 'institution-az' | 'neshama-az' | 'sefer-az';

export interface CampaignFeedBase {
  loading: boolean;
  /** Search-matched, and with fulfilled campaigns hidden unless actively searching —
   *  not yet filtered/sorted for any particular tab. */
  campaigns: Campaign[];
  institutionsById: Map<string, Institution>;
  neshamosById: Map<string, Neshama>;
  sefarimById: Map<string, Sefer>;
}

export interface CampaignFeedOptions {
  institutionTypes?: InstitutionType[];
  seferTypes?: SeferType[];
  sortKey?: HomeSortKey;
}

/** Campaign's earliest-alphabetically sefer name, for the "Sefer A-Z" sort. */
function firstSeferName(campaign: Campaign, sefarimById: Map<string, Sefer>): string {
  const names = campaign.items
    .map((item) => sefarimById.get(item.seferId)?.englishName)
    .filter((n): n is string => Boolean(n));
  return names.sort()[0] ?? '';
}

/**
 * Shared base data for every Home tab: all campaigns (search-matched, fulfilled
 * hidden when not searching) plus institution/neshama/sefer lookup maps. Each tab
 * layers its own aggregation/filtering/sorting on top of this.
 */
export function useCampaignFeedData(searchQuery: string): CampaignFeedBase {
  const [loading, setLoading] = useState(true);
  const [allCampaigns, setAllCampaigns] = useState<Campaign[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [neshamos, setNeshamos] = useState<Neshama[]>([]);
  const [sefarim, setSefarim] = useState<Sefer[]>([]);

  const isSearching = searchQuery.trim().length > 0;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      isSearching ? searchCampaigns() : listActiveCampaigns(),
      listInstitutions(),
      listNeshamos(),
      listSefarim(),
    ])
      .then(([campaigns, insts, nesh, sef]) => {
        if (cancelled) return;
        setAllCampaigns(campaigns);
        setInstitutions(insts);
        setNeshamos(nesh);
        setSefarim(sef);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSearching]);

  const institutionsById = useMemo(
    () => new Map(institutions.map((i) => [i.institutionId, i])),
    [institutions],
  );
  const neshamosById = useMemo(() => new Map(neshamos.map((n) => [n.neshamaId, n])), [neshamos]);
  const sefarimById = useMemo(() => new Map(sefarim.map((s) => [s.seferId, s])), [sefarim]);

  const campaigns = useMemo(() => {
    let result = allCampaigns;

    if (isSearching) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((c) => {
        const institution = c.institutionId ? institutionsById.get(c.institutionId) : undefined;
        const neshama = c.neshamaId ? neshamosById.get(c.neshamaId) : undefined;
        const matchesInstitution =
          institution &&
          (institution.name.toLowerCase().includes(q) || institution.hebrewName?.includes(q));
        const matchesNeshama =
          neshama && (neshama.name.toLowerCase().includes(q) || neshama.hebrewName?.includes(q));
        const matchesSefer = c.items.some((item) => {
          const sefer = sefarimById.get(item.seferId);
          return (
            sefer &&
            (sefer.englishName.toLowerCase().includes(q) ||
              sefer.hebrewName.includes(q) ||
              sefer.phoneticName.toLowerCase().includes(q))
          );
        });
        return matchesInstitution || matchesNeshama || matchesSefer;
      });
    } else {
      // Fulfilled campaigns are hidden from the default browse view (spec §6.2).
      result = result.filter((c) => c.status !== 'fulfilled');
    }

    return result;
  }, [allCampaigns, isSearching, searchQuery, institutionsById, neshamosById, sefarimById]);

  return { loading, campaigns, institutionsById, neshamosById, sefarimById };
}

/** The "All Campaigns" tab: the shared base list, filtered/sorted by its own controls. */
export function useCampaignFeed(searchQuery: string, options: CampaignFeedOptions = {}): CampaignFeedBase {
  const { institutionTypes = [], seferTypes = [], sortKey = 'recommended' } = options;
  const base = useCampaignFeedData(searchQuery);

  const campaigns = useMemo(() => {
    let result = base.campaigns;

    if (institutionTypes.length > 0) {
      result = result.filter((c) => {
        const institution = c.institutionId ? base.institutionsById.get(c.institutionId) : undefined;
        return institution && institutionTypes.includes(institution.type);
      });
    }
    if (seferTypes.length > 0) {
      result = result.filter((c) =>
        c.items.some((item) => {
          const sefer = base.sefarimById.get(item.seferId);
          return sefer && seferTypes.includes(sefer.type);
        }),
      );
    }

    result = [...result].sort((a, b) => {
      if (sortKey === 'institution-az') {
        const an = a.institutionId ? base.institutionsById.get(a.institutionId)?.name ?? '' : '';
        const bn = b.institutionId ? base.institutionsById.get(b.institutionId)?.name ?? '' : '';
        if (!an && !bn) return 0;
        if (!an) return 1;
        if (!bn) return -1;
        return an.localeCompare(bn);
      }
      if (sortKey === 'neshama-az') {
        const an = a.neshamaId ? base.neshamosById.get(a.neshamaId)?.name ?? '' : '';
        const bn = b.neshamaId ? base.neshamosById.get(b.neshamaId)?.name ?? '' : '';
        if (!an && !bn) return 0;
        if (!an) return 1;
        if (!bn) return -1;
        return an.localeCompare(bn);
      }
      if (sortKey === 'sefer-az') {
        return firstSeferName(a, base.sefarimById).localeCompare(firstSeferName(b, base.sefarimById));
      }
      // "recommended" (default): campaigns that have gone longest without progress
      // toward their next 10% milestone surface first, nudging donors toward them.
      return a.lastProgressAt - b.lastProgressAt;
    });

    return result;
  }, [base.campaigns, base.institutionsById, base.neshamosById, base.sefarimById, institutionTypes, seferTypes, sortKey]);

  return { ...base, campaigns };
}
