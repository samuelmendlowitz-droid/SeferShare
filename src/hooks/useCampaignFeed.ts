import { useEffect, useMemo, useState } from 'react';
import type { Campaign, Institution, Neshama, Sefer } from '../types';
import { listActiveCampaigns, searchCampaigns } from '../services/campaigns';
import { listInstitutions } from '../services/institutions';
import { listNeshamos } from '../services/neshamos';
import { listSefarim } from '../services/sefarim';
import type { HomeFilter } from '../components/layout/AppLayout';

interface CampaignFeedState {
  loading: boolean;
  campaigns: Campaign[];
  institutionsById: Map<string, Institution>;
  neshamosById: Map<string, Neshama>;
  sefarimById: Map<string, Sefer>;
}

export function useCampaignFeed(filter: HomeFilter, searchQuery: string): CampaignFeedState {
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

    if (filter === 'where') result = result.filter((c) => !!c.institutionId);
    if (filter === 'who') result = result.filter((c) => !!c.neshamaId);
    if (filter === 'what') result = result.filter((c) => c.items.length > 0);

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
  }, [allCampaigns, filter, isSearching, searchQuery, institutionsById, neshamosById, sefarimById]);

  return { loading, campaigns, institutionsById, neshamosById, sefarimById };
}
