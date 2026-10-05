import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { listInstitutions } from '../services/institutions';
import { listNeshamos } from '../services/neshamos';
import { AppLayout, type CommunityTab } from '../components/layout/AppLayout';
import { Card } from '../components/ui/Card';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { institutionTypeText } from '../lib/institutionFormat';
import { neshamaDedicationLine } from '../lib/neshamaFormat';
import type { Institution, InstitutionType, Neshama } from '../types';

const INSTITUTION_TAB_TYPE: Partial<Record<CommunityTab, InstitutionType>> = {
  shuls: 'shul',
  yeshivas: 'yeshiva',
  kolels: 'kolel',
  schools: 'school',
  otherInstitutions: 'other',
};

/** Neshamas & Mokomos: browse institutions by type, plus Rabbeim and
 *  Neshamas. Rabbeim (people flagged isRabbi at creation — see
 *  NeshamaCreateForm) are always listed; ordinary neshamas need a search
 *  first, since donors can quick-add any number of them and an unsearched
 *  flat list would just be noise. */
export function CommunityPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { showBilingual } = useLanguage();
  const [tab, setTab] = useState<CommunityTab>('shuls');
  const [searchQuery, setSearchQuery] = useState('');

  const [institutions, setInstitutions] = useState<Institution[] | undefined>(undefined);
  const [neshamos, setNeshamos] = useState<Neshama[] | undefined>(undefined);

  useEffect(() => {
    listInstitutions().then(setInstitutions);
    listNeshamos().then(setNeshamos);
  }, []);

  const institutionType = INSTITUTION_TAB_TYPE[tab];
  const isNeshamaTab = tab === 'rabbeim' || tab === 'neshamas';

  const filteredInstitutions = useMemo(() => {
    if (!institutions || !institutionType) return [];
    const q = searchQuery.trim().toLowerCase();
    return institutions
      .filter((inst) => inst.type === institutionType)
      .filter((inst) => !q || inst.name.toLowerCase().includes(q) || inst.hebrewName?.includes(q));
  }, [institutions, institutionType, searchQuery]);

  const filteredNeshamos = useMemo(() => {
    if (!neshamos) return [];
    const wantRabbi = tab === 'rabbeim';
    const q = searchQuery.trim().toLowerCase();
    let list = neshamos.filter((n) => Boolean(n.isRabbi) === wantRabbi);
    if (q) {
      list = list.filter((n) => n.name.toLowerCase().includes(q) || n.hebrewName?.includes(q));
    }
    return list;
  }, [neshamos, tab, searchQuery]);

  const loading = isNeshamaTab ? neshamos === undefined : institutions === undefined;
  // Rabbeim are always browsable; ordinary neshamas need a search typed first.
  const needsSearchFirst = tab === 'neshamas' && !searchQuery.trim();

  function handleCreate() {
    navigate(isNeshamaTab ? '/neshamos/new' : '/institutions/new');
  }

  return (
    <AppLayout
      variant="community"
      tab={tab}
      onTabChange={setTab}
      onSearch={setSearchQuery}
      createAction={{ caption: isNeshamaTab ? t('neshama.addNew') : t('institution.addNew'), onClick: handleCreate }}
    >
      <h1 className="mb-4 text-xl font-bold">{t('nav.community')}</h1>

      {loading ? (
        <LoadingSpinner />
      ) : !isNeshamaTab ? (
        filteredInstitutions.length === 0 ? (
          <p className="text-text-muted">{t('actions.noResults')}</p>
        ) : (
          <div className="space-y-2">
            {filteredInstitutions.map((inst) => (
              <Card
                key={inst.institutionId}
                className="cursor-pointer transition-transform duration-200 hover:-translate-y-0.5"
                onClick={() => navigate(`/institutions/${inst.institutionId}`)}
              >
                <p className="text-sm font-semibold">{inst.name}</p>
                {inst.hebrewName && <p className="text-xs text-text-muted">{inst.hebrewName}</p>}
                <p className="mt-1 text-xs text-text-muted">
                  {institutionTypeText(inst.type, inst.customType, t(`institution.${inst.type}`))}
                  {inst.address.city ? ` · ${inst.address.city}${inst.address.state ? `, ${inst.address.state}` : ''}` : ''}
                </p>
              </Card>
            ))}
          </div>
        )
      ) : needsSearchFirst ? (
        <p className="text-text-muted">{t('neshama.searchToFindHint')}</p>
      ) : filteredNeshamos.length === 0 ? (
        <p className="text-text-muted">{t('actions.noResults')}</p>
      ) : (
        <div className="space-y-2">
          {filteredNeshamos.map((n) => (
            <Card
              key={n.neshamaId}
              className="cursor-pointer transition-transform duration-200 hover:-translate-y-0.5"
              onClick={() => navigate(`/neshamos/${n.neshamaId}`)}
            >
              <p className="text-sm font-semibold">{neshamaDedicationLine(n, showBilingual)}</p>
            </Card>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
